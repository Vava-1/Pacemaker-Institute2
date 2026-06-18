import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { useAuthStore } from "../store/auth";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [noAccountError, setNoAccountError] = useState(false);

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      trpc.auth.login.mutate(data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name || "Learner"}!`);

      // Redirect based on role
      if (data.user.role === "instructor") {
        navigate("/instructor/dashboard");
      } else if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error: any) => {
      const message = error.message || "";

      // Check for "no account" message from backend
      if (
        message.includes("don't have an account") ||
        message.includes("No account found") ||
        error.code === "NOT_FOUND"
      ) {
        setNoAccountError(true);
        toast.error("You don't have an account. Create your account to continue.");
      } else if (message.includes("verify your email")) {
        setNoAccountError(false);
        toast.error(message);
        // Optionally redirect to resend verification
        setTimeout(() => {
          navigate("/resend-verification", { state: { email } });
        }, 2000);
      } else {
        setNoAccountError(false);
        toast.error(message || "Failed to sign in. Please try again.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNoAccountError(false);

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pacemaker Institute
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          {/* No Account Error Banner */}
          {noAccountError && (
            <div className="mb-5 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  You don't have an account
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400 mt-0.5">
                  Create your account to continue learning with us.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                >
                  Create Account
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setNoAccountError(false);
                  }}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                New here?
              </span>
            </div>
          </div>

          {/* Create Account Link */}
          <Link
            to="/register"
            className="w-full block text-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Create Account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
