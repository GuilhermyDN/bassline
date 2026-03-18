"use client";

import { useState, useEffect } from "react";
import {
  X, Instagram, Music, Youtube, FileText, MapPin, Calendar,
  ExternalLink, Send, ChevronRight
} from "lucide-react";
import type { DJProfile, User } from "@/lib/api";

interface DJProfilePanelProps {
  dj: DJProfile | null;
  user?: User;
  onClose: () => void;
  isClub?: boolean;
  onRequestBooking?: (dj: DJProfile) => void;
}

export default function DJProfilePanel({
  dj,
  user,
  onClose,
  isClub,
  onRequestBooking,
}: DJProfilePanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dj) {
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [dj]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  if (!dj) return null;

  const genres = dj.genres
    ? dj.genres.split(",").map((g) => g.trim())
    : [];

  const socialLinks = [
    { icon: Instagram, label: "Instagram", url: dj.instagram_url, color: "#e1306c" },
    { icon: Music, label: "SoundCloud", url: dj.soundcloud_url, color: "#ff5500" },
    { icon: Youtube, label: "YouTube", url: dj.youtube_url, color: "#ff0000" },
  ].filter((s) => s.url);

  const riders = [
    { label: "Press Kit", url: dj.presskit_pdf_url },
    { label: "Tech Rider", url: dj.tech_rider_pdf_url },
    { label: "Hospitality Rider", url: dj.hospitality_rider_pdf_url },
  ].filter((r) => r.url);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-350"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto"
        style={{
          width: "min(520px, 100vw)",
          background: "linear-gradient(160deg, #0d0b1e 0%, #07070f 60%)",
          borderLeft: "1px solid rgba(124, 58, 237, 0.25)",
          boxShadow: "-20px 0 80px rgba(0,0,0,0.7)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header / Hero */}
        <div className="relative">
          {/* Photo */}
          <div className="relative" style={{ height: 340 }}>
            {(user?.avatar_url ?? (dj as any).avatar_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user?.avatar_url ?? (dj as any).avatar_url}
                alt={dj.stage_name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div
                className="w-full h-full bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-900"
              />
            )}
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, #0d0b1e 0%, rgba(13,11,30,0.6) 50%, rgba(0,0,0,0.3) 100%)",
              }}
            />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 rounded-full p-2 transition-all duration-200 hover:scale-110"
              style={{
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(168,85,247,0.3)",
                color: "#f8f8ff",
              }}
            >
              <X size={18} />
            </button>

            {/* Name overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{
                      background: "rgba(124, 58, 237, 0.4)",
                      border: "1px solid rgba(168, 85, 247, 0.5)",
                      color: "#d8b4fe",
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
              <h2
                className="font-black text-4xl tracking-wider"
                style={{
                  color: "#fff",
                  letterSpacing: "0.08em",
                  textShadow: "0 0 30px rgba(168,85,247,0.5)",
                }}
              >
                {dj.stage_name.toUpperCase()}
              </h2>
              {(user?.city ?? (dj as any).city) && (
                <div
                  className="flex items-center gap-1 mt-1"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  <MapPin size={12} />
                  <span className="text-sm">
                    {user?.city ?? (dj as any).city}
                    {(user?.state ?? (dj as any).state) ? `, ${user?.state ?? (dj as any).state}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bio */}
          {dj.bio && (
            <div>
              <h4
                className="text-xs font-bold tracking-widest uppercase mb-3"
                style={{ color: "var(--purple-neon)" }}
              >
                Bio
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {dj.bio}
              </p>
            </div>
          )}

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div>
              <h4
                className="text-xs font-bold tracking-widest uppercase mb-3"
                style={{ color: "var(--purple-neon)" }}
              >
                Links
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {socialLinks.map(({ icon: Icon, label, url, color }) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(124,58,237,0.15)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(168,85,247,0.4)";
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(124,58,237,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(124,58,237,0.15)";
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.03)";
                    }}
                  >
                    <Icon size={18} style={{ color }} />
                    <span
                      className="text-sm font-medium flex-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {label}
                    </span>
                    <ExternalLink
                      size={14}
                      className="opacity-40 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--purple-neon)" }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Riders / Files */}
          {riders.length > 0 && (
            <div>
              <h4
                className="text-xs font-bold tracking-widest uppercase mb-3"
                style={{ color: "var(--purple-neon)" }}
              >
                Materiais
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {riders.map(({ label, url }) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(124,58,237,0.15)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <FileText size={16} style={{ color: "var(--purple-neon)" }} />
                    <span className="text-sm font-medium flex-1">{label}</span>
                    <ExternalLink size={14} style={{ color: "var(--text-muted)" }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Availability note */}
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: "rgba(124, 58, 237, 0.08)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
            }}
          >
            <Calendar size={18} style={{ color: "var(--purple-neon)" }} />
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Consulte a disponibilidade antes de enviar uma proposta.
            </p>
          </div>

          {/* CTA Booking */}
          {isClub && onRequestBooking && (
            <button
              onClick={() => onRequestBooking(dj)}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                letterSpacing: "0.1em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 40px rgba(124,58,237,0.7)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 20px rgba(124,58,237,0.4)";
              }}
            >
              <Send size={16} />
              Enviar Proposta
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
