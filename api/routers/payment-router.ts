import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { createRouter, protectedProcedure } from "../trpc";
import { getDb } from "../queries/connection";
import { courses, enrollments } from "@db/schema";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

const CreateCheckoutSchema = z.object({
  courseId: z.number().positive("Course ID must be positive"),
  priceId: z.string().startsWith("price_", "Price ID must start with 'price_'"),
  successUrl: z.string().url("Success URL must be a valid URL"),
  cancelUrl: z.string().url("Cancel URL must be a valid URL"),
});

const CreateSubscriptionSchema = z.object({
  priceId: z.string().startsWith("price_", "Price ID must start with 'price_'"),
  successUrl: z.string().url("Success URL must be a valid URL"),
  cancelUrl: z.string().url("Cancel URL must be a valid URL"),
});

const VerifyPaymentSchema = z.object({
  sessionId: z.string().startsWith("cs_", "Session ID must start with 'cs_'"),
});

const RequestRefundSchema = z.object({
  enrollmentId: z.number().positive(),
});

export const paymentRouter = createRouter({
  createCheckout: protectedProcedure
    .input(CreateCheckoutSchema)
    .mutation(async ({ input, ctx }) => {
      if (!env.stripeSecretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payments are not configured" });
      }

      const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2026-05-27.dahlia" });

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: [{ price: input.priceId, quantity: 1 }],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          metadata: {
            userId: ctx.user.id.toString(),
            courseId: input.courseId.toString(),
            type: "course_purchase",
          },
          customer_email: ctx.user.email,
          billing_address_collection: "auto",
        });

        logger.info("Checkout session created", { userId: ctx.user.id, courseId: input.courseId, sessionId: session.id });

        return { sessionId: session.id, url: session.url };
      } catch (err: any) {
        logger.error("Failed to create checkout session", { error: err.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create checkout session" });
      }
    }),

  createSubscriptionCheckout: protectedProcedure
    .input(CreateSubscriptionSchema)
    .mutation(async ({ input, ctx }) => {
      if (!env.stripeSecretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payments are not configured" });
      }

      const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2026-05-27.dahlia" });

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          line_items: [{ price: input.priceId, quantity: 1 }],
          subscription_data: {
            trial_period_days: 14,
            metadata: {
              userId: ctx.user.id.toString(),
              type: "subscription",
            },
          },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          customer_email: ctx.user.email,
        });

        logger.info("Subscription checkout created", { userId: ctx.user.id, sessionId: session.id });

        return { sessionId: session.id, url: session.url };
      } catch (err: any) {
        logger.error("Failed to create subscription checkout", { error: err.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create subscription checkout" });
      }
    }),

  verifyPayment: protectedProcedure
    .input(VerifyPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      if (!env.stripeSecretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payments are not configured" });
      }

      const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2026-05-27.dahlia" });

      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);

        if (session.metadata?.userId !== ctx.user.id.toString()) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This payment does not belong to you" });
        }

        return {
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_email,
          created: new Date(session.created * 1000).toISOString(),
        };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        logger.error("Failed to verify payment", { error: err.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to verify payment" });
      }
    }),

  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const history = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, ctx.user.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id));

    return history.map((h: any) => ({
      id: h.enrollments.id,
      courseId: h.enrollments.courseId,
      courseTitle: h.courses?.title || "Unknown Course",
      enrolledAt: h.enrollments.enrolledAt,
      paymentStatus: h.enrollments.paymentStatus,
      amount: h.enrollments.amount,
    }));
  }),

  requestRefund: protectedProcedure
    .input(RequestRefundSchema)
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      const enrollmentRows = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, ctx.user.id)))
        .limit(1);

      if (enrollmentRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      }

      const enrollment = enrollmentRows[0];

      if (enrollment.paymentStatus === "refunded") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This enrollment has already been refunded" });
      }

      const daysSinceEnrollment = Math.floor(
        (Date.now() - new Date(enrollment.enrolledAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceEnrollment > 14) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Refund period has expired (14 days)" });
      }

      if (enrollment.progress >= 20) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot refund after completing 20% or more of the course" });
      }

      if (enrollment.paymentIntentId && env.stripeSecretKey) {
        try {
          const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2026-05-27.dahlia" });
          await stripe.refunds.create({ payment_intent: enrollment.paymentIntentId });
          logger.info("Refund processed", { enrollmentId: enrollment.id, userId: ctx.user.id });
        } catch (err: any) {
          logger.error("Refund processing failed", { error: err.message });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to process refund" });
        }
      }

      await db.update(enrollments).set({ paymentStatus: "refunded" }).where(eq(enrollments.id, enrollment.id));

      return { message: "Refund processed successfully" };
    }),
});
