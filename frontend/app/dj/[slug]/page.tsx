"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Music2, MapPin, Instagram, Youtube, Radio,
  ArrowLeft, ExternalLink, Calendar, Share2, Check
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { listDJs, getStoredUser, type DJProfile } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DJPublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [dj, setDj] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const user = getStoredUser();
  const isClub = user?.user_type === "CLUB";

  useEffect(() => {
    listDJs()
      .then((djs) => {
        const match = djs.find((d) => slugify(d.stage_name) === slug);
        if (match) setDj(match);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleShare() {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const genres: string[] = dj?.genres
    ? (Array.isArray(dj.genres) ? dj.genres : dj.genres.split(",").map((g) => g.trim()).filter(Boolean))
    : [];

  const avatarUrl = (dj as any)?.avatar_url;
  const city = (dj as any)?.city;
  const state = (dj as any)?.state;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070f" }}>
      <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6" style={{ background: "#07070f" }}>
      <Music2 size={48} color="#a855f7" style={{ opacity: 0.4 }} />
      <h1 className="font-black text-2xl" style={{ color: "#f0f0f8" }}>DJ não encontrado</h1>
      <p style={{ color: "#5a5a78" }}>O perfil "{slug}" não existe ou foi removido.</p>
      <Link href="/djs" className="px-6 py-3 rounded-xl font-semibold text-sm"
        style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff" }}>
        Ver todos os DJs
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#07070f", color: "#f0f0f8" }}>
      <Navbar />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.12s; }
        .d3 { animation-delay: 0.2s; }
      `}</style>

      {/* ── Hero ── */}
      <div className="relative" style={{ height: 420, marginTop: 64 }}>
        {/* Background image or gradient */}
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={dj!.stage_name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg,#1a0533,#0d0720,#07070f)" }} />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,7,15,0.3) 0%, rgba(7,7,15,0.7) 60%, #07070f 100%)" }} />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-5 left-5 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(168,85,247,0.3)", color: "#f0f0f8", backdropFilter: "blur(8px)" }}
        >
          <ArrowLeft size={15} /> Voltar
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="absolute top-5 right-5 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(168,85,247,0.3)", color: "#f0f0f8", backdropFilter: "blur(8px)" }}
        >
          {copied ? <><Check size={15} color="#22c55e" /> Copiado!</> : <><Share2 size={15} /> Compartilhar</>}
        </button>

        {/* Name + genres overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 max-w-4xl mx-auto">
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {genres.map((g) => (
                <span key={g} className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: "rgba(124,58,237,0.4)", border: "1px solid rgba(168,85,247,0.5)", color: "#d8b4fe" }}>
                  {g}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-black leading-none"
            style={{ fontSize: "clamp(38px,7vw,72px)", letterSpacing: "0.06em", color: "#fff", textShadow: "0 0 40px rgba(168,85,247,0.4)" }}>
            {dj!.stage_name.toUpperCase()}
          </h1>
          {city && (
            <div className="flex items-center gap-1.5 mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>
              <MapPin size={14} />
              <span className="text-sm">{city}{state ? `, ${state}` : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-3 gap-8 mt-10">

          {/* Left: bio + social */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Bio */}
            {dj!.bio && (
              <div className="fade-up d1">
                <h2 className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "#a855f7" }}>Sobre</h2>
                <p className="text-base leading-relaxed" style={{ color: "#a0a0bc" }}>{dj!.bio}</p>
              </div>
            )}

            {/* Genres */}
            {genres.length > 0 && (
              <div className="fade-up d2">
                <h2 className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "#a855f7" }}>Gêneros</h2>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => (
                    <span key={g} className="px-4 py-2 rounded-full text-sm font-medium"
                      style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#c084fc" }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social links */}
            {(dj!.instagram_url || dj!.soundcloud_url || dj!.youtube_url) && (
              <div className="fade-up d3">
                <h2 className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "#a855f7" }}>Links</h2>
                <div className="flex flex-col gap-3">
                  {dj!.instagram_url && (
                    <a href={dj!.instagram_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
                      style={{ background: "rgba(14,14,26,0.9)", border: "1px solid rgba(124,58,237,0.2)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)")}>
                      <Instagram size={18} color="#a855f7" />
                      <span className="text-sm font-medium flex-1" style={{ color: "#a0a0bc" }}>Instagram</span>
                      <ExternalLink size={14} style={{ color: "#5a5a78" }} />
                    </a>
                  )}
                  {dj!.soundcloud_url && (
                    <a href={dj!.soundcloud_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                      style={{ background: "rgba(14,14,26,0.9)", border: "1px solid rgba(124,58,237,0.2)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)")}>
                      <Radio size={18} color="#a855f7" />
                      <span className="text-sm font-medium flex-1" style={{ color: "#a0a0bc" }}>SoundCloud</span>
                      <ExternalLink size={14} style={{ color: "#5a5a78" }} />
                    </a>
                  )}
                  {dj!.youtube_url && (
                    <a href={dj!.youtube_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                      style={{ background: "rgba(14,14,26,0.9)", border: "1px solid rgba(124,58,237,0.2)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)")}>
                      <Youtube size={18} color="#a855f7" />
                      <span className="text-sm font-medium flex-1" style={{ color: "#a0a0bc" }}>YouTube</span>
                      <ExternalLink size={14} style={{ color: "#5a5a78" }} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: CTA card */}
          <div className="fade-up d2">
            <div className="rounded-2xl p-6 sticky top-24"
              style={{ background: "rgba(14,14,26,0.95)", border: "1px solid rgba(168,85,247,0.25)", boxShadow: "0 0 40px rgba(124,58,237,0.08)" }}>

              {/* Avatar small */}
              <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: "1px solid rgba(168,85,247,0.12)" }}>
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)" }}>
                  {avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover object-top" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#f0f0f8" }}>{dj!.stage_name}</p>
                  {city && <p className="text-xs mt-0.5" style={{ color: "#5a5a78" }}>{city}{state ? `, ${state}` : ""}</p>}
                </div>
              </div>

              {isClub ? (
                <>
                  <p className="text-sm font-semibold mb-2" style={{ color: "#f0f0f8" }}>Contratar este DJ</p>
                  <p className="text-xs mb-5" style={{ color: "#5a5a78" }}>Envie uma proposta de booking diretamente pelo dashboard.</p>
                  <button
                    onClick={() => router.push("/dashboard/club")}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}
                  >
                    <Calendar size={16} /> Enviar proposta
                  </button>
                </>
              ) : user ? (
                <>
                  <p className="text-sm" style={{ color: "#a0a0bc" }}>Faça login como <strong style={{ color: "#f0f0f8" }}>Club</strong> para enviar uma proposta para este DJ.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold mb-2" style={{ color: "#f0f0f8" }}>Contratar este DJ</p>
                  <p className="text-xs mb-5" style={{ color: "#5a5a78" }}>Crie uma conta gratuita de Club para enviar propostas de booking.</p>
                  <Link href="/auth/register"
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>
                    Criar conta e contratar
                  </Link>
                  <Link href="/auth/login"
                    className="w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center mt-3"
                    style={{ border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7" }}>
                    Já tenho conta
                  </Link>
                </>
              )}

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 mt-4"
                style={{ border: "1px solid rgba(124,58,237,0.2)", color: "#5a5a78" }}
              >
                {copied ? <><Check size={14} color="#22c55e" /> Link copiado!</> : <><Share2 size={14} /> Compartilhar perfil</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
