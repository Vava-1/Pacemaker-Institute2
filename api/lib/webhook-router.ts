import { Hono } from "hono";
import Stripe from "stripe";
import { env } from "./env";
import { getDb } from "../queries/connection";
import { payments, enrollments, courses } from "@db/schema";
import { eq, sql } from "drizzle-orm";

export const webhookRouter = new Hono();

webhookRouter.post("/stripe", async (c) => {
  if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
    return c.json({ error: "Stripe is not configured" }, 500);
  }

  const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2023-10-16" });
  
  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ error: "Missing stripe signature" }, 400);
  }

  const body = await c.req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return c.json({ error: "Webhook Error" }, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const db = getDb();

    // Find the pending payment
    const pendingPayments = await db.select().from(payments)
      .where(eq(payments.stripeSessionId, session.id)).limit(1);
    
    const payment = pendingPayments[0];

    if (payment) {
      // Mark payment as paid
      await db.update(payments).set({
        status: "completed",
        stripePaymentIntentId: session.payment_intent as string,
      }).where(eq(payments.id, payment.id));

      // Enroll user in course
      await db.insert(enrollments).values({
        userId: payment.userId,
        courseId: payment.courseId,
        progress: 0,
      });

      // Increment course student count
      await db.update(courses)
        .set({ totalStudents: sql`${courses.totalStudents} + 1` })
        .where(eq(courses.id, payment.courseId));
    }
  }

  return c.json({ received: true });
});
