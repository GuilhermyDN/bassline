"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music2, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user.user_type === "DJ") router.push("/dashboard/dj");
      else if (data.user.user_type === "CLUB") router.push("/dashboard/club");
      else router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-6">
            <div className="rounded-lg p-2 transition-all duration-300 group-hover:scale-110"
              style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)", boxShadow: "0 0 20px rgba(124,58,237,0.5)" }}>
              <Music2 size={20} color="#fff" />
            </div>
            <span className="font-black text-xl tracking-widest"
              style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "0.15em" }}>
              BASSLINE
            </span>
          </Link>
          <h1 className="font-bold text-2xl mb-1" style={{ color: "var(--text-primary)" }}>
            Bem-vindo de volta
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Entre na sua conta para continuar
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{ background: "var(--bg-card)", border: "1px solid rgba(124,58,237,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2"
                style={{ color: "var(--text-muted)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(124,58,237,0.25)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2"
                style={{ color: "var(--text-muted)" }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(124,58,237,0.25)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                letterSpacing: "0.1em",
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          Não tem conta?{" "}
          <Link href="/auth/register"
            className="font-semibold transition-colors"
            style={{ color: "var(--purple-neon)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--purple-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--purple-neon)")}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
