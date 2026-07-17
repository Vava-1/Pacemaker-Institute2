import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { trpc, setAuthToken } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [noAccountError, setNoAccountError] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      // Persist tokens for the tRPC client
      setAuthToken(data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      // Refresh the `me` query so ProtectedRoute lets the user through
      await refresh();
      toast.success(`Welcome back, ${data.user.name || "Learner"}!`);

      // Redirect based on role
      if (data.user.role === "instructor" || data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error: any) => {
      const message = error?.message || "";
      const code = error?.data?.code;
      if (
        message.includes("don't have an account") ||
        message.includes("No account found") ||
        code === "NOT_FOUND"
      ) {
        setNoAccountError(true);
        toast.error("You don't have an account. Create your account to continue.");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Pacemaker Institute
          </h1>
          <p className="text-muted-foreground mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-xl p-6 sm:p-8">
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
              <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setNoAccountError(false);
                  }}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-foreground">
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">
                New here?
              </span>
            </div>
          </div>

          {/* Create Account Link */}
          <Link
            to="/register"
            className="w-full block text-center py-3 px-4 border border-border text-foreground font-semibold rounded-lg hover:bg-muted transition-colors"
          >
            Create Account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
