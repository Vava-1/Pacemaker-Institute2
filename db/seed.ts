import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { createPool, getDb } from "../api/queries/connection";
import {
  categories, courses, modules, lessons, badges, users, enrollments, notifications,
} from "./schema";

const SEED_CONFIG = {
  admin: { email: "admin@pacemaker.institute", password: "Admin123!" },
  instructor: { email: "instructor@pacemaker.institute", password: "Instructor123!" },
  student: { email: "student@pacemaker.institute", password: "Student123!" },
};

const CATEGORIES = [
  { name: "Web Development", slug: "web-development", description: "Build modern web applications with frameworks like React, Vue, and Angular", icon: "Globe", color: "#3b82f6", order: 1 },
  { name: "Data Science", slug: "data-science", description: "Learn data analysis, machine learning, and AI with Python and R", icon: "BarChart3", color: "#10b981", order: 2 },
  { name: "Mobile Development", slug: "mobile-development", description: "Create iOS and Android apps with React Native, Flutter, and Swift", icon: "Smartphone", color: "#ec4899", order: 3 },
  { name: "Cloud Computing", slug: "cloud-computing", description: "Master AWS, Azure, and Google Cloud platforms", icon: "Cloud", color: "#06b6d4", order: 4 },
  { name: "Cybersecurity", slug: "cybersecurity", description: "Protect systems and networks from digital attacks", icon: "Shield", color: "#ef4444", order: 5 },
  { name: "DevOps", slug: "devops", description: "Learn CI/CD, Docker, Kubernetes, and infrastructure as code", icon: "Container", color: "#8b5cf6", order: 6 },
];

const COURSES = [
  {
    title: "Introduction to React",
    slug: "intro-to-react",
    description: "Learn React from scratch. Master components, hooks, state management, and build production-ready single-page applications with TypeScript.",
    shortDescription: "Build modern UIs with React 19 and TypeScript",
    price: "49.99",
    categorySlug: "web-development",
    level: "beginner",
    lessons: [
      { title: "React Fundamentals", type: "video", duration: 30, content: "Learn JSX, components, and props in React." },
      { title: "Hooks in Depth", type: "video", duration: 45, content: "Master useState, useEffect, useContext and custom hooks." },
      { title: "State Management", type: "text", duration: 20, content: "Compare useState, useReducer, Context API, and external state libraries." },
      { title: "React Quiz", type: "quiz", duration: 15, content: "Test your understanding of React fundamentals." },
    ],
  },
  {
    title: "Python for Data Science",
    slug: "python-data-science",
    description: "Learn Python programming for data analysis, visualization, and machine learning. Covers NumPy, Pandas, Matplotlib, and Scikit-learn.",
    shortDescription: "Analyze data and build ML models with Python",
    price: "59.99",
    categorySlug: "data-science",
    level: "intermediate",
    lessons: [
      { title: "Python Basics for Data Science", type: "video", duration: 40, content: "Variables, data types, lists, dicts, and functions." },
      { title: "NumPy and Pandas", type: "video", duration: 50, content: "Data manipulation with arrays and dataframes." },
      { title: "Data Visualization", type: "video", duration: 35, content: "Creating charts and plots with Matplotlib and Seaborn." },
      { title: "Machine Learning Intro", type: "pdf", duration: 25, content: "Supervised vs unsupervised learning with Scikit-learn examples." },
      { title: "Data Science Project", type: "text", duration: 60, content: "End-to-end data science project from data collection to model deployment." },
    ],
  },
  {
    title: "AWS Fundamentals",
    slug: "aws-fundamentals",
    description: "Master Amazon Web Services core services including EC2, S3, Lambda, DynamoDB, and API Gateway. Prepare for the AWS Certified Cloud Practitioner exam.",
    shortDescription: "Get started with cloud computing on AWS",
    price: "39.99",
    categorySlug: "cloud-computing",
    level: "beginner",
    lessons: [
      { title: "Introduction to Cloud Computing", type: "video", duration: 25, content: "What is cloud computing? Benefits and deployment models." },
      { title: "EC2 and Compute Services", type: "video", duration: 40, content: "Launch and manage virtual servers in the cloud." },
      { title: "S3 Storage", type: "video", duration: 35, content: "Object storage, buckets, permissions, and lifecycle policies." },
      { title: "AWS Lambda", type: "text", duration: 20, content: "Serverless computing with Lambda functions." },
    ],
  },
];

const BADGES = [
  { name: "First Steps", description: "Complete your first lesson", icon: "Footprints", color: "#3b82f6", requirementType: "lessons", requirementValue: 1, points: 10 },
  { name: "Quick Learner", description: "Complete 5 lessons in a day", icon: "Zap", color: "#f97316", requirementType: "lessons", requirementValue: 5, points: 25 },
  { name: "Course Champion", description: "Complete an entire course", icon: "Trophy", color: "#f59e0b", requirementType: "courses", requirementValue: 1, points: 100 },
  { name: "Knowledge Seeker", description: "Enroll in 5 courses", icon: "BookOpen", color: "#10b981", requirementType: "courses", requirementValue: 5, points: 50 },
  { name: "Perfect Score", description: "Get 100% on any quiz", icon: "Target", color: "#ec4899", requirementType: "score", requirementValue: 100, points: 50 },
  { name: "Social Butterfly", description: "Participate in 10 forum discussions", icon: "MessageCircle", color: "#8b5cf6", requirementType: "messages", requirementValue: 10, points: 30 },
];

