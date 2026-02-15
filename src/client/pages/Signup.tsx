import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { signUp } from "../lib/auth.ts";
import { Card, CardContent, Button, Input } from "../components/ui.tsx";

export function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Signup failed");
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-secondary relative overflow-hidden items-end p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-secondary/80" />
        <div className="absolute top-1/3 -right-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-1/4 -left-8 w-52 h-52 rounded-full bg-white/5" />
        <div className="relative z-10 text-white">
          <p className="font-display text-3xl font-semibold leading-snug">
            Set up monitoring for your entire roster in under 5 minutes.
          </p>
          <p className="mt-6 text-white/70 text-sm">Upload a CSV and let AI handle the rest.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
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
            <h1 className="font-display text-2xl font-semibold text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-1.5">Get started with ClaudeCare in minutes.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Organization Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sunrise Senior Living"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organization.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
