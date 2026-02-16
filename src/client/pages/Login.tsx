import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { signIn } from "../lib/auth.ts";
import { Card, CardContent, Button, Input } from "../components/ui.tsx";
import { TESTIMONIALS, pickRandom } from "../lib/testimonials.ts";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const testimonial = useMemo(() => pickRandom(TESTIMONIALS), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Login failed");
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden items-end p-12">
        <img
          src="/images/elderly-woman-phone.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-primary/30" />
        <div className="relative z-10 text-white">
          <p className="font-display text-3xl font-semibold leading-snug">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          <p className="mt-6 text-white/70 text-sm">{testimonial.attribution}</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-in">
          <div className="mb-10">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
              <img src="/logogram.svg" alt="" className="w-8 h-8" />
              <img src="/logotype.svg" alt="Claude Care" className="h-5" />
            </Link>
            <h1 className="font-display text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-1.5">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organization.com"
                required
                autoFocus
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&rsquo;t have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:text-primary/80 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
