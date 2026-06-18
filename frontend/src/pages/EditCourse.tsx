import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 lg:p-8 lg:ml-64">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/instructor/courses")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Course #{id}</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <p className="text-gray-600 dark:text-gray-400">Course editing form will go here.</p>
        </div>
      </div>
    </div>
  );
}
