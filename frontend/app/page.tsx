"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, ArrowRight, Music2, Calendar, MessageSquare, Star,
  Check, Shield, Clock, Users, BarChart3, Sparkles,
  Instagram, Youtube, Radio, ChevronDown, ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { getStoredUser } from "@/lib/api";

// ─── Static data ──────────────────────────────────────────────────────────────

const DJ_FEATURES = [
  { icon: <Music2 size={18} />, title: "EPK digital completo", desc: "Foto profissional, bio, gêneros, links sociais e riders num só lugar." },
  { icon: <Calendar size={18} />, title: "Agenda sem conflito", desc: "Bloqueie períodos e o sistema recusa automaticamente propostas sobrepostas." },
  { icon: <MessageSquare size={18} />, title: "Chat por proposta", desc: "Negocie diretamente com o club — tudo registrado e rastreável." },
  { icon: <Shield size={18} />, title: "Histórico de status", desc: "Cada mudança de proposta fica registrada com motivo e timestamp." },
  { icon: <Radio size={18} />, title: "Perfil público linkável", desc: "Compartilhe seu perfil nas redes. Clubs chegam até você." },
  { icon: <BarChart3 size={18} />, title: "Dashboard de propostas", desc: "Visualize tudo: em aberto, aprovadas, recusadas, em negociação." },
];

const CLUB_FEATURES = [
  { icon: <Users size={18} />, title: "Busca de DJs por gênero", desc: "Filtre por estilo musical e encontre o artista certo para cada noite." },
  { icon: <Zap size={18} />, title: "Proposta em segundos", desc: "Informe data, local, cachê e envie — direto para o DJ." },
  { icon: <MessageSquare size={18} />, title: "Negociação integrada", desc: "Converse, ajuste valores e condições sem sair da plataforma." },
  { icon: <Calendar size={18} />, title: "Agenda verificada", desc: "Só veja DJs disponíveis para a sua data. Sem resposta negativa por conflito." },
  { icon: <Clock size={18} />, title: "Histórico completo", desc: "Todas as suas contratações, em andamento e passadas, organizadas." },
  { icon: <Sparkles size={18} />, title: "Perfil do club", desc: "Apresente o seu espaço para os DJs antes de negociar." },
];

const HOW_IT_WORKS = [
  { step: "01", icon: <Music2 size={22} />, title: "Crie seu perfil", desc: "DJ monta EPK completo. Club cria perfil do espaço. 5 minutos, sem burocracia." },
  { step: "02", icon: <MessageSquare size={22} />, title: "Conecte e negocie", desc: "Club encontra o DJ ideal, envia proposta com data e cachê. DJ responde no app." },
  { step: "03", icon: <Calendar size={22} />, title: "Confirme e siga", desc: "Proposta aprovada bloqueia a agenda automaticamente. O show está marcado." },
];

const PLANS = [
  {
    name: "DJ Pro",
    price: "R$ 29",
    period: "/mês",
    badge: null,
    desc: "Para DJs que levam a carreira a sério.",
    features: ["Perfil público linkável", "Agenda com bloqueio de conflito", "Chat ilimitado por proposta", "Histórico completo de status", "Upload de foto profissional", "Links para redes sociais"],
    cta: "Começar grátis por 14 dias",
    highlight: false,
  },
  {
    name: "Club Pro",
    price: "R$ 49",
    period: "/mês",
    badge: "Mais popular",
    desc: "Para clubs que querem agendar os melhores DJs.",
    features: ["Busca ilimitada de DJs", "Propostas ilimitadas", "Chat integrado por booking", "Agenda verificada em tempo real", "Histórico de contratações", "Perfil do club visível para DJs"],
    cta: "Começar grátis por 14 dias",
    highlight: true,
  },
];

const TESTIMONIALS = [
  { name: "DJ Kairos", role: "Residente — Club Noize, SP", text: "Antes eu perdia gig por esquecimento de agenda. Agora tudo fica registrado e bloqueado automaticamente.", rating: 5 },
  { name: "Lia Motta", role: "Produtora — Amnesia Events, SP", text: "Mandei 12 propostas em um dia. A resposta dos DJs veio rápido e o chat é direto ao ponto. Economizei horas.", rating: 5 },
  { name: "DJ Wren", role: "DJ independente, RJ", text: "Meu EPK digital, minha agenda e minhas negociações num só lugar. Clientes chegam pela minha página pública.", rating: 5 },
];

