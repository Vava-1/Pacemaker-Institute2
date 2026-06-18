import {
  mysqlTable,
  mysqlEnum,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  json,
  decimal,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ===== USERS =====
// Roles: student = normal learner, instructor = course creator, admin = platform admin
export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }),
  avatar: text("avatar"),
  // Role: student (default) | instructor | admin
  role: mysqlEnum("role", ["student", "instructor", "admin"]).default("student").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerifyToken: varchar("email_verify_token", { length: 255 }),
  otpCode: text("otp_code"),
  otpExpiresAt: timestamp("otp_expires_at"),
  googleId: varchar("google_id", { length: 255 }),
  unionId: varchar("union_id", { length: 255 }),
  isSuspended: boolean("is_suspended").default(false).notNull(),
  nativeLanguage: varchar("native_language", { length: 50 }).default("en"),
  learningLanguages: json("learning_languages").$type<string[]>(),
  totalPoints: int("total_points").default(0).notNull(),
  weeklyPoints: int("weekly_points").default(0).notNull(),
  monthlyPoints: int("monthly_points").default(0).notNull(),
  accuracyPercent: int("accuracy_percent").default(0).notNull(),
  rankTier: mysqlEnum("rank_tier", ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]).default("Bronze").notNull(),
  longestStreak: int("longest_streak").default(0).notNull(),
  lastSubmissionDate: varchar("last_submission_date", { length: 20 }),
  studyStreak: int("study_streak").default(0).notNull(),
  totalStudyMinutes: int("total_study_minutes").default(0).notNull(),
  referralCode: varchar("referral_code", { length: 50 }),
  isOnline: boolean("is_online").default(false),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("last_sign_in_at"),
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
  googleIdx: index("users_google_idx").on(t.googleId),
  roleIdx: index("users_role_idx").on(t.role),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== PASSWORD RESETS =====
export const passwordResets = mysqlTable("password_resets", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("password_resets_user_idx").on(t.userId),
  tokenIdx: uniqueIndex("password_resets_token_idx").on(t.token),
}));

// ===== CATEGORIES (Disciplines) =====
export const categories = mysqlTable("categories", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }).default("#3b82f6"),
  parentId: bigint("parent_id", { mode: "number", unsigned: true }),
  order: int("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  slugIdx: uniqueIndex("categories_slug_idx").on(t.slug),
}));

export type Category = typeof categories.$inferSelect;

// ===== COURSES =====
export const courses = mysqlTable("courses", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  categoryId: bigint("category_id", { mode: "number", unsigned: true }).notNull(),
  instructorId: bigint("instructor_id", { mode: "number", unsigned: true }).notNull(),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced", "all_levels"]).default("beginner").notNull(),
  language: varchar("language", { length: 50 }).default("en"),
  thumbnail: text("thumbnail"),
  previewVideo: text("preview_video"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("usd"),
  duration: int("duration").default(0),
  planTier: mysqlEnum("plan_tier", ["free", "basic", "pro", "premium"]).default("basic").notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  isFeatured: boolean("is_featured").default(false),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  totalStudents: int("total_students").default(0),
  totalLessons: int("total_lessons").default(0),
  requirements: json("requirements").$type<string[]>(),
  learningOutcomes: json("learning_outcomes").$type<string[]>(),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
  slugIdx: uniqueIndex("courses_slug_idx").on(t.slug),
  statusIdx: index("courses_status_idx").on(t.status),
  instructorIdx: index("courses_instructor_idx").on(t.instructorId),
  categoryIdx: index("courses_category_idx").on(t.categoryId),
  featuredIdx: index("courses_featured_idx").on(t.isFeatured),
}));

export type Course = typeof courses.$inferSelect;

// ===== MODULES =====
export const modules = mysqlTable("modules", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  courseId: bigint("course_id", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: int("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  courseIdx: index("modules_course_idx").on(t.courseId),
}));

export type Module = typeof modules.$inferSelect;

// ===== LESSONS =====
export const lessons = mysqlTable("lessons", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  moduleId: bigint("module_id", { mode: "number", unsigned: true }).notNull(),
  courseId: bigint("course_id", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["video", "text", "pdf", "quiz"]).default("video").notNull(),
  videoUrl: text("video_url"),
  contentText: text("content_text"),
  pdfUrl: text("pdf_url"),
  duration: int("duration").default(0),
  order: int("display_order").default(0),
  isFree: boolean("is_free").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  courseIdx: index("lessons_course_idx").on(t.courseId),
  moduleIdx: index("lessons_module_idx").on(t.moduleId),
}));

