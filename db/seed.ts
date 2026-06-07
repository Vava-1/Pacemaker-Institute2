import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../api/queries/connection.js";
import {
  categories, courses, modules, lessons, exercises, badges,
  testimonials, subscriptionPlans, chatRooms, users,
} from "./schema";

const ADMIN_EMAIL = "admin@pacemaker.institute";
const ADMIN_PASSWORD = "Admin@2024!";
const INSTRUCTOR_EMAIL = "instructor@pacemaker.institute";
const INSTRUCTOR_PASSWORD = "Instructor@2024!";
const SAMPLE_STUDENT_EMAIL = "student@pacemaker.institute";
const SAMPLE_STUDENT_PASSWORD = "Student@2024!";

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
    referralCode: `${opts.role.toUpperCase().slice(0, 3)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  });
  const inserted = await db.select().from(users).where(eq(users.id, result.insertId)).limit(1);
  console.log(`  + Created ${opts.role}: ${opts.email}`);
  return inserted[0];
}

async function seed() {
  const db = getDb();

  console.log("Seeding users...");
  const admin = await upsertUser({
    email: ADMIN_EMAIL,
    name: "Platform Admin",
    password: ADMIN_PASSWORD,
    role: "admin",
    emailVerified: true,
  });
  const instructor = await upsertUser({
    email: INSTRUCTOR_EMAIL,
    name: "Sample Instructor",
    password: INSTRUCTOR_PASSWORD,
    role: "instructor",
    emailVerified: true,
  });
  await upsertUser({
    email: SAMPLE_STUDENT_EMAIL,
    name: "Sample Student",
    password: SAMPLE_STUDENT_PASSWORD,
    role: "user",
    emailVerified: true,
  });

  console.log("Seeding categories...");
  const existingCats = await db.select().from(categories);
  if (existingCats.length === 0) {
    await db.insert(categories).values([
      { name: "Programming", slug: "programming", description: "Learn to code with modern languages and frameworks", icon: "Code", color: "#3b82f6", order: 1 },
      { name: "Design", slug: "design", description: "UI/UX, graphic design, and visual arts", icon: "Palette", color: "#ec4899", order: 2 },
      { name: "Business", slug: "business", description: "Entrepreneurship, marketing, and management", icon: "Briefcase", color: "#10b981", order: 3 },
      { name: "Languages", slug: "languages", description: "Learn new languages from native speakers", icon: "Languages", color: "#8b5cf6", order: 4 },
      { name: "AI Skills", slug: "ai-skills", description: "AI tools and skills tailored to your profession", icon: "Brain", color: "#06b6d4", order: 5 },
    ]);
  } else {
    console.log("  - Categories already exist, skipping.");
  }

  console.log("Seeding courses...");
  const existingCourses = await db.select().from(courses);
  if (existingCourses.length === 0) {
    const programmingCat = (await db.select().from(categories).where(eq(categories.slug, "programming")).limit(1))[0];
    const designCat = (await db.select().from(categories).where(eq(categories.slug, "design")).limit(1))[0];
    const businessCat = (await db.select().from(categories).where(eq(categories.slug, "business")).limit(1))[0];
    const languagesCat = (await db.select().from(categories).where(eq(categories.slug, "languages")).limit(1))[0];

    const [freeCourse] = await db.insert(courses).values({
      title: "JavaScript Fundamentals (Free)",
      slug: "javascript-fundamentals-free",
      description: "Start your coding journey with JavaScript. Learn variables, functions, loops, DOM manipulation, and build your first interactive web app. Perfect for absolute beginners with no prior programming experience.",
      shortDescription: "Learn JavaScript from scratch - completely free",
      categoryId: programmingCat?.id ?? 1,
      instructorId: instructor.id,
      level: "beginner",
      language: "en",
      thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
      price: "0.00",
      originalPrice: "0.00",
      duration: 1200,
      status: "published",
      isFeatured: true,
      rating: "4.7",
      totalStudents: 0,
      totalLessons: 0,
      requirements: ["A computer with internet access", "A modern web browser (Chrome, Firefox, Safari, Edge)", "No prior coding experience required"],
      learningOutcomes: ["Write your first JavaScript program", "Understand variables, functions, and control flow", "Manipulate the DOM to create interactive pages", "Handle user events like clicks and form submissions", "Debug common JavaScript errors"],
      tags: ["javascript", "programming", "beginner", "free"],
    });

    const [paidCourse] = await db.insert(courses).values({
      title: "Full-Stack Web Development with React & Node",
      slug: "fullstack-react-node",
      description: "Become a professional full-stack developer. Build production-ready web applications using React 19, TypeScript, Node.js, Hono, and MySQL. Includes authentication, payments, deployment, and best practices.",
      shortDescription: "Master modern full-stack development",
      categoryId: programmingCat?.id ?? 1,
      instructorId: instructor.id,
      level: "intermediate",
      language: "en",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
      price: "49.99",
      originalPrice: "99.99",
      duration: 3600,
      status: "published",
      isFeatured: true,
      rating: "4.9",
      totalStudents: 0,
      totalLessons: 0,
      requirements: ["Basic JavaScript knowledge", "Familiarity with HTML and CSS", "A computer with Node.js 20+ installed"],
      learningOutcomes: ["Build full-stack apps with React 19 and TypeScript", "Create RESTful APIs with Hono", "Design relational databases with Drizzle ORM", "Implement authentication with JWT", "Process payments with Stripe", "Deploy to production on Render"],
      tags: ["react", "nodejs", "typescript", "fullstack"],
    });

    console.log("Seeding modules & lessons for free course...");
    const [mod1] = await db.insert(modules).values({
      courseId: freeCourse.insertId,
      title: "Getting Started with JavaScript",
      description: "Set up your environment and write your first program",
      order: 1,
    });
    const [mod2] = await db.insert(modules).values({
      courseId: freeCourse.insertId,
      title: "Variables and Data Types",
      description: "Learn how to store and manipulate data",
      order: 2,
    });
    const [mod3] = await db.insert(modules).values({
      courseId: freeCourse.insertId,
      title: "Control Flow",
      description: "Make decisions and repeat actions in your code",
      order: 3,
    });

    await db.insert(lessons).values([
      { moduleId: mod1.insertId, courseId: freeCourse.insertId, title: "Welcome and Setup", description: "Install VS Code and Node.js", contentText: "In this lesson, we install Node.js 20+ and VS Code. We write our first `console.log('Hello, world!')` and run it with `node app.js`.", duration: 10, order: 1, isFree: true },
      { moduleId: mod1.insertId, courseId: freeCourse.insertId, title: "Your First Script", description: "Write and run a basic JavaScript file", contentText: "JavaScript files end in `.js`. Create `app.js`, add `console.log('Hello!')`, and run it with `node app.js`.", duration: 15, order: 2, isFree: true },
      { moduleId: mod2.insertId, courseId: freeCourse.insertId, title: "let, const, and var", description: "Declare variables", contentText: "Use `const` by default, `let` when reassignment is needed, avoid `var`.", duration: 12, order: 3, isFree: false },
      { moduleId: mod2.insertId, courseId: freeCourse.insertId, title: "Strings, Numbers, Booleans", description: "Primitive data types", contentText: "JavaScript has 7 primitive types. The most common are `string`, `number`, and `boolean`.", duration: 18, order: 4, isFree: false },
      { moduleId: mod3.insertId, courseId: freeCourse.insertId, title: "if / else statements", description: "Conditional logic", contentText: "`if (condition) { ... } else { ... }` lets you branch.", duration: 14, order: 5, isFree: false },
      { moduleId: mod3.insertId, courseId: freeCourse.insertId, title: "for and while loops", description: "Repetition", contentText: "`for (let i = 0; i < 10; i++) { ... }` loops a fixed number of times.", duration: 16, order: 6, isFree: false },
    ]);

    console.log("Seeding modules & lessons for paid course...");
    const [pmod1] = await db.insert(modules).values({ courseId: paidCourse.insertId, title: "React Fundamentals", description: "Components, JSX, and props", order: 1 });
    const [pmod2] = await db.insert(modules).values({ courseId: paidCourse.insertId, title: "Backend with Hono", description: "Routing, middleware, and tRPC", order: 2 });
    const [pmod3] = await db.insert(modules).values({ courseId: paidCourse.insertId, title: "Database with Drizzle", description: "Schemas, queries, and migrations", order: 3 });
    const [pmod4] = await db.insert(modules).values({ courseId: paidCourse.insertId, title: "Production Deployment", description: "Deploy to Render with CI/CD", order: 4 });

    await db.insert(lessons).values([
      { moduleId: pmod1.insertId, courseId: paidCourse.insertId, title: "Setting up a React project with Vite", description: "Use Vite to bootstrap a React 19 + TypeScript app", contentText: "`npm create vite@latest my-app -- --template react-ts`", duration: 20, order: 1, isFree: true },
      { moduleId: pmod1.insertId, courseId: paidCourse.insertId, title: "JSX and Components", description: "Build your first reusable component", contentText: "JSX lets you write HTML in JavaScript. Components are functions that return JSX.", duration: 25, order: 2, isFree: false },
      { moduleId: pmod2.insertId, courseId: paidCourse.insertId, title: "Your first Hono server", description: "Spin up an HTTP server in 5 minutes", contentText: "`const app = new Hono(); app.get('/', (c) => c.text('Hello'));`", duration: 30, order: 3, isFree: false },
      { moduleId: pmod2.insertId, courseId: paidCourse.insertId, title: "tRPC for type-safe APIs", description: "End-to-end types with tRPC", contentText: "tRPC lets the client call server functions with full TypeScript types.", duration: 35, order: 4, isFree: false },
      { moduleId: pmod3.insertId, courseId: paidCourse.insertId, title: "Designing a Drizzle schema", description: "Model your domain with mysqlTable", contentText: "Drizzle gives you type-safe SQL with zero codegen.", duration: 28, order: 5, isFree: false },
      { moduleId: pmod4.insertId, courseId: paidCourse.insertId, title: "Deploying to Render", description: "One-click Blueprint deploy", contentText: "Connect your GitHub repo, Render reads `render.yaml` and deploys automatically.", duration: 22, order: 6, isFree: false },
    ]);

    await db.update(courses).set({ totalLessons: 6 }).where(eq(courses.id, freeCourse.insertId));
    await db.update(courses).set({ totalLessons: 6 }).where(eq(courses.id, paidCourse.insertId));
  } else {
    console.log("  - Courses already exist, skipping.");
  }

  console.log("Seeding daily exercises (quizzes)...");
  const existingEx = await db.select().from(exercises);
  if (existingEx.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const programmingCat = (await db.select().from(categories).where(eq(categories.slug, "programming")).limit(1))[0];
    const designCat = (await db.select().from(categories).where(eq(categories.slug, "design")).limit(1))[0];
    const businessCat = (await db.select().from(categories).where(eq(categories.slug, "business")).limit(1))[0];

    await db.insert(exercises).values([
      { categoryId: programmingCat?.id, title: "JavaScript: typeof", question: "What does `typeof null` return in JavaScript?", type: "multiple_choice", options: [{ text: "'null'", isCorrect: false }, { text: "'object'", isCorrect: true }, { text: "'undefined'", isCorrect: false }, { text: "'boolean'", isCorrect: false }], correctAnswer: "'object'", explanation: "This is a famous JavaScript bug kept for backwards compatibility - `typeof null` returns `'object'`.", difficulty: "easy", points: 10, language: "en", isDaily: true, dailyDate: today },
      { categoryId: programmingCat?.id, title: "React: useState", question: "Which hook lets you add local state to a function component?", type: "multiple_choice", options: [{ text: "useEffect", isCorrect: false }, { text: "useState", isCorrect: true }, { text: "useMemo", isCorrect: false }, { text: "useRef", isCorrect: false }], correctAnswer: "useState", explanation: "`useState` returns a state value and an updater function. `useEffect` runs side effects, `useMemo` memoizes values.", difficulty: "easy", points: 10, language: "en" },
      { categoryId: designCat?.id, title: "Design: Contrast", question: "What is the WCAG minimum contrast ratio for normal text?", type: "multiple_choice", options: [{ text: "1:1", isCorrect: false }, { text: "3:1", isCorrect: false }, { text: "4.5:1", isCorrect: true }, { text: "7:1", isCorrect: false }], correctAnswer: "4.5:1", explanation: "WCAG AA requires 4.5:1 for normal text and 3:1 for large text. AAA requires 7:1.", difficulty: "medium", points: 15, language: "en", isDaily: true, dailyDate: today },
      { categoryId: businessCat?.id, title: "Business: KPI", question: "What does KPI stand for?", type: "multiple_choice", options: [{ text: "Key Performance Indicator", isCorrect: true }, { text: "Knowledge Process Integration", isCorrect: false }, { text: "Kinetic Profit Index", isCorrect: false }, { text: "Key Product Information", isCorrect: false }], correctAnswer: "Key Performance Indicator", explanation: "KPIs are quantifiable metrics that reflect the success of an organization.", difficulty: "easy", points: 10, language: "en" },
      { categoryId: programmingCat?.id, title: "JavaScript: Arrays", question: "Which method creates a NEW array with the results of a function called on every element?", type: "multiple_choice", options: [{ text: "forEach", isCorrect: false }, { text: "map", isCorrect: true }, { text: "filter", isCorrect: false }, { text: "reduce", isCorrect: false }], correctAnswer: "map", explanation: "`map` returns a new array. `forEach` returns undefined. `filter` returns only matching items. `reduce` returns a single value.", difficulty: "medium", points: 15, language: "en", isDaily: true, dailyDate: today },
    ]);
  } else {
    console.log("  - Exercises already exist, skipping.");
  }

  console.log("Seeding badges...");
  const existingBadges = await db.select().from(badges);
  if (existingBadges.length === 0) {
    await db.insert(badges).values([
      { name: "First Steps", description: "Complete your first exercise", icon: "Footprints", color: "#3b82f6", requirementType: "exercises", requirementValue: 1, points: 10 },
      { name: "Week Warrior", description: "Maintain a 7-day study streak", icon: "Flame", color: "#f97316", requirementType: "streak", requirementValue: 7, points: 50 },
      { name: "Month Master", description: "Maintain a 30-day study streak", icon: "Fire", color: "#ef4444", requirementType: "streak", requirementValue: 30, points: 200 },
      { name: "Course Completer", description: "Complete your first course", icon: "GraduationCap", color: "#8b5cf6", requirementType: "courses", requirementValue: 1, points: 100 },
      { name: "Knowledge Seeker", description: "Complete 5 courses", icon: "BookOpen", color: "#10b981", requirementType: "courses", requirementValue: 5, points: 300 },
      { name: "Century Club", description: "Study for 100 hours total", icon: "Clock", color: "#f59e0b", requirementType: "hours", requirementValue: 100, points: 150 },
      { name: "Perfect Score", description: "Get 100% on any exercise", icon: "Target", color: "#ec4899", requirementType: "score", requirementValue: 100, points: 50 },
      { name: "Quiz Champion", description: "Complete 50 exercises", icon: "Trophy", color: "#6366f1", requirementType: "exercises", requirementValue: 50, points: 200 },
    ]);
  } else {
    console.log("  - Badges already exist, skipping.");
  }

  console.log("Seeding testimonials...");
  const existingTest = await db.select().from(testimonials);
  if (existingTest.length === 0) {
    await db.insert(testimonials).values([
      { name: "Sarah M.", role: "Programming Student", content: "Pacemaker Institute transformed my learning journey. The hands-on projects and AI tutor helped me land my first developer job in 4 months.", rating: 5, isFeatured: true },
      { name: "David O.", role: "Designer", content: "The design courses are world-class. I went from complete beginner to designing product pages for real clients within weeks.", rating: 5, isFeatured: true },
      { name: "Amina N.", role: "Business Owner", content: "The business track gave me the confidence and skills to launch my online store. The community is incredibly supportive.", rating: 5, isFeatured: true },
      { name: "Robert H.", role: "SAT Student", content: "Scored 1480 on my SAT thanks to this platform. The practice tests and detailed explanations were game-changers.", rating: 5, isFeatured: true },
      { name: "Grace W.", role: "Language Learner", content: "From zero French to holding conversations with native speakers in 3 months. The structured path kept me on track.", rating: 5, isFeatured: true },
      { name: "Jean-Pierre K.", role: "Graduate", content: "The certification at the end gave me real credibility with employers. I received 3 job offers in my first month.", rating: 5, isFeatured: true },
    ]);
  } else {
    console.log("  - Testimonials already exist, skipping.");
  }

  console.log("Seeding subscription plans...");
  const existingPlans = await db.select().from(subscriptionPlans);
  if (existingPlans.length === 0) {
    await db.insert(subscriptionPlans).values([
      { name: "Free", slug: "free", description: "Get started with the basics", price: "0.00", billingPeriod: "monthly", features: ["Access to 2 free courses", "3 daily exercises", "Basic AI tutor (5 queries/day)", "Community forum access"] },
      { name: "Pro", slug: "pro", description: "Unlimited access for serious learners", price: "19.99", billingPeriod: "monthly", features: ["Unlimited course access", "Unlimited daily exercises", "Full AI tutor access", "Priority live classes", "Downloadable certificates", "Ad-free experience", "Progress analytics"] },
      { name: "Pro Annual", slug: "pro-annual", description: "Pro at 2 months free", price: "199.99", billingPeriod: "yearly", features: ["Everything in Pro", "Save 17% vs monthly", "Priority email support"] },
      { name: "Expert", slug: "expert", description: "Premium experience with mentoring", price: "39.99", billingPeriod: "monthly", features: ["Everything in Pro", "1-on-1 mentoring sessions", "Custom learning paths", "Early access to new courses", "Career guidance", "Job placement support"] },
    ]);
  } else {
    console.log("  - Subscription plans already exist, skipping.");
  }

  console.log("Seeding chat rooms...");
  const existingRooms = await db.select().from(chatRooms);
  if (existingRooms.length === 0) {
    await db.insert(chatRooms).values([
      { name: "General", slug: "general", description: "Say hi to the community", category: "general" },
      { name: "Programming Help", slug: "programming-help", description: "Get help with code", category: "programming" },
      { name: "Design Feedback", slug: "design-feedback", description: "Share your work for critique", category: "design" },
      { name: "Business & Marketing", slug: "business-marketing", description: "Discuss entrepreneurship", category: "business" },
      { name: "Language Exchange", slug: "language-exchange", description: "Practice with other learners", category: "languages" },
      { name: "AI Tools", slug: "ai-tools", description: "Share AI tips and tricks", category: "ai-skills" },
    ]);
  } else {
    console.log("  - Chat rooms already exist, skipping.");
  }

  console.log("\n========================================");
  console.log("Seeding complete!");
  console.log("========================================");
  console.log("Login credentials:");
  console.log(`  Admin:      ${ADMIN_EMAIL}      / ${ADMIN_PASSWORD}`);
  console.log(`  Instructor: ${INSTRUCTOR_EMAIL} / ${INSTRUCTOR_PASSWORD}`);
  console.log(`  Student:    ${SAMPLE_STUDENT_EMAIL}  / ${SAMPLE_STUDENT_PASSWORD}`);
  console.log("========================================");
  console.log("\n!! IMPORTANT: Change the admin password after first login. !!");
  console.log("========================================\n");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
