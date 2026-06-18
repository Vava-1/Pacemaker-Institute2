import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ResendVerification from "./pages/ResendVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Student pages
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Lesson from "./pages/Lesson";
import Exercises from "./pages/Exercises";
import Leaderboard from "./pages/Leaderboard";
import Certificates from "./pages/Certificates";
import AIChat from "./pages/AIChat";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// Instructor pages
import InstructorDashboard from "./pages/InstructorDashboard";
import InstructorCourses from "./pages/InstructorCourses";
import CreateCourse from "./pages/CreateCourse";
import EditCourse from "./pages/EditCourse";
import InstructorStudents from "./pages/InstructorStudents";
import InstructorAnalytics from "./pages/InstructorAnalytics";
import InstructorEarnings from "./pages/InstructorEarnings";
import InstructorLiveClasses from "./pages/InstructorLiveClasses";
import CreateLiveClass from "./pages/CreateLiveClass";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminCourses from "./pages/AdminCourses";
import AdminPayments from "./pages/AdminPayments";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/resend-verification" element={<ResendVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Student Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Courses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:slug"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <CourseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lessons/:id"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Lesson />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Exercises />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/certificates"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Certificates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-chat"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <AIChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Community />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor", "admin"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor", "admin"]}>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Instructor Routes */}
      <Route
        path="/instructor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/new"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <CreateCourse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <EditCourse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/students"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/analytics"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/earnings"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorEarnings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/live-classes"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorLiveClasses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/live-classes/new"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <CreateLiveClass />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPayments />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
    </Routes>
  );
}
