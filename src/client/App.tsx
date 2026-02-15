import { Routes, Route, NavLink } from "react-router";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Person } from "./pages/Person.tsx";
import { Calls } from "./pages/Calls.tsx";
import { Escalations } from "./pages/Escalations.tsx";
import { Upload } from "./pages/Upload.tsx";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
              <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="currentColor" />
                <path d="M16 6C10.5 6 6 10.5 6 16s4.5 10 10 10 10-4.5 10-10S21.5 6 16 6zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="white" opacity="0.9" />
                <path d="M16 10v6l4 4" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
                <circle cx="16" cy="16" r="1.5" fill="white" />
              </svg>
              claudecare
            </NavLink>
            <div className="flex items-center gap-1">
              <NavItem to="/">Dashboard</NavItem>
              <NavItem to="/calls">Calls</NavItem>
              <NavItem to="/escalations">Escalations</NavItem>
              <NavItem to="/upload">Upload</NavItem>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/persons/:id" element={<Person />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/escalations" element={<Escalations />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </Layout>
  );
}
