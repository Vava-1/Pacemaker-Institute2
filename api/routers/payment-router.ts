import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { courses, payments, enrollments } from "@db/schema";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { env } from "../lib/env";
import { TRPCError } from "@trpc/server";

export const paymentRouter = createRouter({
  createCheckoutSession: authedQuery
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      const courseRows = await db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
      const course = courseRows[0];

      if (!course) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      // Check if already enrolled
      const existingEnrollment = await db.select().from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.courseId, course.id)))
        .limit(1);

      if (existingEnrollment.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Already enrolled in this course" });
      }

      // If course is free, enroll directly
      if (!course.price || parseFloat(course.price as unknown as string) === 0) {
        await db.insert(enrollments).values({
          userId: ctx.user.id,
          courseId: course.id,
          progress: 0,
        });
        
        // Return a special URL indicating it was free
        return { url: `${env.frontendUrl}/payment/success?course_id=${course.id}&free=true` };
      }

      if (!env.stripeSecretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payments are not configured on this server." });
      }

      const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2023-10-16" });

      const priceInCents = Math.round(parseFloat(course.price as unknown as string) * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: ctx.user.email,
        line_items: [
          {
            price_data: {
              currency: course.currency || "usd",
              product_data: {
                name: course.title,
                images: course.thumbnail ? [course.thumbnail] : undefined,
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${env.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&course_id=${course.id}`,
        cancel_url: `${env.frontendUrl}/courses/${course.slug}`,
        client_reference_id: `${ctx.user.id}_${course.id}`,
        metadata: {
          userId: ctx.user.id.toString(),
          courseId: course.id.toString(),
        },
      });

      if (!session.url) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create checkout session" });
      }

      await db.insert(payments).values({
        userId: ctx.user.id,
        courseId: course.id,
        amount: priceInCents,
        currency: course.currency || "usd",
        stripeSessionId: session.id,
        status: "pending",
      });

      return { url: session.url };
    }),
});
