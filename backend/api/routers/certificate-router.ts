import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "../trpc";
import { getDb } from "../queries/connection";
import { certificates, enrollments, courses, users } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

export const certificateRouter = createRouter({
  issueCertificate: authedQuery
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      const enrollmentRows = await db.select().from(enrollments)
        .where(and(eq(enrollments.userId, ctx.user.id), eq(enrollments.courseId, input.courseId)))
        .limit(1);

      const enrollment = enrollmentRows[0];
      if (!enrollment || enrollment.progress < 100) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Course not completed yet." });
      }

      // Check if certificate already exists
      const existingCert = await db.select().from(certificates)
        .where(and(eq(certificates.userId, ctx.user.id), eq(certificates.courseId, input.courseId)))
        .limit(1);

      if (existingCert.length > 0) {
        return { certificateNumber: existingCert[0].certificateNumber };
      }

      // Generate a unique certificate number
      const prefix = "PI";
      const year = new Date().getFullYear();
      const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();
      const certificateNumber = `${prefix}-${year}-${randomStr}`;

      await db.insert(certificates).values({
        userId: ctx.user.id,
        courseId: input.courseId,
        certificateNumber,
      });

      return { certificateNumber };
    }),

  getCertificate: publicQuery
    .input(z.object({ certificateNumber: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      
      const certRows = await db.select({
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        studentName: users.name,
        courseTitle: courses.title,
        courseInstructor: courses.instructorId,
      }).from(certificates)
        .innerJoin(users, eq(certificates.userId, users.id))
        .innerJoin(courses, eq(certificates.courseId, courses.id))
        .where(eq(certificates.certificateNumber, input.certificateNumber))
        .limit(1);

      if (!certRows[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Certificate not found." });
      }

      const cert = certRows[0];

      // Fetch instructor name
      const instructorRows = await db.select({ name: users.name }).from(users).where(eq(users.id, cert.courseInstructor)).limit(1);
      
      return {
        ...cert,
        instructorName: instructorRows[0]?.name || "Pacemaker Institute Instructor",
      };
    }),
    
  myCertificates: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
      issuedAt: certificates.issuedAt,
      courseTitle: courses.title,
      thumbnail: courses.thumbnail,
    }).from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.userId, ctx.user.id));
  }),
});
