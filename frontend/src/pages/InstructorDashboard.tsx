import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  DollarSign,
  Video,
  Plus,
  Star,
  TrendingUp,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  Award,
  Eye,
} from "lucide-react";

export default function InstructorDashboard() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch instructor's courses
  const { data: myCourses } = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: () => trpc.course.getInstructorCourses.query(),
    enabled: !!user,
  });

  // Fetch instructor stats
  const { data: stats } = useQuery({
    queryKey: ["instructor-stats"],
    queryFn: () => trpc.dashboard.getInstructorStats.query(),
    enabled: !!user,
  });

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "courses", label: "My Courses", icon: BookOpen },
    { id: "students", label: "Students", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "live-classes", label: "Live Classes", icon: Video },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden lg:flex flex-col fixed h-full">
        {/* Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-sm">Pacemaker</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Instructor Portal</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || "I"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || "Instructor"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Instructor Portal</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-600 dark:text-red-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 lg:p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name?.split(" ")[0] || "Instructor"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Here's what's happening with your courses today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Students"
              value={stats?.totalStudents?.toString() || "0"}
              change="+12%"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Active Courses"
              value={stats?.activeCourses?.toString() || "0"}
              change="+2"
              icon={BookOpen}
              color="green"
            />
            <StatCard
              title="Total Earnings"
              value={`$${stats?.totalEarnings?.toString() || "0"}`}
              change="+8%"
              icon={DollarSign}
              color="yellow"
            />
            <StatCard
              title="Avg. Rating"
              value={stats?.avgRating?.toString() || "0.0"}
              change="+0.3"
              icon={Star}
              color="purple"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickActionCard
                title="Create New Course"
                description="Build a new course from scratch"
                icon={Plus}
                href="/instructor/courses/new"
                color="blue"
              />
              <QuickActionCard
                title="Schedule Live Class"
                description="Host a live session with students"
                icon={Video}
                href="/instructor/live-classes/new"
                color="green"
              />
              <QuickActionCard
                title="View Analytics"
                description="Deep dive into your performance"
                icon={BarChart3}
                href="/instructor/analytics"
                color="purple"
              />
            </div>
          </div>

          {/* My Courses */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                My Courses
              </h2>
              <Link
                to="/instructor/courses"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {myCourses && myCourses.length > 0 ? (
              <div className="space-y-3">
                {myCourses.slice(0, 3).map((course: any) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {course.totalStudents || 0} students
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {course.totalLessons || 0} lessons
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            course.status === "published"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {course.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/instructor/courses/${course.id}/edit`}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/courses/${course.slug}`}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't created any courses yet.
                </p>
                <Link
                  to="/instructor/courses/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Course
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Live Classes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Live Classes
              </h2>
              <Link
                to="/instructor/live-classes"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No upcoming live classes scheduled.
              </p>
              <Link
                to="/instructor/live-classes/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Video className="w-4 h-4" />
                Schedule a Live Class
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{title}</p>
    </div>
  );
}

// Quick Action Card
function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <Link
      to={href}
      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
