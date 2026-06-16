import { Routes, Route } from 'react-router'
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

export function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Overview />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/courses" element={<Courses />} />
        <Route path="/admin/exercises" element={<Exercises />} />
        <Route path="/admin/leaderboard" element={<Leaderboard />} />
        <Route path="/admin/payments" element={<Payments />} />
        <Route path="/admin/ai-management" element={<AIManagement />} />
        <Route path="/admin/notifications" element={<Notifications />} />
        <Route path="/admin/reports" element={<Analytics />} />
        <Route path="/admin/security" element={<Security />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
