import { Link } from "react-router";
import { Button } from "../components/ui.tsx";

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M12 4v8l4 4" />
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
            </div>
            <span className="font-display font-semibold text-foreground text-lg tracking-tight">
              claude<span className="text-primary">care</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/60 via-background to-secondary-light/30" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 text-sm text-primary font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI-powered wellness monitoring
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-foreground leading-[1.12] tracking-tight">
              Caring check-ins,
              <br />
              <span className="text-primary">intelligently automated.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Weekly AI phone calls that assess wellbeing, catch risks early,
              and alert your team when someone needs help. Built for organizations
              serving older adults.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="text-base">
                  Start Free
                  <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="text-base">How It Works</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <Stat value="5 min" label="Setup time" />
          <Stat value="6" label="Clinical assessments per call" />
          <Stat value="24/7" label="Automated monitoring" />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">How It Works</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
              Three steps to start monitoring the wellbeing of the people you serve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number="01"
              title="Upload Your Roster"
              description="Upload a CSV of your clients with names and phone numbers. That's all we need to get started."
              color="bg-primary"
            />
            <StepCard
              number="02"
              title="AI Calls Weekly"
              description="Our AI conducts friendly wellness checks covering nutrition, sleep, mood, social activity, and mobility."
              color="bg-secondary"
            />
            <StepCard
              number="03"
              title="Monitor & Respond"
              description="View real-time dashboards with color-coded flags. Get instant alerts when someone needs attention."
              color="bg-accent"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Clinical-Grade Assessments
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
              Every call runs validated screening instruments through natural conversation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<HeartIcon />}
              title="CLOVA-5"
              description="Meals, sleep, health, social activity, and mobility scored 1-5 each call."
            />
            <FeatureCard
              icon={<BrainIcon />}
              title="PHQ-2 Screening"
              description="Depression screening with automatic C-SSRS follow-up when scores indicate risk."
            />
            <FeatureCard
              icon={<ClockIcon />}
              title="Ottawa 3DY"
              description="Cognitive screening integrated naturally into the conversation flow."
            />
            <FeatureCard
              icon={<AlertIcon />}
              title="Real-Time Escalations"
              description="Immediate, urgent, and routine tiers with one-click acknowledgment."
            />
            <FeatureCard
              icon={<TrendIcon />}
              title="Trend Tracking"
              description="Track scores over time to spot gradual decline before it becomes critical."
            />
            <FeatureCard
              icon={<TranscriptIcon />}
              title="Call Transcripts"
              description="Full transcripts and AI-generated summaries for every wellness check."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mt-4 text-lg max-w-lg mx-auto">
            Create your free account, upload your client list, and start receiving wellness insights today.
          </p>
          <div className="mt-10">
            <Link to="/signup">
              <Button size="lg" className="text-base">
                Create Free Account
                <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M12 4v8l4 4" />
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
            </div>
            <span className="font-display font-semibold text-foreground tracking-tight">
              claude<span className="text-primary">care</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} ClaudeCare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ---- Sub-components ----

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="font-display text-3xl font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function StepCard({ number, title, description, color }: { number: string; title: string; description: string; color: string }) {
  return (
    <div className="group rounded-xl border border-border bg-card p-7 transition-all duration-200 hover:shadow-warm-lg hover:-translate-y-0.5">
      <div className={`w-10 h-10 rounded-lg ${color} text-white flex items-center justify-center text-sm font-bold font-display`}>
        {number}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground font-display">{title}</h3>
      <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group rounded-xl border border-border bg-background p-6 transition-all duration-200 hover:bg-card hover:shadow-warm hover:border-border-light">
      <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-white">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-foreground font-display">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// ---- Icons ----

function HeartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 014 4v1a3 3 0 013 3v1a3 3 0 01-1.5 2.6M12 2a4 4 0 00-4 4v1a3 3 0 00-3 3v1a3 3 0 001.5 2.6M12 2v20M8.5 16.5a3 3 0 003.5 3 3 3 0 003.5-3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function TranscriptIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
