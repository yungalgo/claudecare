import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui.tsx";

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logogram.svg" alt="" className="w-7 h-7" />
            <img src="/logotype.svg" alt="Claude Care" className="h-4" />
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
      <section className="relative overflow-hidden bg-noise">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/60 via-background to-secondary-light/30" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl animate-float-delayed" />
        <div className="absolute top-40 left-1/3 w-[300px] h-[300px] rounded-full bg-accent/5 blur-3xl" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 text-sm text-primary font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Built on peer-reviewed clinical instruments
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-foreground leading-[1.12] tracking-tight">
                Evidence-based wellness monitoring,{" "}
                <span className="text-primary">powered by AI.</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Automated AI phone calls that run validated clinical screenings through
                warm, natural conversation — catching risks early and alerting care
                teams when someone needs help.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="text-base">
                    Get Started
                    <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" size="lg" className="text-base">Try a Demo Call</Button>
                </Link>
              </div>
            </div>

            {/* Right: live call mockup */}
            <div className="hidden lg:block">
              <LiveCallMockup />
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="relative border-y border-border bg-card/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 stagger-in">
            <Stat value="14M+" label="Isolated seniors in the U.S." />
            <Stat value="6" label="Validated instruments per call" />
            <Stat value="$0.68" label="Average cost per call" />
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3">The Problem</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              We can't call everyone. <span className="text-primary">But AI can.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
              The geriatric care workforce is shrinking while the aging population grows.
              Critical health changes go undetected between visits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 stagger-in">
            <ProblemCard
              stat="14M"
              label="seniors live alone"
              detail="Over 14 million older adults in the U.S. live alone, many with limited social contact."
              source="AARP / U.S. Census Bureau"
              icon={<PersonAloneIcon />}
              iconBg="bg-secondary-light"
            />
            <ProblemCard
              stat="60%"
              label="of dementia undiagnosed"
              detail="The majority of dementia cases go undetected, delaying intervention by years."
              source="Alzheimer's Association"
              icon={<BrainAlertIcon />}
              iconBg="bg-primary-light"
            />
            <ProblemCard
              stat="$15-25"
              label="per human wellness call"
              detail="Manual phone-based check-ins cost $15-25 each. At scale, this is unsustainable."
              source="Industry average"
              icon={<DollarIcon />}
              iconBg="bg-warning-light"
            />
            <ProblemCard
              stat="50-100+"
              label="clients per coordinator"
              detail="Care coordinators managing large panels cannot feasibly call everyone weekly."
              source="CMS staffing data"
              icon={<OverloadIcon />}
              iconBg="bg-secondary-light"
            />
          </div>
        </div>
      </section>

      {/* Built on Peer-Reviewed Research */}
      <section className="py-20 sm:py-28 bg-card border-y border-border relative overflow-hidden bg-noise">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/3 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Clinical Foundation</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Built on Peer-Reviewed Research
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
              Every screening in ClaudeCare maps to a validated, published instrument.
              No proprietary scoring. No black boxes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-in">
            <InstrumentCard
              name="CLOVA CareCall"
              measure="AI phone-based elderly wellness monitoring"
              citation="Kim et al., Samsung Research & Seoul National University"
              journal="Nature Medicine (2024)"
              url="https://www.nature.com/articles/s41591-024-03035-1"
              reason="Foundational study proving AI phone calls can effectively monitor elderly health. Inspiration for ClaudeCare's entire approach."
              color="border-l-primary"
            />
            <InstrumentCard
              name="PHQ-2"
              measure="Depression screening (2-item)"
              citation="Kroenke, Spitzer & Williams (2003)"
              journal="Medical Care"
              url="https://pubmed.ncbi.nlm.nih.gov/14636820/"
              reason="83% sensitivity, 92% specificity for major depression. Score >= 3 triggers C-SSRS follow-up."
              color="border-l-secondary"
            />
            <InstrumentCard
              name="C-SSRS"
              measure="Suicide severity rating"
              citation="Posner et al. (2011)"
              journal="American Journal of Psychiatry"
              url="https://pubmed.ncbi.nlm.nih.gov/22193671/"
              reason="FDA-endorsed gold standard for suicide risk. Highest priority in our scoring cascade."
              color="border-l-danger"
            />
            <InstrumentCard
              name="Ottawa 3DY"
              measure="Cognitive orientation (3-item)"
              citation="Bhatt & Bherer (2019)"
              journal="Canadian Geriatrics Journal"
              url="https://pubmed.ncbi.nlm.nih.gov/30648622/"
              reason="Quick 3-item screen: day, date, year. Woven naturally into conversation without feeling like a test."
              color="border-l-accent"
            />
            <InstrumentCard
              name="Tele-Free-Cog"
              measure="Telephone cognitive assessment"
              citation="Lipton et al. (2003)"
              journal="Neurology"
              url="https://pubmed.ncbi.nlm.nih.gov/14638556/"
              reason="Validated specifically for remote, telephone-administered dementia screening."
              color="border-l-primary"
            />
            <InstrumentCard
              name="STEADI"
              measure="Fall risk screening"
              citation="CDC Evidence-Based Initiative"
              journal="CDC / MMWR"
              url="https://www.cdc.gov/steadi/"
              reason="Evidence-based fall risk assessment. Falls are the leading cause of injury death in 65+."
              color="border-l-secondary"
            />
            <InstrumentCard
              name="UCLA-3"
              measure="Loneliness (3-item)"
              citation="Hughes et al. (2004)"
              journal="Research on Aging"
              url="https://pubmed.ncbi.nlm.nih.gov/14984264/"
              reason="Validated short-form loneliness measure. Loneliness is equivalent to smoking 15 cigarettes/day in mortality risk."
              color="border-l-accent"
            />
            <InstrumentCard
              name="Lawton IADL"
              measure="Instrumental activities of daily living"
              citation="Lawton & Brody (1969)"
              journal="The Gerontologist"
              url="https://pubmed.ncbi.nlm.nih.gov/5349366/"
              reason="Measures functional independence: cooking, shopping, medications, finances. Decline signals need for increased support."
              color="border-l-primary"
            />
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 rounded-xl border border-primary/20 bg-primary-light/50 px-6 py-4">
              <svg className="w-5 h-5 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p className="text-sm font-medium text-primary">
                All instruments are free, validated, and in the public domain. No licensing fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How the AI Works */}
      <section id="how-it-works" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary-light/20 to-background" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Technical Architecture</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              How the AI Works
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
              Purpose-built dual-model architecture optimized for both conversational warmth and clinical accuracy.
            </p>
          </div>

          {/* Dual-model architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
            <div className="rounded-xl border border-border bg-card p-7 shadow-warm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                  <LightningIcon />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">Haiku 4.5</h3>
                  <p className="text-xs text-muted-foreground">Real-time Conversation</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sub-second response latency powers the real-time voice conversation via Twilio ConversationRelay.
                Natural, warm dialogue that feels like talking to a caring friend, not a robot.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                &lt; 1s response latency
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-7 shadow-warm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                  <ShieldCheckIcon />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">Opus 4.6</h3>
                  <p className="text-xs text-muted-foreground">Clinical Assessment & Scoring</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Maximum-accuracy model scores all clinical instruments post-call via structured tool_use.
                Ensures reliable, consistent assessment output for clinical decision-making.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Highest accuracy for clinical scoring
              </div>
            </div>
          </div>

          {/* 6-Phase Call Protocol */}
          <div className="mb-12">
            <h3 className="font-display text-xl font-semibold text-foreground text-center mb-8">
              6-Phase Call Protocol
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 stagger-in">
              <PhaseCard phase="1" name="Opening" time="30-60s" color="bg-primary" description="Warm greeting, establish rapport" />
              <PhaseCard phase="2" name="CLOVA-5" time="90-120s" color="bg-primary" description="Meals, sleep, health, social, mobility" />
              <PhaseCard phase="3" name="PHQ-2" time="30-60s" color="bg-secondary" description="Depression screening questions" />
              <PhaseCard phase="4" name="C-SSRS" time="If needed" color="bg-danger" description="Triggered by PHQ-2 score >= 3" />
              <PhaseCard phase="5" name="Needs" time="60-90s" color="bg-accent" description="Unmet needs & requests for help" />
              <PhaseCard phase="6" name="Ottawa 3DY" time="30s" color="bg-primary" description="Day, date, year orientation" />
            </div>
          </div>

          {/* Architecture features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ArchitectureCard
              icon={<MemoryIcon />}
              title="Cross-Call Memory"
              description="Previous summaries, assessment scores, and coordinator notes are injected into every call. The AI remembers what matters."
            />
            <ArchitectureCard
              icon={<CascadeIcon />}
              title="Scoring Pipeline"
              description="Rule-based cascade: C-SSRS (highest priority) then PHQ-2 then Ottawa 3DY then CLOVA-5 metrics. No ambiguity in risk ranking."
            />
            <ArchitectureCard
              icon={<EscalationTierIcon />}
              title="Three-Tier Escalation"
              description="Immediate (same-day) for acute risk. Urgent (24-48h) for elevated concern. Routine (next visit) for monitoring. Automated email alerts at every tier."
            />
          </div>
        </div>
      </section>

      {/* Platform Features — What the Dashboard Does */}
      <section className="py-20 sm:py-28 bg-card border-y border-border relative overflow-hidden">
        <div className="absolute top-20 left-0 w-[400px] h-[400px] rounded-full bg-secondary/3 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3">The Platform</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Everything care teams need, <span className="text-gradient">in one dashboard.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
              From uploading your first client to resolving an escalation — every workflow is designed
              for care coordinators who don't have time to learn new software.
            </p>
          </div>

          {/* Big feature cards — 2 col */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 stagger-reveal">
            <div className="rounded-xl border border-border bg-background p-8 transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-0.5 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 transition-colors group-hover:bg-primary group-hover:text-white">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">Try It From the Dashboard</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Enter any US/Canada phone number and receive a live wellness check-in call within seconds.
                Experience the full 6-phase protocol, hear the AI adapt to your responses, and see the
                structured assessment appear in your dashboard when the call ends.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-light text-primary">Live Demo</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-light text-primary">Standard or Comprehensive</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-light text-primary">Real-time Status</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-8 transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-0.5 group">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-5 transition-colors group-hover:bg-secondary group-hover:text-white">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">Word-Level Call Transcription</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Every call is recorded and transcribed with word-level timestamps via Twilio Intelligence.
                Speaker diarization separates the AI caller from the person. AI-generated clinical summaries
                distill each call into 2-3 actionable sentences.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary-light text-secondary">Audio Playback</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary-light text-secondary">Speaker Diarization</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary-light text-secondary">AI Summaries</span>
              </div>
            </div>
          </div>

          {/* Smaller feature cards — 3 col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-reveal">
            <FeatureCard
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>}
              title="CSV Bulk Upload"
              description="Upload your entire client roster in one click. CSV parsing with preview, validation, and automatic agent name assignment."
            />
            <FeatureCard
              icon={<TrendUpIcon />}
              title="Analytics & Trends"
              description="Recharts-powered dashboards: call volume over time, flag distribution, average CLOVA-5 scores, per-person trend lines."
            />
            <FeatureCard
              icon={<AlertTiersIcon />}
              title="Escalation Management"
              description="Filter by tier and status. One-click acknowledge and resolve. Automated email alerts for immediate and urgent tiers."
            />
            <FeatureCard
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>}
              title="Personalized AI Callers"
              description="Each person gets a consistent AI name (Sarah, Eleanor, Dorothy...) that stays the same across calls, building familiarity and trust."
            />
            <FeatureCard
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3" /><path d="M15 2h6v6" /><path d="M21 2l-7 7" /></svg>}
              title="Inbound Call Recognition"
              description="When enrolled persons call in, the system recognizes them by phone number. Due for a check-in? Full protocol runs. Just lonely? Casual companionship mode."
            />
            <FeatureCard
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
              title="Smart Retry & Voicemail"
              description="Answering machine detection leaves a friendly voicemail requesting callback. Up to 2 retries with 15-min intervals. 3+ consecutive misses trigger escalation."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 relative overflow-hidden bg-noise">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/40 via-background to-secondary-light/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/4 blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
            Ready to modernize your <span className="text-primary">wellness monitoring</span>?
          </h2>
          <p className="text-muted-foreground mt-4 text-lg max-w-lg mx-auto leading-relaxed">
            Create an account, upload your client roster, and start receiving
            clinical-grade wellness insights this week.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="text-base">
                Get Started
                <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" size="lg" className="text-base">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                Try a Demo Call
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logogram.svg" alt="" className="w-7 h-7" />
            <img src="/logotype.svg" alt="Claude Care" className="h-4" />
          </Link>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/yungalgo/claudecare"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="View on GitHub"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <p className="text-sm text-muted-foreground">Made for the Claude Code Hackathon</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---- Hero call mockup ----

// Each line can optionally extract a score that appears as a badge
interface MockLine {
  speaker: "agent" | "caller";
  text: string;
  score?: { label: string; value: string; color: string };
  phase?: number; // advance to this phase when this line appears
}

const MOCK_CONVERSATION: MockLine[] = [
  { speaker: "agent", text: "Hi Margaret, this is Sarah from ClaudeCare. How are you doing today?", phase: 0 },
  { speaker: "caller", text: "Oh hi Sarah! I'm doing alright, a little tired today." },
  { speaker: "agent", text: "Have you been sleeping okay this week?", phase: 1 },
  { speaker: "caller", text: "Not great, my hip has been bothering me at night.", score: { label: "Sleep", value: "2/5", color: "bg-warning text-warning-foreground" } },
  { speaker: "agent", text: "I'm sorry to hear that. Have you been able to eat regular meals?" },
  { speaker: "caller", text: "Yes, my daughter brought over some soup yesterday.", score: { label: "Meals", value: "4/5", color: "bg-success-light text-success" } },
  { speaker: "agent", text: "That's wonderful. Have you been able to get out or talk to anyone this week?" },
  { speaker: "caller", text: "Just my daughter on Sunday. It's been quiet otherwise.", score: { label: "Social", value: "2/5", color: "bg-warning text-warning-foreground" } },
  { speaker: "agent", text: "I'd like to ask two quick questions about how you've been feeling lately.", phase: 2 },
  { speaker: "caller", text: "Sure, go ahead." },
  { speaker: "agent", text: "Over the last two weeks, have you had little interest or pleasure in doing things?" },
  { speaker: "caller", text: "Maybe several days, I just haven't felt like doing much.", score: { label: "PHQ-2", value: "Q1: 1", color: "bg-primary-light text-primary" } },
];

function LiveCallMockup() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [activePhase, setActivePhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start fast (800ms for first few), then settle to 2s
    let lineIndex = 0;
    let timeout: ReturnType<typeof setTimeout>;

    function showNext() {
      lineIndex++;
      if (lineIndex > MOCK_CONVERSATION.length) {
        // Pause then reset
        timeout = setTimeout(() => {
          setVisibleLines(0);
          setActivePhase(0);
          lineIndex = 0;
          timeout = setTimeout(showNext, 600);
        }, 3000);
        return;
      }
      setVisibleLines(lineIndex);
      const line = MOCK_CONVERSATION[lineIndex - 1];
      if (line?.phase !== undefined) setActivePhase(line.phase);
      const delay = lineIndex <= 2 ? 1200 : 2000;
      timeout = setTimeout(showNext, delay);
    }

    timeout = setTimeout(showNext, 800);
    return () => clearTimeout(timeout);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  const phases = ["Opening", "CLOVA-5", "PHQ-2", "Ottawa 3DY", "Needs", "Close"];

  // Collect visible scores for the assessment panel
  const visibleScores = MOCK_CONVERSATION.slice(0, visibleLines)
    .filter((l) => l.score)
    .map((l) => l.score!);

  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 rounded-3xl blur-2xl" />

      <div className="relative rounded-2xl border border-border bg-card shadow-warm-lg overflow-hidden">
        {/* Call header with person avatar */}
        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center text-white font-display font-semibold text-sm">
                  MW
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-card" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Margaret Wilson</p>
                <p className="text-xs text-muted-foreground">Standard wellness check-in</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              <CallTimer />
            </div>
          </div>
        </div>

        {/* Phase progress */}
        <div className="px-5 py-2.5 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-1.5">
            {phases.map((p, i) => (
              <div key={p} className={`h-1.5 rounded-full transition-all duration-500 ${i <= activePhase ? "bg-primary w-8" : "bg-border w-4"}`} />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium">Phase {activePhase + 1}: {phases[activePhase]}</p>
        </div>

        {/* Main area: conversation + live scores */}
        <div className="flex">
          {/* Conversation */}
          <div ref={containerRef} className="flex-1 px-4 py-3 h-[280px] overflow-hidden space-y-2.5">
            {MOCK_CONVERSATION.slice(0, visibleLines).map((line, i) => (
              <div key={i} className={`flex ${line.speaker === "agent" ? "justify-start" : "justify-end"} animate-in`}>
                <div className={`max-w-[90%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                  line.speaker === "agent"
                    ? "bg-primary/8 text-foreground rounded-bl-md"
                    : "bg-muted text-foreground rounded-br-md"
                }`}>
                  {line.text}
                </div>
              </div>
            ))}
            {visibleLines > 0 && visibleLines < MOCK_CONVERSATION.length && (
              <div className="flex justify-start">
                <div className="bg-primary/8 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live assessment panel */}
          <div className="w-[140px] border-l border-border/60 bg-muted/20 px-3 py-3 flex flex-col">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Live Scores</p>
            <div className="space-y-1.5 flex-1">
              {visibleScores.map((s, i) => (
                <div key={i} className="animate-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className={`rounded-lg px-2.5 py-1.5 ${s.color} text-[11px] font-medium`}>
                    <span className="opacity-70">{s.label}</span>
                    <span className="float-right font-semibold">{s.value}</span>
                  </div>
                </div>
              ))}
              {visibleScores.length === 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-border animate-pulse" />
                  Listening...
                </div>
              )}
            </div>
            {visibleScores.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-[10px] font-medium text-success">Flag: Green</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Waveform */}
        <div className="px-5 py-2.5 border-t border-border/60 bg-muted/20">
          <AudioWaveform />
        </div>
      </div>
    </div>
  );
}

function CallTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <span className="text-xs font-mono text-muted-foreground tabular-nums">
      {m}:{String(s).padStart(2, "0")}
    </span>
  );
}

function AudioWaveform() {
  return (
    <div className="flex items-center gap-[3px] h-5 justify-center">
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-primary/30"
          style={{
            height: `${Math.random() * 14 + 3}px`,
            animation: "waveform 1.2s ease-in-out infinite",
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
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

function ProblemCard({
  stat,
  label,
  detail,
  source,
  icon,
  iconBg,
}: {
  stat: string;
  label: string;
  detail: string;
  source: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-7 transition-all duration-200 hover:shadow-warm-lg hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="inline-block font-display text-3xl font-bold text-foreground">{stat}</span>
          <span className="ml-1.5 text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
      <p className="mt-3 text-xs text-muted-foreground/70 italic">Source: {source}</p>
    </div>
  );
}

function InstrumentCard({
  name,
  measure,
  citation,
  journal,
  url,
  reason,
  color,
}: {
  name: string;
  measure: string;
  citation: string;
  journal: string;
  url: string;
  reason: string;
  color: string;
}) {
  return (
    <div className={`group rounded-xl border border-border border-l-4 ${color} bg-background p-6 transition-all duration-200 hover:shadow-warm-lg hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-display font-semibold text-foreground text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground">{measure}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary-light hover:text-primary transition-colors"
          title="View publication"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mt-3">{reason}</p>
      <p className="mt-3 text-xs text-muted-foreground/70">
        {citation}. <span className="italic">{journal}</span>
      </p>
    </div>
  );
}

function PhaseCard({
  phase,
  name,
  time,
  color,
  description,
}: {
  phase: string;
  name: string;
  time: string;
  color: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center transition-all duration-200 hover:shadow-warm">
      <div className={`w-8 h-8 rounded-full ${color} text-white text-xs font-bold flex items-center justify-center mx-auto mb-3`}>
        {phase}
      </div>
      <h4 className="font-display font-semibold text-foreground text-sm">{name}</h4>
      <p className="text-xs text-primary font-medium mt-1">{time}</p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{description}</p>
    </div>
  );
}

function ArchitectureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-7 transition-all duration-200 hover:shadow-warm-lg hover:-translate-y-0.5">
      <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
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

function PersonAloneIcon() {
  return (
    <svg className="w-5 h-5 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BrainAlertIcon() {
  return (
    <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 014 4v1a3 3 0 013 3v1a3 3 0 01-1.5 2.6M12 2a4 4 0 00-4 4v1a3 3 0 00-3 3v1a3 3 0 001.5 2.6M12 2v20M8.5 16.5a3 3 0 003.5 3 3 3 0 003.5-3" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function OverloadIcon() {
  return (
    <svg className="w-5 h-5 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

function CascadeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function EscalationTierIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function HeartPulseIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      <polyline points="3 12 6 12 8 10 11 14 13 12 16 12" />
    </svg>
  );
}

function ShieldAlertIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function BrainCogIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 014 4v1a3 3 0 013 3v1a3 3 0 01-1.5 2.6M12 2a4 4 0 00-4 4v1a3 3 0 00-3 3v1a3 3 0 001.5 2.6M12 2v20M8.5 16.5a3 3 0 003.5 3 3 3 0 003.5-3" />
    </svg>
  );
}

function AlertTiersIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TranscriptDocIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
