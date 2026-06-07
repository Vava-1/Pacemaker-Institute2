import { Hono } from "hono";
import Stripe from "stripe";
import { env } from "./env";
import { logger } from "./logger";
import { getDb } from "../queries/connection";
import { payments, enrollments, courses } from "@db/schema";
import { eq, sql } from "drizzle-orm";

export const webhookRouter = new Hono();

webhookRouter.post("/stripe", async (c) => {
  if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
    return c.json({ success: false, error: "Stripe is not configured" }, 500);
  }

  const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2026-05-27.dahlia" });

  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ success: false, error: "Missing stripe-signature header" }, 400);
  }

  const body = await c.req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch (err: any) {
    logger.error("Stripe webhook signature verification failed", { message: err?.message });
    return c.json({ success: false, error: "Invalid signature" }, 400);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const db = getDb();

      const pendingPayments = await db.select().from(payments)
        .where(eq(payments.stripeSessionId, session.id)).limit(1);

      const payment = pendingPayments[0];

      if (payment) {
        await db.update(payments).set({
          status: "completed",
          stripePaymentIntentId: session.payment_intent as string,
        }).where(eq(payments.id, payment.id));

        await db.insert(enrollments).values({
          userId: payment.userId,
          courseId: payment.courseId,
          progress: 0,
        });

        await db.update(courses)
          .set({ totalStudents: sql`${courses.totalStudents} + 1` })
          .where(eq(courses.id, payment.courseId));

        logger.info("Stripe checkout completed, user enrolled", {
          paymentId: payment.id,
          userId: payment.userId,
          courseId: payment.courseId,
        });
      } else {
        logger.warn("Stripe webhook: no matching payment found", { sessionId: session.id });
      }
    }
  } catch (err: any) {
    logger.error("Stripe webhook handler crashed", { message: err?.message });
    return c.json({ success: false, error: "Handler error" }, 500);
  }

  return c.json({ success: true, received: true });
});
