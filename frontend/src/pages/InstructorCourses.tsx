import { Link } from "react-router-dom";
import { Plus, BookOpen, ChevronRight } from "lucide-react";

export default function InstructorCourses() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8 lg:ml-64">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage all your courses</p>
          </div>
          <Link
            to="/instructor/courses/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Course
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No courses yet. Create your first course!</p>
        </div>
      </div>
    </div>
  );
}
