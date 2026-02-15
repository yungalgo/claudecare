import { Navigate } from "react-router";
import { useSession } from "../lib/auth.ts";
import { Spinner } from "./ui.tsx";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <Spinner className="min-h-screen" />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
