"use client";

import { useState } from "react";
import { Music2, MapPin } from "lucide-react";
import type { DJProfile, User } from "@/lib/api";

interface DJCardProps {
  dj: DJProfile;
  user?: User;
  onClick?: () => void;
  index?: number;
}

const GRADIENT_AVATARS = [
  "from-violet-900 via-purple-800 to-fuchsia-900",
  "from-indigo-900 via-violet-800 to-purple-900",
  "from-purple-900 via-fuchsia-800 to-pink-900",
  "from-slate-900 via-purple-900 to-violet-900",
];

export default function DJCard({ dj, user, onClick, index = 0 }: DJCardProps) {
  const avatarUrl = user?.avatar_url ?? (dj as any).avatar_url;
  const city = user?.city ?? (dj as any).city;
  const state = user?.state ?? (dj as any).state;
  const [hovered, setHovered] = useState(false);
  const gradient = GRADIENT_AVATARS[index % GRADIENT_AVATARS.length];

  const genres = dj.genres
    ? dj.genres.split(",").map((g) => g.trim()).slice(0, 2)
    : [];

  return (
    <div
      className="dj-card relative cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow ring fora do overflow-hidden */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
        style={{
          opacity: hovered ? 1 : 0,
          boxShadow: "0 0 0 1.5px rgba(168,85,247,0.7), 0 0 30px rgba(124,58,237,0.4)",
        }}
      />

      {/* Card com overflow-hidden garantido */}
      <div
        className="relative rounded-2xl"
        style={{
          overflow: "hidden",
          background: "var(--bg-card)",
          border: "1px solid rgba(124,58,237,0.15)",
        }}
      >
        <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>

          {/* Imagem ou gradiente */}
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={dj.stage_name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                transform: hovered ? "scale(1.07)" : "scale(1)",
                transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
                display: "block",
              }}
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
              style={{
                transform: hovered ? "scale(1.07)" : "scale(1)",
                transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 72, height: 72,
                  background: "rgba(168,85,247,0.2)",
                  border: "2px solid rgba(168,85,247,0.4)",
                }}
              >
                <Music2 size={28} style={{ color: "var(--purple-neon)" }} />
              </div>
            </div>
          )}

          {/* Gradiente permanente */}
          <div
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(to top, rgba(7,7,15,1) 0%, rgba(7,7,15,0.5) 36%, transparent 62%)",
            }}
          />

          {/* Overlay roxo hover */}
          <div
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(160deg, rgba(124,58,237,0.2) 0%, transparent 55%)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.3s",
            }}
          />

          {/* Gêneros */}
          {genres.length > 0 && (
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {genres.map((g) => (
                <span
                  key={g}
                  style={{
                    fontSize: 11, fontWeight: 500, padding: "2px 8px",
                    borderRadius: 999,
                    background: "rgba(124,58,237,0.55)",
                    border: "1px solid rgba(168,85,247,0.45)",
                    color: "#e9d5ff",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Nome e cidade — tudo dentro do overflow hidden */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 14px 14px" }}>
            <p
              style={{
                margin: 0,
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: "0.07em",
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textShadow: hovered ? "0 0 16px rgba(168,85,247,0.9)" : "0 1px 6px rgba(0,0,0,0.9)",
                transition: "text-shadow 0.3s",
              }}
            >
              {dj.stage_name.toUpperCase()}
            </p>

            {city && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <MapPin size={10} color="rgba(255,255,255,0.45)" />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {city}{state ? `, ${state}` : ""}
                </span>
              </div>
            )}

            <div
              style={{
                overflow: "hidden",
                maxHeight: hovered ? "22px" : "0px",
                opacity: hovered ? 1 : 0,
                marginTop: hovered ? 6 : 0,
                transition: "max-height 0.3s, opacity 0.3s, margin-top 0.3s",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--purple-neon)" }}>
                Ver perfil →
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