export type Lesson = typeof lessons.$inferSelect;

// ===== ENROLLMENTS =====
export const enrollments = mysqlTable("enrollments", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  courseId: bigint("course_id", { mode: "number", unsigned: true }).notNull(),
  progress: int("progress").default(0).notNull(),
  totalTimeSpent: int("total_time_spent").default(0),
  lastLessonId: bigint("last_lesson_id", { mode: "number", unsigned: true }),
  isCompleted: boolean("is_completed").default(false),
  paymentStatus: mysqlEnum("payment_status", ["pending", "paid", "refunded"]).default("pending").notNull(),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (t) => ({
  userIdx: index("enrollments_user_idx").on(t.userId),
  courseIdx: index("enrollments_course_idx").on(t.courseId),
  userCourseIdx: uniqueIndex("enrollments_user_course_idx").on(t.userId, t.courseId),
}));

export type Enrollment = typeof enrollments.$inferSelect;

// ===== LESSON PROGRESS =====
export const lessonProgress = mysqlTable("lesson_progress", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  enrollmentId: bigint("enrollment_id", { mode: "number", unsigned: true }).notNull(),
  lessonId: bigint("lesson_id", { mode: "number", unsigned: true }).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  watchedSeconds: int("watched_seconds").default(0),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
}, (t) => ({
  enrollLessonIdx: uniqueIndex("lp_enroll_lesson_idx").on(t.enrollmentId, t.lessonId),
  enrollIdx: index("lp_enrollment_idx").on(t.enrollmentId),
}));

// ===== EXERCISES (Daily Exercises / Quizzes) =====
export const exercises = mysqlTable("exercises", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  courseId: bigint("course_id", { mode: "number", unsigned: true }),
  categoryId: bigint("category_id", { mode: "number", unsigned: true }),
  title: varchar("title", { length: 255 }).notNull(),
  question: text("question").notNull(),
  type: mysqlEnum("type", ["multiple_choice", "fill_blank", "matching", "true_false", "open_ended", "code_challenge"]).default("multiple_choice").notNull(),
  options: json("options").$type<{ text: string; isCorrect: boolean }[]>(),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium"),
  points: int("points").default(10),
  language: varchar("language", { length: 50 }).default("en"),
  isDaily: boolean("is_daily").default(false),
  dailyDate: varchar("daily_date", { length: 20 }),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  aiGenerated: boolean("ai_generated").default(false),
  topicTags: json("topic_tags").$type<string[]>(),
  timeLimitMinutes: int("time_limit_minutes"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  courseIdx: index("exercises_course_idx").on(t.courseId),
  dailyIdx: index("exercises_daily_idx").on(t.isDaily, t.dailyDate),
  userDailyIdx: index("exercises_user_daily_idx").on(t.userId, t.dailyDate),
}));

export type Exercise = typeof exercises.$inferSelect;

// ===== EXERCISE ATTEMPTS =====
export const exerciseAttempts = mysqlTable("exercise_attempts", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  exerciseId: bigint("exercise_id", { mode: "number", unsigned: true }).notNull(),
  answer: text("answer"),
  isCorrect: boolean("is_correct").default(false),
  pointsEarned: int("points_earned").default(0),
  timeSpent: int("time_spent").default(0),
  aiScore: int("ai_score"),
  aiFeedback: text("ai_feedback"),
  aiCorrectnessPercent: int("ai_correctness_percent"),
  aiEvaluation: json("ai_evaluation").$type<{ score: number; feedback: string; correctnessPercent: number; strengths: string[]; improvements: string[] }>(),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("exercise_attempts_user_idx").on(t.userId),
  exerciseIdx: index("exercise_attempts_exercise_idx").on(t.exerciseId),
}));

export type ExerciseAttempt = typeof exerciseAttempts.$inferSelect;

// ===== LEADERBOARD =====
export const leaderboardEntries = mysqlTable("leaderboard_entries", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  userName: varchar("user_name", { length: 255 }),
  userAvatar: text("user_avatar"),
  totalPoints: int("total_points").default(0).notNull(),
  exercisesCompleted: int("exercises_completed").default(0),
  correctAnswers: int("correct_answers").default(0),
  studyHours: decimal("study_hours", { precision: 6, scale: 2 }).default("0.00"),
  currentStreak: int("current_streak").default(0),
  bestStreak: int("best_streak").default(0),
  accuracy: int("accuracy").default(0),
  period: mysqlEnum("period", ["weekly", "monthly", "allTime"]).default("allTime").notNull(),
  rank: int("rank"),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
  userPeriodIdx: index("leaderboard_user_period_idx").on(t.userId, t.period),
  pointsIdx: index("leaderboard_points_idx").on(t.totalPoints),
}));

