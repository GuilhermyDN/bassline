"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Zap, Building2, Disc3, ArrowRight, Loader2, X, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getStoredUser, getMySubscription, createCheckoutSession, trialDaysLeft, isSubscriptionActive } from "@/lib/api";
import type { Subscription } from "@/lib/api";

const DJ_FREE = [
  "Perfil público com foto e bio",
  "Aparecer na busca de clubs",
  "Receber propostas de qualquer club",
  "Chat básico por proposta",
];

const DJ_FEATURES = [
  "Tudo do plano Grátis",
  "Remoção automática de fundo nas fotos",
  "Gestão ilimitada de agenda e bloqueios",
  "Links para SoundCloud, YouTube, Instagram",
  "Destaque na busca (badge PRO)",
  "Histórico completo de negociações",
  "Upload de Press Kit e Riders (em breve)",
  "Analytics do perfil: views e propostas (em breve)",
];

const CLUB_FREE = [
  "Buscar e visualizar perfis de DJs",
  "Enviar até 3 propostas por mês",
  "Chat básico por proposta",
];

const CLUB_FEATURES = [
  "Tudo do plano Grátis",
  "Propostas ilimitadas para qualquer DJ",
  "Filtros avançados: gênero, cidade, disponibilidade",
  "Chat desbloqueado após aprovação",
  "Histórico completo de status por booking",
  "Gestão de múltiplos eventos simultâneos",
  "Perfil público do club",
  "Analytics de bookings (em breve)",
  "Integração Google Calendar (em breve)",
];

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--bg-primary)" }}><Navbar /></div>}>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled");
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPlan, setFetchingPlan] = useState(true);
  const user = typeof window !== "undefined" ? getStoredUser() : null;

  useEffect(() => {
    if (!user) { setFetchingPlan(false); return; }
    getMySubscription()
      .then(setSub)
      .catch(() => {})
      .finally(() => setFetchingPlan(false));
  }, []);

  const handleCheckout = async () => {
    if (!user) { router.push("/auth/register"); return; }
    setLoading(true);
    try {
      const { checkout_url } = await createCheckoutSession();
      window.location.href = checkout_url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao iniciar checkout");
      setLoading(false);
    }
  };

  const days = trialDaysLeft(sub);
  const active = isSubscriptionActive(sub);
  const isTrialing = sub?.status === "TRIALING";
  const isPro = sub?.status === "ACTIVE";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">

        {/* Canceled alert */}
        {canceled && (
          <div className="mb-8 px-5 py-4 rounded-2xl flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <X size={16} style={{ color: "#ef4444" }} />
            <p className="text-sm" style={{ color: "#fca5a5" }}>
              Checkout cancelado. Sem problemas — seu trial continua ativo.
            </p>
          </div>
        )}

        {/* Trial banner */}
        {isTrialing && days > 0 && (
          <div className="mb-8 px-5 py-4 rounded-2xl flex items-center justify-between"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div className="flex items-center gap-3">
              <Zap size={16} style={{ color: "var(--purple-neon)" }} />
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                Você tem <strong style={{ color: "var(--purple-neon)" }}>{days} dias</strong> de trial grátis restantes.
              </p>
            </div>
            <button onClick={handleCheckout}
              className="text-xs font-bold px-4 py-2 rounded-lg transition-all"
              style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff" }}>
              Assinar agora
            </button>
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <Zap size={12} style={{ color: "var(--purple-neon)" }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--purple-neon)" }}>
              14 dias grátis, sem cartão
            </span>
          </div>
          <h1 className="font-black text-4xl md:text-6xl mb-4" style={{ letterSpacing: "-0.02em" }}>
            <span style={{ color: "var(--text-primary)" }}>Um preço.</span>
            <br />
            <span style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed,#c026d3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Tudo incluso.
            </span>
          </h1>
          <p className="text-lg max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
            Comece grátis por 14 dias. Cancele quando quiser.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { type: "DJ", icon: Disc3, price: "R$ 29", label: "DJ Pro", freeFeatures: DJ_FREE, features: DJ_FEATURES, color: "#a855f7", freeLimit: "3 agenda blocks · sem destaque na busca" },
            { type: "CLUB", icon: Building2, price: "R$ 49", label: "Club Pro", freeFeatures: CLUB_FREE, features: CLUB_FEATURES, color: "#c026d3", freeLimit: "máx. 3 propostas/mês · sem filtros avançados" },
          ].map(({ type, icon: Icon, price, label, freeFeatures, features, color, freeLimit }) => {
            const isMyType = user?.user_type === type;
            const highlight = isMyType;

            return (
              <div key={type}
                className="rounded-2xl flex flex-col relative overflow-hidden"
                style={{
                  background: highlight ? "rgba(124,58,237,0.06)" : "var(--bg-card)",
                  border: highlight ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(124,58,237,0.15)",
                  boxShadow: highlight ? "0 0 40px rgba(124,58,237,0.12)" : "none",
                }}>

                {/* Free tier */}
                <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="rounded-lg p-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <Icon size={16} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <p className="font-bold text-sm" style={{ color: "var(--text-muted)" }}>
                      {type === "DJ" ? "DJ Grátis" : "Club Grátis"}
                    </p>
                    <span className="ml-auto font-black text-sm" style={{ color: "var(--text-muted)" }}>R$ 0</span>
                  </div>
                  <ul className="space-y-2 mb-3">
                    {freeFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)", opacity: 0.6 }} />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs flex items-center gap-1.5" style={{ color: "rgba(239,68,68,0.7)" }}>
                    <Lock size={10} /> {freeLimit}
                  </p>
                </div>

                {/* Pro tier */}
                <div className="px-7 pt-5 pb-7 flex flex-col flex-1">
                  {isMyType && (
                    <div className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff" }}>
                      Seu plano
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-5">
                    <div className="rounded-xl p-2" style={{ background: `${color}22` }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div>
                      <p className="font-black text-lg" style={{ color: "var(--text-primary)" }}>{label}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>acesso completo</p>
                    </div>
                    <div className="ml-auto text-right">
                      <span className="font-black text-3xl" style={{ color: "var(--text-primary)" }}>{price}</span>
                      <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-7">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={13} className="mt-0.5 flex-shrink-0" style={{ color }} />
                        <span className="text-sm" style={{ color: f.includes("em breve") ? "var(--text-muted)" : "var(--text-secondary)" }}>
                          {f}
                          {f.includes("em breve") && (
                            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.1)", color: "var(--purple-neon)" }}>em breve</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isPro && isMyType ? (
                    <div className="w-full py-3.5 rounded-xl text-sm font-bold text-center"
                      style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
                      ✓ Plano ativo
                    </div>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      disabled={loading || (isPro && !isMyType)}
                      className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                      style={{
                        background: isMyType ? `linear-gradient(135deg,${color},#7c3aed)` : "rgba(255,255,255,0.05)",
                        color: isMyType ? "#fff" : "var(--text-secondary)",
                        border: isMyType ? "none" : "1px solid rgba(124,58,237,0.2)",
                        boxShadow: isMyType ? `0 0 20px ${color}44` : "none",
                      }}>
                      {loading && isMyType ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          {isTrialing && isMyType ? "Continuar após trial" : "14 dias grátis · sem cartão"}
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ rápido */}
        <div className="mt-16 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Dúvidas? <Link href="/" className="font-semibold" style={{ color: "var(--purple-neon)" }}>Fale conosco</Link>
            {" · "}
            <span>Cancele a qualquer momento</span>
            {" · "}
            <span>Sem taxa de cancelamento</span>
          </p>
        </div>
      </div>
    </div>
  );
}
