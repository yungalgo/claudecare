import { Routes, Route, NavLink, Navigate, useLocation } from "react-router";
import { RequireAuth } from "./components/RequireAuth.tsx";
import { RedirectIfAuth } from "./components/RedirectIfAuth.tsx";
import { PlayerProvider } from "./components/AudioPlayer.tsx";
import { signOut } from "./lib/auth.ts";
import { Landing } from "./pages/Landing.tsx";
import { Login } from "./pages/Login.tsx";
import { Signup } from "./pages/Signup.tsx";
import { ForgotPassword } from "./pages/ForgotPassword.tsx";
import { ResetPassword } from "./pages/ResetPassword.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Person } from "./pages/Person.tsx";
import { Calls } from "./pages/Calls.tsx";
import { Escalations } from "./pages/Escalations.tsx";
import { Upload } from "./pages/Upload.tsx";
import { Analytics } from "./pages/Analytics.tsx";

function Logo({ size = "default" }: { size?: "default" | "sm" }) {
  const s = size === "sm" ? "w-7 h-7" : "w-8 h-8";
  return (
    <NavLink to="/dashboard" className="inline-flex items-center gap-2.5 group">
      <div className={`${s} rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105`}>
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <path d="M12 4v8l4 4" />
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
        </svg>
      </div>
      <span className="font-display font-semibold text-foreground text-lg tracking-tight">
        claude<span className="text-primary">care</span>
      </span>
    </NavLink>
  );
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/calls", label: "Calls", icon: CallsIcon },
  { to: "/escalations", label: "Escalations", icon: EscalationsIcon },
  { to: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { to: "/upload", label: "Upload", icon: UploadIcon },
];

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-primary-light text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
              <div className="w-px h-6 bg-border mx-2" />
              <button
                onClick={() => signOut().then(() => { window.location.href = "/login"; })}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 cursor-pointer"
              >
                <LogoutIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main key={location.pathname} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in">
        {children}
      </main>
    </div>
  );
}

export function App() {
  return (
    <PlayerProvider>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RedirectIfAuth><Landing /></RedirectIfAuth>} />
      <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
      <Route path="/signup" element={<RedirectIfAuth><Signup /></RedirectIfAuth>} />
      <Route path="/forgot-password" element={<RedirectIfAuth><ForgotPassword /></RedirectIfAuth>} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>} />
      <Route path="/persons/:id" element={<RequireAuth><AppLayout><Person /></AppLayout></RequireAuth>} />
      <Route path="/calls" element={<RequireAuth><AppLayout><Calls /></AppLayout></RequireAuth>} />
      <Route path="/escalations" element={<RequireAuth><AppLayout><Escalations /></AppLayout></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth><AppLayout><Analytics /></AppLayout></RequireAuth>} />
      <Route path="/upload" element={<RequireAuth><AppLayout><Upload /></AppLayout></RequireAuth>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </PlayerProvider>
  );
}

// ---- Nav Icons (inline SVG for crisp rendering) ----

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function CallsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function EscalationsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
