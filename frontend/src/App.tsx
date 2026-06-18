import { Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { AdminApp } from './admin/App'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CoursesPage from './pages/CoursesPage'
import CourseDetail from './pages/CourseDetail'
import ExercisesPage from './pages/ExercisesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import Profile from './pages/Profile'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

// ADD THESE — create these page files if they don't exist
// If your files are named differently, adjust the import names below
import PiAssistant from './pages/PiAssistant'
import LiveClasses from './pages/LiveClasses'
import CommunityChat from './pages/CommunityChat'
import NotificationsPage from './pages/NotificationsPage'

import { AppLayout } from './layouts/AppLayout'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/ai-tutor" element={<PiAssistant />} />
          <Route path="/live-classes" element={<LiveClasses />} />
          <Route path="/chat" element={<CommunityChat />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>

      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={5000}
      />
    </>
  )
}