export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;

// ===== LIVE CLASSES =====
export const liveClasses = mysqlTable("live_classes", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  courseId: bigint("course_id", { mode: "number", unsigned: true }),
  instructorId: bigint("instructor_id", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: int("duration").default(60),
  maxStudents: int("max_students").default(100),
  meetingUrl: text("meeting_url"),
  thumbnail: text("thumbnail"),
  status: mysqlEnum("status", ["scheduled", "live", "ended", "cancelled"]).default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LiveClass = typeof liveClasses.$inferSelect;

// ===== LIVE CLASS BOOKINGS =====
export const liveClassBookings = mysqlTable("live_class_bookings", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  liveClassId: bigint("live_class_id", { mode: "number", unsigned: true }).notNull(),
  attended: boolean("attended").default(false),
  bookedAt: timestamp("booked_at").defaultNow().notNull(),
});

// ===== CHAT ROOMS =====
export const chatRooms = mysqlTable("chat_rooms", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  isPrivate: boolean("is_private").default(false),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== MESSAGES =====
export const messages = mysqlTable("messages", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  roomId: bigint("room_id", { mode: "number", unsigned: true }),
  senderId: bigint("sender_id", { mode: "number", unsigned: true }).notNull(),
  receiverId: bigint("receiver_id", { mode: "number", unsigned: true }),
  content: text("content").notNull(),
  replyToId: bigint("reply_to_id", { mode: "number", unsigned: true }),
  reactions: json("reactions").$type<{ emoji: string; userId: number }[]>().default([]).notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  roomIdx: index("messages_room_idx").on(t.roomId),
  senderIdx: index("messages_sender_idx").on(t.senderId),
  replyIdx: index("messages_reply_idx").on(t.replyToId),
}));

export type Message = typeof messages.$inferSelect;

// ===== NOTIFICATIONS =====
export const notifications = mysqlTable("notifications", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["course", "exercise", "badge", "liveClass", "message", "payment", "system", "welcome", "course_published"]).default("system"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  link: text("link"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("notifications_user_idx").on(t.userId),
  readIdx: index("notifications_read_idx").on(t.userId, t.isRead),
}));

export type Notification = typeof notifications.$inferSelect;

// ===== BADGES =====
export const badges = mysqlTable("badges", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }).default("#f59e0b"),
  requirementType: mysqlEnum("requirement_type", ["exercises", "streak", "courses", "hours", "score", "lessons", "messages"]).default("exercises"),
  requirementValue: int("requirement_value").default(1),
  points: int("points").default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== USER BADGES =====
export const userBadges = mysqlTable("user_badges", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  badgeId: bigint("badge_id", { mode: "number", unsigned: true }).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("user_badges_user_idx").on(t.userId),
}));

// ===== CERTIFICATES =====
export const certificates = mysqlTable("certificates", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  courseId: bigint("course_id", { mode: "number", unsigned: true }).notNull(),
  certificateNumber: varchar("certificate_number", { length: 100 }).notNull().unique(),
  pdfUrl: text("pdf_url"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("certificates_user_idx").on(t.userId),
  courseIdx: index("certificates_course_idx").on(t.courseId),
  certNumIdx: uniqueIndex("certificates_number_idx").on(t.certificateNumber),
}));

// ===== PAYMENTS =====
export const payments = mysqlTable("payments", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  courseId: bigint("course_id", { mode: "number", unsigned: true }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  currency: varchar("currency", { length: 10 }).default("usd").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("payments_user_idx").on(t.userId),
  courseIdx: index("payments_course_idx").on(t.courseId),
  statusIdx: index("payments_status_idx").on(t.status),
  stripeSessionIdx: uniqueIndex("payments_stripe_session_idx").on(t.stripeSessionId),
}));

// ===== REVIEWS =====
export const reviews = mysqlTable("reviews", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  courseId: bigint("course_id", { mode: "number", unsigned: true }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  userCourseIdx: uniqueIndex("reviews_user_course_idx").on(t.userId, t.courseId),
  courseIdx: index("reviews_course_idx").on(t.courseId),
}));

