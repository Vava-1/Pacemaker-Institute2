import { Hono } from "hono";
import Stripe from "stripe";
import { eq, sql } from "drizzle-orm";
import { env } from "./env";
import { logger } from "./logger";
import { getDb } from "../queries/connection";
import { enrollments, courses, userSubscriptions, users, processedWebhooks } from "@db/schema";
import { sendEnrollmentConfirmationEmail } from "./mailer";

export const webhookRouter = new Hono();

webhookRouter.post("/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ success: false, error: "Missing stripe-signature header" }, 400);
  }

  if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
    logger.error("Stripe webhook called but not configured");
    return c.json({ success: false, error: "Stripe is not configured" }, 500);
  }

  const stripe = new Stripe(env.stripeSecretKey);
  const body = await c.req.text();

  if (!body) {
    return c.json({ success: false, error: "Empty request body" }, 400);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch (err: any) {
    logger.error("Stripe webhook signature verification failed", { message: err?.message });
    return c.json({ success: false, error: "Invalid signature" }, 400);
  }

  logger.info("Stripe webhook received", { type: event.type, id: event.id });

  const db = getDb();
  const existing = await db.select().from(processedWebhooks).where(eq(processedWebhooks.eventId, event.id)).limit(1);
  if (existing.length > 0) {
    logger.info("Webhook already processed", { eventId: event.id });
    return c.json({ success: true, alreadyProcessed: true });
  }

  let processingError: Error | null = null;
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.payment_status !== "paid") {
          logger.info("Checkout session not paid yet", { sessionId: session.id });
          break;
        }

        const userId = session.metadata?.userId;
        if (!userId) {
          // Permanent client error — return 400 so Stripe doesn't retry forever.
          return c.json({ success: false, error: "Missing userId in session metadata" }, 400);
        }

        if (session.metadata?.courseId) {
          const db = getDb();
          await db.insert(enrollments).values({
            userId: parseInt(userId),
            courseId: parseInt(session.metadata.courseId),
            progress: 0,
            paymentStatus: "paid",
            paymentIntentId: session.payment_intent as string,
          });

          await db.update(courses)
            .set({ totalStudents: sql`${courses.totalStudents} + 1` })
            .where(eq(courses.id, parseInt(session.metadata.courseId)));

          const userRows = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
          const courseRows = await db.select().from(courses).where(eq(courses.id, parseInt(session.metadata.courseId))).limit(1);

          if (userRows[0] && courseRows[0]) {
            sendEnrollmentConfirmationEmail(
              userRows[0].email,
              userRows[0].name,
              courseRows[0].title,
              `${env.frontendUrl}/courses/${courseRows[0].slug}`
            ).catch((err) => logger.error("Failed to send enrollment email", { error: err }));
          }

          logger.info("Enrollment created from checkout", { userId, courseId: session.metadata.courseId });
        }

        if (session.metadata?.subscriptionType) {
          const db = getDb();
          await db.insert(userSubscriptions).values({
            userId: parseInt(userId),
            planId: 0,
            stripeSubscriptionId: session.subscription as string,
            plan: session.metadata.subscriptionType,
            status: "active",
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });
          logger.info("Subscription created from checkout", { userId, subscriptionType: session.metadata.subscriptionType });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const rawSubId = invoice.parent?.subscription_details?.subscription;
        const subId = typeof rawSubId === "string" ? rawSubId : rawSubId?.id;
        if (subId) {
          const db = getDb();
          await db.update(userSubscriptions)
            .set({
              status: "active",
              startedAt: new Date(invoice.period_start * 1000),
              expiresAt: new Date(invoice.period_end * 1000),
            })
            .where(eq(userSubscriptions.stripeSubscriptionId, subId));
          logger.info("Subscription payment succeeded", { subscriptionId: subId });
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice;
        const failedRaw = failedInvoice.parent?.subscription_details?.subscription;
        const failedSubId = typeof failedRaw === "string" ? failedRaw : failedRaw?.id;
        if (failedSubId) {
          const db = getDb();
          await db.update(userSubscriptions)
            .set({ status: "past_due" })
            .where(eq(userSubscriptions.stripeSubscriptionId, failedSubId));
          logger.warn("Subscription payment failed", { subscriptionId: failedSubId });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as Stripe.Subscription;
        const db = getDb();
        await db.update(userSubscriptions)
          .set({ status: "cancelled" })
          .where(eq(userSubscriptions.stripeSubscriptionId, deletedSub.id));
        logger.info("Subscription cancelled", { subscriptionId: deletedSub.id });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        if (paymentIntentId) {
          const db = getDb();
          await db.update(enrollments)
            .set({ paymentStatus: "refunded" })
            .where(eq(enrollments.paymentIntentId, paymentIntentId));
          logger.info("Charge refunded", { paymentIntentId });
        }
        break;
      }

      default:
        logger.info("Unhandled webhook event type", { type: event.type });
    }
  } catch (err: any) {
    processingError = err;
    logger.error("Webhook handler error", { type: event.type, error: err.message, stack: err.stack });
  }

  if (processingError) {
    // Transient errors (DB down, race) — return 500 so Stripe retries.
    // Do NOT record the event as processed.
    return c.json({ success: false, error: "Webhook processing failed — will be retried" }, 500);
  }

  // Success — record idempotency key.
  await db.insert(processedWebhooks).values({
    eventId: event.id,
    eventType: event.type,
  }).catch(() => { /* ignore duplicate key errors */ });

  return c.json({ success: true, received: true });
});
