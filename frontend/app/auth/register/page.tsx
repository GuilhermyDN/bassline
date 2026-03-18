"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music2, Eye, EyeOff, ArrowRight, Loader2, Disc3, Building2, Users } from "lucide-react";
import { register } from "@/lib/api";

type UserType = "DJ" | "CLUB" | "FAN";

const USER_TYPE_OPTIONS: { type: UserType; icon: React.ElementType; label: string; desc: string }[] = [
  { type: "DJ", icon: Disc3, label: "Sou DJ", desc: "Crie seu perfil e receba propostas" },
  { type: "CLUB", icon: Building2, label: "Sou Club / Evento", desc: "Encontre e contrate DJs" },
  { type: "FAN", icon: Users, label: "Sou Fã", desc: "Acompanhe DJs e eventos" },
];

const inp: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(124,58,237,0.25)",
  color: "var(--text-primary)",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest uppercase mb-2"
        style={{ color: "var(--text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userType, setUserType] = useState<UserType | "">("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [stateBR, setStateBR] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [stageName, setStageName] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState("");

  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return;
    setError("");
    setLoading(true);
    try {
      const data = await register({
        name, email, password,
        user_type: userType,
        city: city || undefined,
        state: stateBR || undefined,
        stage_name: userType === "DJ" ? stageName || undefined : undefined,
        bio: userType === "DJ" ? bio || undefined : undefined,
        genres: userType === "DJ" ? genres || undefined : undefined,
        club_name: userType === "CLUB" ? clubName || undefined : undefined,
        description: userType === "CLUB" ? description || undefined : undefined,
      });
      if (data.user.user_type === "DJ") router.push("/dashboard/dj");
      else if (data.user.user_type === "CLUB") router.push("/dashboard/club");
      else router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
      setLoading(false);
    }
  };

  const step2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === "FAN") { doRegister(e); return; }
    setStep(3);
  };

  const totalSteps = userType === "FAN" ? 2 : 3;

  const btnStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #7c3aed, #9333ea)",
    color: "#fff",
    letterSpacing: "0.1em",
  };

  const backBtn = (to: 1 | 2) => (
    <button type="button" onClick={() => setStep(to)}
      className="text-xs mb-3 flex items-center gap-1 transition-colors"
      style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
      ← Voltar
    </button>
  );

  const submitBtn = (label: string) => (
    <button type="submit" disabled={loading}
      className="w-full py-3.5 rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
      style={btnStyle}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : <>{label} <ArrowRight size={16} /></>}
    </button>
  );

  const errorBox = error && (
    <div className="px-4 py-3 rounded-xl text-sm"
      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
      {error}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "var(--bg-primary)" }}>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="rounded-lg p-2" style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)", boxShadow: "0 0 20px rgba(124,58,237,0.5)" }}>
              <Music2 size={20} color="#fff" />
            </div>
            <span className="font-black text-xl" style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "0.15em" }}>
              BASSLINE
            </span>
          </Link>
          <h1 className="font-bold text-2xl mb-3" style={{ color: "var(--text-primary)" }}>Criar conta</h1>
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="h-1 w-10 rounded-full transition-all duration-300"
                style={{ background: step > i ? "var(--purple-neon)" : "rgba(124,58,237,0.2)" }} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: "var(--bg-card)", border: "1px solid rgba(124,58,237,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>

          {step === 1 && (
            <div>
              <p className="text-sm font-semibold mb-4 text-center" style={{ color: "var(--text-secondary)" }}>
                Como você vai usar o BASSLINE?
              </p>
              <div className="space-y-3">
                {USER_TYPE_OPTIONS.map(({ type, icon: Icon, label, desc }) => (
                  <button key={type} onClick={() => setUserType(type)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: userType === type ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                      border: userType === type ? "1px solid rgba(168,85,247,0.6)" : "1px solid rgba(124,58,237,0.15)",
                    }}>
                    <div className="rounded-lg p-2" style={{ background: userType === type ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.1)" }}>
                      <Icon size={18} style={{ color: "var(--purple-neon)" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
                    </div>
                    {userType === type && (
                      <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--purple-bright)" }}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={() => userType && setStep(2)} disabled={!userType}
                className="w-full mt-6 py-3.5 rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-40"
                style={btnStyle}>
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={step2Submit} className="space-y-4">
              {backBtn(1)}
              <Field label="Nome">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" required className="w-full px-4 py-3 rounded-xl text-sm" style={inp} />
              </Field>
              <Field label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="w-full px-4 py-3 rounded-xl text-sm" style={inp} />
              </Field>
              <Field label="Senha">
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 py-3 pr-12 rounded-xl text-sm" style={inp} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade">
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" className="w-full px-4 py-3 rounded-xl text-sm" style={inp} />
                </Field>
                <Field label="UF">
                  <input type="text" value={stateBR} onChange={(e) => setStateBR(e.target.value)} placeholder="SP" maxLength={2} className="w-full px-4 py-3 rounded-xl text-sm" style={inp} />
                </Field>
              </div>
              {errorBox}
              {submitBtn(userType === "FAN" ? "Criar conta" : "Continuar")}
            </form>
          )}

          {step === 3 && userType === "DJ" && (
            <form onSubmit={doRegister} className="space-y-4">
              {backBtn(2)}
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Seu perfil de DJ</p>
              <Field label="Nome artístico *">
                <input type="text" value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="DJ Kairos" required className="w-full px-4 py-3 rounded-xl text-sm" style={inp} />
              </Field>
              <Field label="Gêneros">
                <input type="text" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="House, Techno, Drum & Bass" className="w-full px-4 py-3 rounded-xl text-sm" style={inp} />
              </Field>
              <Field label="Bio">
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte um pouco sobre você e seu estilo..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none" style={inp} />
              </Field>
              {errorBox}
              {submitBtn("Criar conta")}
            </form>
          )}

          {step === 3 && userType === "CLUB" && (
            <form onSubmit={doRegister} className="space-y-4">
              {backBtn(2)}
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Seu perfil de club</p>
              <Field label="Nome do club / evento *">
                <input type="text" value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Club Noir, Festival Aurora..." required className="w-full px-4 py-3 rounded-xl text-sm" style={inp} />
              </Field>
              <Field label="Descrição">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte sobre o seu espaço ou evento..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none" style={inp} />
              </Field>
              {errorBox}
              {submitBtn("Criar conta")}
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          Já tem conta?{" "}
          <Link href="/auth/login" className="font-semibold" style={{ color: "var(--purple-neon)" }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
