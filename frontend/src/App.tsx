import { Routes, Route } from 'react-router'
import { AppLayout } from './layouts/AppLayout'
import { AdminApp } from './admin/App'
import Home from './pages/Home'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import LessonPlayer from './pages/LessonPlayer'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import AITutor from './pages/AITutor'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Chat from './pages/Chat'
import Exercises from './pages/Exercises'
import Leaderboard from './pages/Leaderboard'
import LiveClasses from './pages/LiveClasses'
import Profile from './pages/Profile'
import Subscription from './pages/Subscription'
import Notifications from './pages/Notifications'
import Checkout from './pages/Checkout'
import PaymentSuccess from './pages/PaymentSuccess'
import SearchResults from './pages/SearchResults'
import CertificateView from './pages/CertificateView'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Cookies from './pages/Cookies'
import Languages from './pages/Languages'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:slug" element={<CourseDetail />} />
        <Route path="courses/:slug/lessons/:lessonId" element={<LessonPlayer />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="ai-tutor" element={<AITutor />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="chat" element={<Chat />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="live-classes" element={<LiveClasses />} />
        <Route path="profile" element={<Profile />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="payment-success" element={<PaymentSuccess />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="certificate/:id" element={<CertificateView />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="cookies" element={<Cookies />} />
        <Route path="languages" element={<Languages />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin/*" element={<AdminApp />} />
    </Routes>
  )
}