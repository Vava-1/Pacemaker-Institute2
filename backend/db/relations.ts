import { relations } from "drizzle-orm";
import {
  users, courses, modules, lessons, enrollments, lessonProgress,
  exercises, exerciseAttempts, payments, reviews, certificates,
  notifications, categories, badges, userBadges, passwordResets,
  liveClasses, liveClassBookings, aiConversations, messages, chatRooms,
  leaderboardEntries, referrals, subscriptionPlans, userSubscriptions,
  activityLogs, blogPosts,
} from "./schema";

// ── USERS ──
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  payments: many(payments),
  reviews: many(reviews),
  certificates: many(certificates),
  notifications: many(notifications),
  userBadges: many(userBadges),
  exerciseAttempts: many(exerciseAttempts),
  aiConversations: many(aiConversations),
  passwordResets: many(passwordResets),
  sentMessages: many(messages),
  activityLogs: many(activityLogs),
  liveClassBookings: many(liveClassBookings),
  taughtCourses: many(courses),
  referralsMade: many(referrals),
  userSubscriptions: many(userSubscriptions),
  leaderboardEntries: many(leaderboardEntries),
}));

// ── CATEGORIES ──
export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));

// ── COURSES ──
export const coursesRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, { fields: [courses.categoryId], references: [categories.id] }),
  instructor: one(users, { fields: [courses.instructorId], references: [users.id] }),
  modules: many(modules),
  lessons: many(lessons),
  enrollments: many(enrollments),
  reviews: many(reviews),
  certificates: many(certificates),
  payments: many(payments),
  exercises: many(exercises),
}));

// ── MODULES ──
export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

// ── LESSONS ──
export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  progress: many(lessonProgress),
}));

// ── ENROLLMENTS ──
export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
  lastLesson: one(lessons, { fields: [enrollments.lastLessonId], references: [lessons.id] }),
  lessonProgress: many(lessonProgress),
}));

// ── LESSON PROGRESS ──
export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  enrollment: one(enrollments, { fields: [lessonProgress.enrollmentId], references: [enrollments.id] }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
}));

// ── EXERCISES ──
export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  course: one(courses, { fields: [exercises.courseId], references: [courses.id] }),
  category: one(categories, { fields: [exercises.categoryId], references: [categories.id] }),
  attempts: many(exerciseAttempts),
}));

// ── EXERCISE ATTEMPTS ──
export const exerciseAttemptsRelations = relations(exerciseAttempts, ({ one }) => ({
  user: one(users, { fields: [exerciseAttempts.userId], references: [users.id] }),
  exercise: one(exercises, { fields: [exerciseAttempts.exerciseId], references: [exercises.id] }),
}));

// ── PAYMENTS ──
export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  course: one(courses, { fields: [payments.courseId], references: [courses.id] }),
}));

// ── REVIEWS ──
export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  course: one(courses, { fields: [reviews.courseId], references: [courses.id] }),
}));

// ── CERTIFICATES ──
export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, { fields: [certificates.userId], references: [users.id] }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
}));

// ── NOTIFICATIONS ──
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// ── PASSWORD RESETS ──
export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, { fields: [passwordResets.userId], references: [users.id] }),
}));

// ── BADGES ──
export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

// ── USER BADGES ──
export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
}));

// ── LEADERBOARD ──
export const leaderboardRelations = relations(leaderboardEntries, ({ one }) => ({
  user: one(users, { fields: [leaderboardEntries.userId], references: [users.id] }),
}));

// ── LIVE CLASSES ──
export const liveClassesRelations = relations(liveClasses, ({ one, many }) => ({
  course: one(courses, { fields: [liveClasses.courseId], references: [courses.id] }),
  instructor: one(users, { fields: [liveClasses.instructorId], references: [users.id] }),
  bookings: many(liveClassBookings),
}));

// ── LIVE CLASS BOOKINGS ──
export const liveClassBookingsRelations = relations(liveClassBookings, ({ one }) => ({
  user: one(users, { fields: [liveClassBookings.userId], references: [users.id] }),
  liveClass: one(liveClasses, { fields: [liveClassBookings.liveClassId], references: [liveClasses.id] }),
}));

// ── CHAT ROOMS ──
export const chatRoomsRelations = relations(chatRooms, ({ many }) => ({
  messages: many(messages),
}));

// ── MESSAGES ──
export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  room: one(chatRooms, { fields: [messages.roomId], references: [chatRooms.id] }),
}));

// ── AI CONVERSATIONS ──
export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
}));

// ── REFERRALS ──
export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, { fields: [referrals.referrerId], references: [users.id] }),
}));

// ── SUBSCRIPTION PLANS ──
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}));

// ── USER SUBSCRIPTIONS ──
export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, { fields: [userSubscriptions.userId], references: [users.id] }),
  plan: one(subscriptionPlans, { fields: [userSubscriptions.planId], references: [subscriptionPlans.id] }),
}));

// ── ACTIVITY LOGS ──
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));