const FAQS = [
  { q: "O trial de 14 dias é grátis mesmo?", a: "Sim. Você cadastra e já tem acesso completo a todas as features do plano Pro por 14 dias, sem precisar colocar cartão de crédito. Só cobramos se você decidir continuar." },
  { q: "Preciso de algum conhecimento técnico?", a: "Não. O BASSLINE foi feito para ser simples: você cria seu perfil em minutos e começa a usar imediatamente." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem fidelidade e sem multa. Você cancela pelo próprio painel e o acesso fica ativo até o fim do período pago." },
  { q: "E se o DJ não usar a plataforma?", a: "Você pode compartilhar o link do seu perfil público com qualquer club, mesmo que eles não tenham conta. O club se cadastra na hora para enviar a proposta." },
  { q: "Tem versão gratuita?", a: "Existe o plano gratuito básico que permite criar perfil e receber propostas. Para acesso completo (agenda, chat, histórico, perfil público), use o Pro." },
  { q: "Funciona para eventos fora do Brasil?", a: "Por ora o produto foca no mercado brasileiro, mas não há restrição técnica para uso em outros países." },
];

const GENRES = ["House", "Techno", "Drum & Bass", "Trance", "Afrobeat", "Funk", "Hip-Hop", "Dubstep", "Eletrônico", "Reggaeton", "R&B", "Pop"];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{ background: "rgba(14,14,26,0.8)", border: `1px solid ${open ? "rgba(168,85,247,0.35)" : "rgba(124,58,237,0.15)"}` }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-semibold text-base" style={{ color: "var(--text-primary,#f0f0f8)" }}>{q}</span>
        <span className="flex-shrink-0 transition-transform duration-300" style={{ color: "#a855f7", transform: open ? "rotate(180deg)" : "rotate(0)" }}>
          <ChevronDown size={18} />
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary,#a0a0bc)" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => { setUser(getStoredUser()); }, []);

  function handleCTA() {
    if (!user) { router.push("/auth/register"); return; }
    if (user.user_type === "DJ") { router.push("/dashboard/dj"); return; }
    if (user.user_type === "CLUB") { router.push("/dashboard/club"); return; }
    router.push("/djs");
  }

  return (
    <div className="min-h-screen" style={{ background: "#07070f", color: "#f0f0f8" }}>
      <Navbar />

      <style>{`
        :root {
          --bg-primary: #07070f;
          --bg-card: #0e0e1a;
          --text-primary: #f0f0f8;
          --text-secondary: #a0a0bc;
          --text-muted: #5a5a78;
          --purple-neon: #a855f7;
          --purple-dark: #7c3aed;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .d1 { animation-delay: 0.08s; }
        .d2 { animation-delay: 0.18s; }
        .d3 { animation-delay: 0.28s; }
        .d4 { animation-delay: 0.38s; }

        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 28s linear infinite;
        }
        .marquee-track:hover { animation-play-state: paused; }

        .feature-card {
          background: rgba(14,14,26,0.9);
          border: 1px solid rgba(124,58,237,0.18);
          border-radius: 18px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.25s, transform 0.25s;
        }
        .feature-card:hover {
          border-color: rgba(168,85,247,0.4);
          transform: translateY(-3px);
        }

        .plan-card {
          background: rgba(14,14,26,0.9);
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 24px;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: border-color 0.3s, transform 0.3s;
          position: relative;
        }
        .plan-card.highlight {
          border-color: rgba(168,85,247,0.5);
          box-shadow: 0 0 60px rgba(124,58,237,0.15), inset 0 0 60px rgba(124,58,237,0.03);
        }
        .plan-card:hover { transform: translateY(-4px); }

        .how-card {
          background: rgba(14,14,26,0.9);
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 20px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.25s, transform 0.25s;
        }
        .how-card:hover { border-color: rgba(168,85,247,0.45); transform: translateY(-4px); }

        .t-card {
          background: rgba(14,14,26,0.8);
          border: 1px solid rgba(124,58,237,0.15);
          border-radius: 20px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.25s;
        }
        .t-card:hover { border-color: rgba(168,85,247,0.35); }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 30px; border-radius: 14px;
          font-size: 15px; font-weight: 700;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          color: white; border: none; cursor: pointer;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 20px rgba(124,58,237,0.4);
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 0 32px rgba(124,58,237,0.6); }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 30px; border-radius: 14px;
          font-size: 15px; font-weight: 600;
          background: rgba(168,85,247,0.08);
          border: 1px solid rgba(168,85,247,0.3);
          color: #a855f7; cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .btn-ghost:hover { background: rgba(168,85,247,0.16); transform: translateY(-2px); }

        .section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: #a855f7; margin-bottom: 12px;
        }
        .section-title {
          font-size: clamp(28px,4vw,40px); font-weight: 900;
          letter-spacing: -0.025em; color: #f0f0f8;
        }
        .section-sub {
          font-size: 16px; color: #a0a0bc; line-height: 1.7; margin-top: 12px;
        }

        .check-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 14px; color: #a0a0bc;
        }
        .check-item svg { flex-shrink: 0; color: #a855f7; }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(168,85,247,0.2), transparent);
          margin: 0 auto;
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-28 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.14) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div className="absolute top-40 right-1/3 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(192,38,211,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <Zap size={12} color="#a855f7" />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#a855f7" }}>14 dias grátis · sem cartão</span>
          </div>

          <h1 className="fade-up d1 font-black leading-none mb-6"
            style={{ fontSize: "clamp(46px,8vw,90px)", letterSpacing: "-0.03em" }}>
            <span style={{ color: "#f0f0f8" }}>A plataforma que</span><br />
            <span style={{ background: "linear-gradient(135deg,#a855f7 0%,#7c3aed 50%,#c026d3 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              conecta o set
            </span><br />
            <span style={{ color: "#f0f0f8" }}>ao stage.</span>
          </h1>

          <p className="fade-up d2 text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#a0a0bc" }}>
            DJs gerenciam EPK e agenda. Clubs enviam propostas e negociam.
            <br />Sem WhatsApp, sem planilha, sem enrolação.
          </p>

          <div className="fade-up d3 flex flex-wrap items-center justify-center gap-4 mb-14">
            <button className="btn-primary" onClick={handleCTA}>
              {user ? "Ir para o dashboard" : "Criar conta grátis"}
              <ArrowRight size={18} />
            </button>
            <button className="btn-ghost" onClick={() => router.push("/djs")}>
              Ver DJs <ChevronRight size={16} />
            </button>
          </div>

          {/* Stats */}
          <div className="fade-up d4 flex flex-wrap justify-center gap-12">
            {[
              { n: "30", l: "dias grátis" },
              { n: "100%", l: "sem conflito de agenda" },
              { n: "2 min", l: "para criar seu perfil" },
            ].map(({ n, l }) => (
              <div key={l} className="text-center">
                <p className="font-black text-4xl leading-none"
                  style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</p>
                <p className="text-sm mt-1.5" style={{ color: "#5a5a78" }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GENRES MARQUEE ────────────────────────────────────────────────────── */}
      <div className="py-8 overflow-hidden" style={{ borderTop: "1px solid rgba(124,58,237,0.12)", borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
        <div className="marquee-track">
          {[...GENRES, ...GENRES].map((g, i) => (
            <span key={i} className="flex-shrink-0 mx-3 px-5 py-2 rounded-full text-sm font-medium"
              style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "#a855f7" }}>
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES DJ ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label">Para DJs</p>
              <h2 className="section-title">Sua carreira, organizada.</h2>
              <p className="section-sub">Tudo que você precisa para gerenciar propostas, agenda e imagem profissional — em um só lugar.</p>
              <div className="mt-10 flex flex-col gap-3">
                {DJ_FEATURES.map((f) => (
                  <div key={f.title} className="feature-card flex-row items-start gap-4" style={{ flexDirection: "row" }}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7" }}>
                      {f.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#f0f0f8" }}>{f.title}</p>
                      <p className="text-sm mt-1" style={{ color: "#a0a0bc" }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <button className="btn-primary" onClick={() => router.push("/auth/register")}>
                  Criar perfil de DJ <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Visual mockup */}
            <div className="hidden lg:block relative">
              <div className="rounded-3xl p-6 relative" style={{ background: "rgba(14,14,26,0.95)", border: "1px solid rgba(168,85,247,0.25)", boxShadow: "0 0 80px rgba(124,58,237,0.12)" }}>
                <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid rgba(168,85,247,0.15)" }}>
                  <div className="w-10 h-10 rounded-full" style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)" }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#f0f0f8" }}>DJ Kairos</p>
                    <p className="text-xs" style={{ color: "#5a5a78" }}>House · Techno · SP</p>
                  </div>
                  <span className="ml-auto text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>Disponível</span>
                </div>
                {[
                  { club: "Club Noize", date: "28 Mar", fee: "R$ 1.800", status: "Aprovado", sc: "#22c55e", sb: "rgba(34,197,94,0.12)" },
                  { club: "Amnesia Events", date: "05 Abr", fee: "R$ 2.200", status: "Negociando", sc: "#f59e0b", sb: "rgba(245,158,11,0.12)" },
                  { club: "Club Void", date: "12 Abr", fee: "R$ 1.500", status: "Proposta", sc: "#a855f7", sb: "rgba(168,85,247,0.12)" },
                ].map((b) => (
                  <div key={b.club} className="flex items-center justify-between py-3.5 px-4 rounded-xl mb-2"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.1)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#f0f0f8" }}>{b.club}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#5a5a78" }}>{b.date} · {b.fee}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: b.sc, background: b.sb }}>{b.status}</span>
                  </div>
                ))}
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: "1px solid rgba(168,85,247,0.12)" }}>
                  <div className="text-center flex-1">
                    <p className="font-black text-2xl" style={{ color: "#a855f7" }}>12</p>
                    <p className="text-xs mt-1" style={{ color: "#5a5a78" }}>Propostas</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-black text-2xl" style={{ color: "#22c55e" }}>8</p>
                    <p className="text-xs mt-1" style={{ color: "#5a5a78" }}>Aprovadas</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-black text-2xl" style={{ color: "#f59e0b" }}>2</p>
                    <p className="text-xs mt-1" style={{ color: "#5a5a78" }}>Em aberto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" style={{ maxWidth: 900, width: "90%" }} />

      {/* ── FEATURES CLUB ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Visual mockup */}
            <div className="hidden lg:block relative order-last lg:order-first">
              <div className="rounded-3xl p-6" style={{ background: "rgba(14,14,26,0.95)", border: "1px solid rgba(168,85,247,0.25)", boxShadow: "0 0 80px rgba(124,58,237,0.12)" }}>
                <p className="font-bold text-sm mb-4" style={{ color: "#a855f7" }}>Buscar DJs para 05/04</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "DJ Wren", genre: "Techno", city: "RJ", avail: true },
                    { name: "DJ Kairos", genre: "House", city: "SP", avail: true },
                    { name: "DJ Sol", genre: "Afrobeat", city: "SP", avail: false },
                    { name: "DJ Nox", genre: "D&B", city: "BH", avail: true },
                  ].map((dj) => (
                    <div key={dj.name} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.15)" }}>
                      <div className="w-10 h-10 rounded-xl mb-3" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)" }} />
                      <p className="font-bold text-sm" style={{ color: "#f0f0f8" }}>{dj.name}</p>
                      <p className="text-xs" style={{ color: "#5a5a78" }}>{dj.genre} · {dj.city}</p>
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: dj.avail ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: dj.avail ? "#22c55e" : "#ef4444" }}>
                        {dj.avail ? "Disponível" : "Ocupado"}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full py-3 rounded-xl font-semibold text-sm"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff" }}>
                  Enviar proposta para DJ Kairos →
                </button>
              </div>
            </div>

            <div>
              <p className="section-label">Para Clubs</p>
              <h2 className="section-title">O DJ certo, na hora certa.</h2>
              <p className="section-sub">Encontre, negocie e confirme o artista para a sua noite — sem e-mail, sem intermediário.</p>
              <div className="mt-10 flex flex-col gap-3">
                {CLUB_FEATURES.map((f) => (
                  <div key={f.title} className="feature-card" style={{ flexDirection: "row", display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7" }}>
                      {f.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#f0f0f8" }}>{f.title}</p>
                      <p className="text-sm mt-1" style={{ color: "#a0a0bc" }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <button className="btn-primary" onClick={() => router.push("/auth/register")}>
                  Criar conta do club <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: "rgba(124,58,237,0.03)", borderTop: "1px solid rgba(124,58,237,0.1)", borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label">Como funciona</p>
            <h2 className="section-title">Do perfil ao show em 3 passos.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="how-card">
                <div className="flex items-center justify-between">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7" }}>
                    {item.icon}
                  </div>
                  <span className="font-black text-4xl" style={{ color: "rgba(168,85,247,0.18)", letterSpacing: "-0.04em" }}>{item.step}</span>
                </div>
                <h3 className="font-bold text-lg" style={{ color: "#f0f0f8" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#a0a0bc" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label">Preços</p>
            <h2 className="section-title">14 dias grátis. Sem cartão.</h2>
            <p className="section-sub max-w-xl mx-auto">Experimente tudo por 14 dias sem precisar informar cartão. Só cobramos se você ficar — e ficará.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`plan-card ${plan.highlight ? "highlight" : ""}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-4 py-1.5 rounded-full"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff" }}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-black text-xl" style={{ color: "#f0f0f8" }}>{plan.name}</p>
                  <p className="text-sm mt-1" style={{ color: "#a0a0bc" }}>{plan.desc}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-black" style={{ fontSize: 42, letterSpacing: "-0.03em", color: "#f0f0f8" }}>{plan.price}</span>
                  <span style={{ color: "#5a5a78" }}>{plan.period}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <div key={f} className="check-item">
                      <Check size={15} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="btn-primary justify-center"
                  style={plan.highlight ? {} : { background: "rgba(168,85,247,0.12)", boxShadow: "none", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7" }}
                  onClick={() => router.push("/auth/register")}
                >
                  {plan.cta} <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-8" style={{ color: "#5a5a78" }}>
            Sem fidelidade. Cancele quando quiser. <Link href="/pricing" style={{ color: "#a855f7" }}>Ver detalhes →</Link>
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: "rgba(124,58,237,0.03)", borderTop: "1px solid rgba(124,58,237,0.1)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label">Depoimentos</p>
            <h2 className="section-title">Quem usa, recomenda.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="t-card">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} size={14} fill="#a855f7" color="#a855f7" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#a0a0bc" }}>"{t.text}"</p>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#f0f0f8" }}>{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#5a5a78" }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label">FAQ</p>
            <h2 className="section-title">Perguntas frequentes.</h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden" style={{ borderTop: "1px solid rgba(124,58,237,0.1)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="font-black mb-6 leading-tight" style={{ fontSize: "clamp(32px,5vw,52px)", letterSpacing: "-0.03em", color: "#f0f0f8" }}>
            Seu próximo gig começa<br />
            <span style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              aqui.
            </span>
          </h2>
          <p className="text-base mb-10 leading-relaxed" style={{ color: "#a0a0bc" }}>
            Crie sua conta agora. 14 dias grátis, sem cartão, sem compromisso.<br />
            Cancele quando quiser.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="btn-primary text-base px-8 py-4" onClick={handleCTA}>
              {user ? "Ir para o dashboard" : "Começar grátis agora"}
              <ArrowRight size={18} />
            </button>
            <button className="btn-ghost text-base px-8 py-4" onClick={() => router.push("/djs")}>
              Explorar DJs
            </button>
          </div>
          <p className="text-xs mt-6" style={{ color: "#5a5a78" }}>
            Ao se cadastrar você concorda com os nossos Termos de Uso e Política de Privacidade.
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6" style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-1.5" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)" }}>
              <Music2 size={14} color="#fff" />
            </div>
            <span className="font-black tracking-widest text-base"
              style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              BASSLINE
            </span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm" style={{ color: "#5a5a78" }}>
            <Link href="/djs" style={{ color: "#5a5a78" }} className="hover:text-white transition-colors">DJs</Link>
            <Link href="/pricing" style={{ color: "#5a5a78" }} className="hover:text-white transition-colors">Planos</Link>
            <Link href="/auth/register" style={{ color: "#5a5a78" }} className="hover:text-white transition-colors">Cadastrar</Link>
            <Link href="/auth/login" style={{ color: "#5a5a78" }} className="hover:text-white transition-colors">Entrar</Link>
          </div>
          <p className="text-xs" style={{ color: "#3a3a55" }}>© 2026 BASSLINE. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
