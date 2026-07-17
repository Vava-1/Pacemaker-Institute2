import { Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { lazy, Suspense } from 'react'
import { AdminApp } from './admin/App'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

// Lazy-loaded routes — keeps the initial bundle small.
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.default })))
const CoursesPage = lazy(() => import('./pages/CoursesPage').then(m => ({ default: m.default })))
const CourseDetail = lazy(() => import('./pages/CourseDetail').then(m => ({ default: m.default })))
const LessonPlayer = lazy(() => import('./pages/LessonPlayer').then(m => ({ default: m.default })))
const ExercisesPage = lazy(() => import('./pages/Exercises').then(m => ({ default: m.default })))
const LeaderboardPage = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.default })))
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.default })))
const AITutor = lazy(() => import('./pages/AITutor').then(m => ({ default: m.default })))
const LiveClasses = lazy(() => import('./pages/LiveClasses').then(m => ({ default: m.default })))
const Chat = lazy(() => import('./pages/Chat').then(m => ({ default: m.default })))
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.default })))
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.default })))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess').then(m => ({ default: m.default })))
const CertificateView = lazy(() => import('./pages/CertificateView').then(m => ({ default: m.default })))
const Subscription = lazy(() => import('./pages/Subscription').then(m => ({ default: m.default })))
const SearchResults = lazy(() => import('./pages/SearchResults').then(m => ({ default: m.default })))
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.default })))
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.default })))
const Cookies = lazy(() => import('./pages/Cookies').then(m => ({ default: m.default })))

// Full-screen route loading fallback
function RouteLoader() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/search" element={<Suspense fallback={<RouteLoader />}><SearchResults /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<RouteLoader />}><Terms /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<RouteLoader />}><Privacy /></Suspense>} />
          <Route path="/cookies" element={<Suspense fallback={<RouteLoader />}><Cookies /></Suspense>} />

          {/* Public course catalog */}
          <Route path="/courses" element={<Suspense fallback={<RouteLoader />}><CoursesPage /></Suspense>} />
          <Route path="/courses/:slug" element={<Suspense fallback={<RouteLoader />}><CourseDetail /></Suspense>} />

          {/* Protected — student area */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><Dashboard /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/courses/:slug/lessons/:lessonId" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><LessonPlayer /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/exercises" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><ExercisesPage /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><LeaderboardPage /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/ai-tutor" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><AITutor /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/live-classes" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><LiveClasses /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><Chat /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><Notifications /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><Profile /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/checkout/:courseId" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><Checkout /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/payment/success" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><PaymentSuccess /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/certificates/:certificateNumber" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><CertificateView /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/subscription" element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}><Subscription /></Suspense>
            </ProtectedRoute>
          } />

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
    </ErrorBoundary>
  )
}
