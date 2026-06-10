import { Routes, Route } from 'react-router'
import { Suspense, lazy } from 'react'
import { AppLayout } from './layouts/AppLayout'
import { AdminLayout } from './admin/layout/AdminLayout'
import { Spinner } from './components/ui/spinner'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))

const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const Exercises = lazy(() => import('./pages/Exercises'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const AITutor = lazy(() => import('./pages/AITutor'))
const Languages = lazy(() => import('./pages/Languages'))
const LiveClasses = lazy(() => import('./pages/LiveClasses'))
const Chat = lazy(() => import('./pages/Chat'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const Subscription = lazy(() => import('./pages/Subscription'))

const Checkout = lazy(() => import('./pages/Checkout'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const LessonPlayer = lazy(() => import('./pages/LessonPlayer'))
const CertificateView = lazy(() => import('./pages/CertificateView'))

const NotFound = lazy(() => import('./pages/NotFound'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Cookies = lazy(() => import('./pages/Cookies'))

// Admin pages
const AdminDashboardPage = lazy(() => import('./admin/pages/Dashboard'))
const AdminUsers = lazy(() => import('./admin/pages/Users'))
const AdminCourses = lazy(() => import('./admin/pages/Courses'))
const AdminCategories = lazy(() => import('./admin/pages/Categories'))
const AdminFinance = lazy(() => import('./admin/pages/Finance'))
const AdminSettings = lazy(() => import('./admin/pages/Settings'))
const AdminCourseEditor = lazy(() => import('./admin/pages/CourseEditor'))
const AdminLessonEditor = lazy(() => import('./admin/pages/LessonEditor'))

export default function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner className="h-8 w-8" /></div>}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/courses/:slug/lessons/:lessonId" element={<LessonPlayer />} />
          <Route path="/checkout/:courseId" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/certificates/:certificateNumber" element={<CertificateView />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/ai-tutor" element={<AITutor />} />
          <Route path="/languages" element={<Languages />} />
          <Route path="/live-classes" element={<LiveClasses />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/finance" element={<AdminFinance />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/courses/new/edit" element={<AdminCourseEditor />} />
          <Route path="/admin/courses/:id/edit" element={<AdminCourseEditor />} />
          <Route path="/admin/courses/:courseId/lessons/new" element={<AdminLessonEditor />} />
          <Route path="/admin/courses/:courseId/lessons/:lessonId" element={<AdminLessonEditor />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

