import { useState } from "react";
import { Link } from "react-router";
import { Button, Input } from "../components/ui.tsx";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, redirectTo: "/reset-password" }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in">
        <div className="mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M12 4v8l4 4" /><circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
            </div>
            <span className="font-display font-semibold text-foreground text-lg tracking-tight">
              claude<span className="text-primary">care</span>
            </span>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-foreground">Reset your password</h1>
          <p className="text-muted-foreground mt-1.5">We&rsquo;ll send you a link to reset it.</p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-primary/20 bg-primary-light p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">Check your email</h2>
            <p className="text-sm text-muted-foreground mt-2">
              If an account exists for <span className="text-foreground font-medium">{email}</span>, we&rsquo;ve sent a password reset link.
            </p>
            <Link to="/login" className="inline-block mt-6 text-sm text-primary font-medium hover:text-primary/80 transition-colors">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link to="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
