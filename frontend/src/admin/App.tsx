import { Routes, Route } from 'react-router'
import { lazy, Suspense } from 'react'
import { AdminLayout } from './layout/AdminLayout'
import Overview from './pages/Dashboard'
import Users from './pages/Users'
import Courses from './pages/Courses'
import { Exercises } from './pages/Exercises'
import { Leaderboard } from './pages/Leaderboard'
import Payments from './pages/Payments'
import { AIManagement } from './pages/AIManagement'
import Notifications from './pages/Notifications'
import Analytics from './pages/Analytics'
import Security from './pages/Security'
import Settings from './pages/Settings'
import NotFound from '@/pages/NotFound'

// Lazy-load the less-frequently-used admin pages so the main admin bundle
// stays small.
const Categories = lazy(() => import('./pages/Categories').then(m => ({ default: m.default })))
const Finance = lazy(() => import('./pages/Finance').then(m => ({ default: m.default })))
const Certificates = lazy(() => import('./pages/Certificates').then(m => ({ default: m.default })))
const Badges = lazy(() => import('./pages/Badges').then(m => ({ default: m.default })))
const LiveClassesManager = lazy(() => import('./pages/LiveClassesManager').then(m => ({ default: m.default })))
const BlogManager = lazy(() => import('./pages/BlogManager').then(m => ({ default: m.default })))
const ActivityLog = lazy(() => import('./pages/ActivityLog').then(m => ({ default: m.default })))
const Communications = lazy(() => import('./pages/Communications').then(m => ({ default: m.default })))
const CourseEditor = lazy(() => import('./pages/CourseEditor').then(m => ({ default: m.default })))
const LessonEditor = lazy(() => import('./pages/LessonEditor').then(m => ({ default: m.default })))

function AdminLoader() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  )
}

function withSuspense(Component: React.LazyExoticComponent<React.ComponentType<any>>) {
  return (
    <Suspense fallback={<AdminLoader />}>
      <Component />
    </Suspense>
  )
}

export function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Overview />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/courses" element={<Courses />} />
        <Route path="/admin/courses/new" element={withSuspense(CourseEditor)} />
        <Route path="/admin/courses/:id/edit" element={withSuspense(CourseEditor)} />
        <Route path="/admin/courses/:courseId/lessons/:lessonId" element={withSuspense(LessonEditor)} />
        <Route path="/admin/categories" element={withSuspense(Categories)} />
        <Route path="/admin/finance" element={withSuspense(Finance)} />
        <Route path="/admin/payments" element={<Payments />} />
        <Route path="/admin/certificates" element={withSuspense(Certificates)} />
        <Route path="/admin/badges" element={withSuspense(Badges)} />
        <Route path="/admin/live-classes" element={withSuspense(LiveClassesManager)} />
        <Route path="/admin/blog" element={withSuspense(BlogManager)} />
        <Route path="/admin/activity-log" element={withSuspense(ActivityLog)} />
        <Route path="/admin/communications" element={withSuspense(Communications)} />
        <Route path="/admin/exercises" element={<Exercises />} />
        <Route path="/admin/leaderboard" element={<Leaderboard />} />
        <Route path="/admin/ai-management" element={<AIManagement />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/notifications" element={<Notifications />} />
        <Route path="/admin/reports" element={<Analytics />} />
        <Route path="/admin/security" element={<Security />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
