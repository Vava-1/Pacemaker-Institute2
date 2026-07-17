import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { createRouter, protectedProcedure } from "../trpc";
import { getDb } from "../queries/connection";
import { courses, enrollments, payments } from "@db/schema";
import { sql } from "drizzle-orm";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    // No apiVersion override — Stripe SDK uses its bundled default, which
    // is always a real, published version (the prior "2026-05-27.dahlia"
    // string was future-dated/fake and would be rejected by the API).
    stripeInstance = new Stripe(env.stripeSecretKey);
  }
  return stripeInstance;
}

const PAYMENT_METHODS = ["mtn_mobile_money", "airtel_money", "bank_card", "paypal"] as const;

const InitiatePaymentSchema = z.object({
  courseId: z.number().positive(),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

const ConfirmPaymentSchema = z.object({
  paymentId: z.number().positive(),
});

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
  // ── Local Payment Methods (MTN, Airtel, Bank Card, PayPal) ──
  initiatePayment: protectedProcedure
    .input(InitiatePaymentSchema)
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const course = (await db.select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        price: courses.price,
        currency: courses.currency,
      }).from(courses).where(eq(courses.id, input.courseId)).limit(1))[0];

      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });

      // Ensure enrollment exists
      let enrollment = (await db.select().from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.courseId, input.courseId)))
        .limit(1))[0];

      if (!enrollment) {
        await db.insert(enrollments).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          progress: 0,
          paymentStatus: "pending",
          amount: course.price,
        });
        await db.update(courses)
          .set({ totalStudents: sql`${courses.totalStudents} + 1` })
          .where(eq(courses.id, input.courseId));

        enrollment = (await db.select().from(enrollments)
          .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.courseId, input.courseId)))
          .limit(1))[0];
      }

      // Create payment record
      const [payment] = await db.insert(payments).values({
        userId: ctx.user.id,
        courseId: input.courseId,
        amount: course.price,
        currency: course.currency ?? "rwf",
        status: "pending",
        paymentMethod: input.paymentMethod,
      });

      const paymentId = Number(payment.insertId);
      const hasStripe = !!env.stripeSecretKey;

      // Checkout URL for card/PayPal when Stripe is available
      let checkoutUrl: string | null = null;

      if (hasStripe && (input.paymentMethod === "bank_card" || input.paymentMethod === "paypal")) {
        try {
          const stripe = getStripe();
          const session = await stripe.checkout.sessions.create({
            payment_method_types: input.paymentMethod === "paypal" ? ["card", "paypal"] : ["card"],
            mode: "payment",
            line_items: [{
              price_data: {
                currency: course.currency ?? "rwf",
                product_data: { name: course.title },
                unit_amount: Math.round(Number(course.price) * 100),
              },
              quantity: 1,
            }],
            success_url: `${env.frontendUrl}/courses/${course.slug}?payment_success=1`,
            cancel_url: `${env.frontendUrl}/courses/${course.slug}?payment_cancel=1`,
            metadata: {
              userId: ctx.user.id.toString(),
              courseId: input.courseId.toString(),
              paymentId: paymentId.toString(),
              type: "course_purchase",
            },
            customer_email: ctx.user.email,
          });
          checkoutUrl = session.url;
          logger.info("Stripe checkout created", { userId: ctx.user.id, courseId: input.courseId, sessionId: session.id });
        } catch (err: any) {
          logger.error("Stripe checkout creation failed, falling back to manual", { error: err.message });
        }
      }

      // Return payment instructions based on method
      const instructions: Record<string, { label: string; details: string }> = {
        mtn_mobile_money: {
          label: "MTN Mobile Money",
          details: "Dial *182# or use the MoMo App. Send payment to merchant number +250 786 053 720, then click 'I Have Paid — Confirm' below.",
        },
        airtel_money: {
          label: "Airtel Money",
          details: "Dial *500# or use the Airtel Money App. Send payment to merchant number +250 786 053 720, then click 'I Have Paid — Confirm' below.",
        },
        bank_card: {
          label: "Bank Card",
          details: hasStripe
            ? "You will be redirected to Stripe's secure checkout page to pay with your card."
            : "Bank transfer to our account: Equity Bank Rwanda – Account 1004200530720 (Branch: Kigali). Use your name as reference, then click 'I Have Paid — Confirm' below.",
        },
        paypal: {
          label: "PayPal",
          details: hasStripe
            ? "You will be redirected to Stripe's secure checkout page to pay with PayPal."
            : "Send payment via PayPal to payments@pacemakerinstitute.com, then click 'I Have Paid — Confirm' below.",
        },
      };

      const info = instructions[input.paymentMethod] ?? { label: input.paymentMethod, details: "Complete payment to continue." };

      return {
        paymentId,
        amount: Number(course.price),
        currency: course.currency ?? "rwf",
        method: info.label,
        instructions: info.details,
        enrollmentId: enrollment.id,
        checkoutUrl,
      };
    }),

  confirmPayment: protectedProcedure
    .input(ConfirmPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const payment = (await db.select().from(payments)
        .where(and(eq(payments.id, input.paymentId), eq(payments.userId, ctx.user.id)))
        .limit(1))[0];

      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
      if (payment.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Payment already completed" });

      // Mark payment as completed
      await db.update(payments).set({ status: "completed" }).where(eq(payments.id, input.paymentId));

      // Mark enrollment as paid
      await db.update(enrollments)
        .set({ paymentStatus: "paid" })
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.courseId, payment.courseId)));

      logger.info("Payment confirmed", { paymentId: input.paymentId, userId: ctx.user.id, method: payment.paymentMethod });

      return { success: true, courseId: payment.courseId };
    }),

  // ── Stripe Checkout ──
  createCheckout: protectedProcedure
    .input(CreateCheckoutSchema)
    .mutation(async ({ input, ctx }) => {
      if (!env.stripeSecretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payments are not configured" });
      }

      try {
        const stripe = getStripe();
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

      try {
        const stripe = getStripe();
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

      try {
        const stripe = getStripe();
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
          const stripe = getStripe();
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
