"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music2, LogOut, LayoutDashboard, LogIn, Zap } from "lucide-react";
import TrialBanner from "@/components/TrialBanner";
import { getStoredUser, logout } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/");
  };

  const dashboardPath =
    user?.user_type === "DJ"
      ? "/dashboard/dj"
      : user?.user_type === "CLUB"
      ? "/dashboard/club"
      : "/";

  return (
    <>
    <nav
      className="fixed top-0 left-0 right-0 z-30 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(7, 7, 15, 0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(124, 58, 237, 0.15)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="rounded-lg p-1.5 transition-all duration-300 group-hover:scale-110"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #9333ea)",
              boxShadow: "0 0 12px rgba(124,58,237,0.5)",
            }}
          >
            <Music2 size={16} color="#fff" />
          </div>
          <span
            className="font-black text-lg tracking-widest"
            style={{
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.15em",
            }}
          >
            BASSLINE
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-3">
          <Link
            href="/djs"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            DJs
          </Link>

          <Link
            href="/pricing"
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            <Zap size={13} />
            Planos
          </Link>

          {user ? (
            <>
              <Link
                href={dashboardPath}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  color: "var(--purple-neon)",
                  border: "1px solid rgba(168,85,247,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(124,58,237,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#ef4444")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")
                }
              >
                <LogOut size={15} />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center gap-2 text-sm font-bold px-5 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                  color: "#fff",
                  boxShadow: "0 0 15px rgba(124,58,237,0.35)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 25px rgba(124,58,237,0.6)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 15px rgba(124,58,237,0.35)";
                }}
              >
                <LogIn size={15} />
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
    {user && <TrialBanner />}
    </>
  );
}