// ===== REFERRALS =====
export const referrals = mysqlTable("referrals", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  referrerId: bigint("referrer_id", { mode: "number", unsigned: true }).notNull(),
  referredId: bigint("referred_id", { mode: "number", unsigned: true }),
  code: varchar("code", { length: 50 }).notNull(),
  converted: boolean("converted").default(false),
  rewardGiven: boolean("reward_given").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== SUBSCRIPTION PLANS =====
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingPeriod: mysqlEnum("billing_period", ["monthly", "yearly"]).default("monthly"),
  features: json("features").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== USER SUBSCRIPTIONS =====
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  planId: bigint("plan_id", { mode: "number", unsigned: true }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  plan: varchar("plan", { length: 100 }),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "past_due"]).default("active"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  cancelledAt: timestamp("cancelled_at"),
});

// ===== ACTIVITY LOGS =====
export const activityLogs = mysqlTable("activity_logs", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  details: json("details").$type<Record<string, any>>(),
  sessionStart: timestamp("session_start").defaultNow(),
  sessionEnd: timestamp("session_end"),
  duration: int("duration").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("activity_logs_user_idx").on(t.userId),
}));

// ===== AI TUTOR CONVERSATIONS =====
export const aiConversations = mysqlTable("ai_conversations", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }),
  discipline: varchar("discipline", { length: 100 }).notNull(),
  messages: json("messages").$type<{ role: string; content: string }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
  userIdx: index("ai_conversations_user_idx").on(t.userId),
}));

// ===== TESTIMONIALS =====
export const testimonials = mysqlTable("testimonials", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  avatar: text("avatar"),
  content: text("content").notNull(),
  rating: int("rating").default(5),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== BLOG POSTS =====
export const blogPosts = mysqlTable("blog_posts", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  image: text("image"),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  authorAvatar: text("author_avatar"),
  tags: json("tags").$type<string[]>(),
  language: varchar("language", { length: 10 }).default("en").notNull(),
  published: boolean("published").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => ({
  slugIdx: uniqueIndex("blog_posts_slug_idx").on(t.slug),
  publishedIdx: index("blog_posts_published_idx").on(t.published),
  languageIdx: index("blog_posts_language_idx").on(t.language),
}));

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ===== EMAIL QUEUE (Fallback / Retry) =====
export const emailQueue = mysqlTable("email_queue", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  to: varchar("to", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending"),
  attempts: int("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
});

// ===== PROCESSED WEBHOOKS (Idempotency) =====
export const processedWebhooks = mysqlTable("processed_webhooks", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  eventId: varchar("event_id", { length: 255 }).notNull().unique(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

// ===== PLATFORM SETTINGS =====
export const platformSettings = mysqlTable("platform_settings", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  settingKey: varchar("setting_key", { length: 100 }).notNull(),
  settingValue: text("setting_value"),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  keyIdx: uniqueIndex("platform_settings_key_idx").on(t.settingKey),
}));

// ===== ADMIN CONFIG & LOGS =====
export const exerciseConfig = mysqlTable("exercise_config", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  questionsPerCourse: int("questions_per_course").default(3).notNull(),
  easyPercent: int("easy_percent").default(30).notNull(),
  mediumPercent: int("medium_percent").default(50).notNull(),
  hardPercent: int("hard_percent").default(20).notNull(),
  generationTime: varchar("generation_time", { length: 10 }).default("00:01").notNull(),
  aiModel: varchar("ai_model", { length: 50 }).default("gemini-2.5-flash").notNull(),
  useFallbackBank: boolean("use_fallback_bank").default(true).notNull(),
  promptTemplate: text("prompt_template"),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const exerciseReviewStatus = mysqlTable("exercise_review_status", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  exerciseId: bigint("exercise_id", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "live"]).default("pending").notNull(),
  reviewedBy: bigint("reviewed_by", { mode: "number", unsigned: true }),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
});

export const pointsAuditLog = mysqlTable("points_audit_log", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  pointsChanged: int("points_changed").notNull(),
  newTotal: int("new_total").notNull(),
  reason: text("reason").notNull(),
  adjustedBy: bigint("adjusted_by", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leaderboardBans = mysqlTable("leaderboard_bans", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  reason: text("reason").notNull(),
  bannedBy: bigint("banned_by", { mode: "number", unsigned: true }).notNull(),
  bannedAt: timestamp("banned_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const adminActivityLog = mysqlTable("admin_activity_log", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  adminId: bigint("admin_id", { mode: "number", unsigned: true }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: bigint("target_id", { mode: "number", unsigned: true }),
  details: json("details").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