async function upsertUser(opts: {
  email: string;
  name: string;
  password: string;
  role: "admin" | "instructor" | "user";
  emailVerified?: boolean;
}) {
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.email, opts.email)).limit(1);
  if (existing.length > 0) {
    console.log(`  - User ${opts.email} already exists, skipping.`);
    return existing[0];
  }
  const passwordHash = await bcrypt.hash(opts.password, 12);
  const [result] = await db.insert(users).values({
    email: opts.email,
    name: opts.name,
    passwordHash,
    role: opts.role,
    emailVerified: opts.emailVerified ?? true,
    emailVerifyToken: null,
  });
  const inserted = await db.select().from(users).where(eq(users.id, result.insertId)).limit(1);
  console.log(`  + Created ${opts.role}: ${opts.email}`);
  return inserted[0];
}

async function seed() {
  console.log("Checking DATABASE_URL...");
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  // Initialize database pool
  createPool();
  const db = getDb();

  console.log("\nSeeding users...");
  const admin = await upsertUser({
    email: SEED_CONFIG.admin.email,
    name: "Platform Admin",
    password: SEED_CONFIG.admin.password,
    role: "admin",
  });
  const instructor = await upsertUser({
    email: SEED_CONFIG.instructor.email,
    name: "Sample Instructor",
    password: SEED_CONFIG.instructor.password,
    role: "instructor",
  });
  const student = await upsertUser({
    email: SEED_CONFIG.student.email,
    name: "Sample Student",
    password: SEED_CONFIG.student.password,
    role: "user",
  });

  console.log("\nSeeding categories...");
  const existingCats = await db.select().from(categories);
  if (existingCats.length === 0) {
    await db.insert(categories).values(CATEGORIES);
    console.log(`  + Created ${CATEGORIES.length} categories`);
  } else {
    console.log("  - Categories already exist, skipping.");
  }

  console.log("\nSeeding courses and lessons...");
  const existingCourses = await db.select().from(courses);
  if (existingCourses.length === 0) {
    for (const courseData of COURSES) {
      const cat = (await db.select().from(categories).where(eq(categories.slug, courseData.categorySlug)).limit(1))[0];
      if (!cat) {
        console.log(`  ! Category ${courseData.categorySlug} not found, skipping course`);
        continue;
      }

      const [courseResult] = await db.insert(courses).values({
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        shortDescription: courseData.shortDescription,
        categoryId: cat.id,
        instructorId: instructor.id,
        level: courseData.level as any,
        language: "en",
        thumbnail: `https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800`,
        price: courseData.price,
        originalPrice: courseData.price,
        duration: courseData.lessons.reduce((sum, l) => sum + l.duration, 0),
        status: "published",
        isFeatured: true,
        rating: "4.5",
        totalStudents: 0,
        totalLessons: courseData.lessons.length,
        tags: [courseData.categorySlug, courseData.level],
      });

      const courseId = courseResult.insertId;

      const [modResult] = await db.insert(modules).values({
        courseId,
        title: `${courseData.title} - Course Content`,
        description: `All lessons for ${courseData.title}`,
        order: 1,
      });

      for (let i = 0; i < courseData.lessons.length; i++) {
        const lesson = courseData.lessons[i];
        await db.insert(lessons).values({
          moduleId: modResult.insertId,
          courseId,
          title: lesson.title,
          type: lesson.type as any,
          contentText: lesson.content,
          duration: lesson.duration,
          order: i + 1,
          isFree: i === 0,
        });
      }

      console.log(`  + Created course: ${courseData.title} (${courseData.lessons.length} lessons)`);
    }
  } else {
    console.log("  - Courses already exist, skipping.");
  }

  console.log("\nSeeding badges...");
  const existingBadges = await db.select().from(badges);
  if (existingBadges.length === 0) {
    await db.insert(badges).values(BADGES);
    console.log(`  + Created ${BADGES.length} badges`);
  } else {
    console.log("  - Badges already exist, skipping.");
  }

  console.log("\nSeeding sample enrollment...");
  const existingEnrollments = await db.select().from(enrollments);
  if (existingEnrollments.length === 0) {
    const firstCourse = (await db.select().from(courses).limit(1))[0];
    if (firstCourse) {
      await db.insert(enrollments).values({
        userId: student.id,
        courseId: firstCourse.id,
        progress: 15,
        paymentStatus: "paid",
      });
      console.log(`  + Enrolled student in: ${firstCourse.title}`);
    }
  } else {
    console.log("  - Enrollments already exist, skipping.");
  }

  console.log("\nSeeding notifications...");
  const existingNotifs = await db.select().from(notifications);
  if (existingNotifs.length === 0) {
    await db.insert(notifications).values([
      { userId: student.id, type: "welcome", title: "Welcome to Pacemaker Institute!", message: "Start your learning journey today.", isRead: false },
      { userId: instructor.id, type: "course_published", title: "Course Published", message: "Your course has been published successfully.", isRead: false },
    ]);
    console.log("  + Created sample notifications");
  } else {
    console.log("  - Notifications already exist, skipping.");
  }

  console.log("\n========================================");
  console.log("  SEEDING COMPLETE!");
  console.log("========================================");
  console.log("  Default Login Credentials:");
  console.log(`    Admin:      ${SEED_CONFIG.admin.email} / ${SEED_CONFIG.admin.password}`);
  console.log(`    Instructor: ${SEED_CONFIG.instructor.email} / ${SEED_CONFIG.instructor.password}`);
  console.log(`    Student:    ${SEED_CONFIG.student.email} / ${SEED_CONFIG.student.password}`);
  console.log("========================================");
  console.log("  !!! IMPORTANT: Change these passwords after first login !!!");
  console.log("========================================\n");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
