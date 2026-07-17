import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: (data) => {
      setSent(true);
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send reset email.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    forgotMutation.mutate(email.trim());
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Check Your Email
          </h2>
          <p className="text-muted-foreground mb-6">
            If an account exists with this email, you will receive a password reset link.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <Mail className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-foreground">
            Forgot Password?
          </h2>
          <p className="text-muted-foreground mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-foreground mb-1">
              Email Address
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={forgotMutation.isPending}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {forgotMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Send Reset Link
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
