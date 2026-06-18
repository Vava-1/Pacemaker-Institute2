import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";

export default function ResendVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillEmail = (location.state as any)?.email || "";
  const [email, setEmail] = useState(prefillEmail);
  const [sent, setSent] = useState(false);

  const resendMutation = useMutation({
    mutationFn: (e: string) => trpc.auth.resendVerification.mutate({ email: e }),
    onSuccess: (data) => {
      setSent(true);
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to resend verification email.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    resendMutation.mutate(email.trim());
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Email Sent!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a new verification email to <strong>{email}</strong>. Please check your inbox.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <Mail className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Resend Verification Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Enter your email and we'll send you a new verification link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={resendMutation.isPending}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {resendMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Resend Verification
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => navigate("/login")}
          className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
