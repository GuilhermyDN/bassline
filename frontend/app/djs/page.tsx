"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, SlidersHorizontal, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import DJCard from "@/components/DJCard";
import DJProfilePanel from "@/components/DJProfilePanel";
import { listDJs, getStoredUser } from "@/lib/api";
import type { DJProfile } from "@/lib/api";

const GENRE_FILTERS = ["Todos", "House", "Techno", "Drum & Bass", "Trance", "Funk", "Hip-Hop", "Afrobeat", "Dubstep"];

export default function DJsPage() {
    const [djs, setDjs] = useState<DJProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [genreFilter, setGenreFilter] = useState("Todos");
    const [selectedDJ, setSelectedDJ] = useState<DJProfile | null>(null);
    const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

    useEffect(() => {
        setUser(getStoredUser());
        listDJs()
            .then((data) => {
                console.log("DJs recebidos:", data);
                setDjs(data);
            })
            .catch((err) => console.error("Erro:", err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = djs.filter((dj) => {
        const matchSearch =
            dj.stage_name.toLowerCase().includes(search.toLowerCase()) ||
            (dj.genres || "").toLowerCase().includes(search.toLowerCase()) ||
            (dj.bio || "").toLowerCase().includes(search.toLowerCase());

        const matchGenre =
            genreFilter === "Todos" ||
            (dj.genres || "").toLowerCase().includes(genreFilter.toLowerCase());

        return matchSearch && matchGenre;
    });

    const handleClose = useCallback(() => setSelectedDJ(null), []);

    return (
        <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <Navbar />

            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }

        .genre-pill {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(124,58,237,0.2);
          color: var(--text-muted, #5a5a78);
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .genre-pill:hover {
          border-color: rgba(168,85,247,0.4);
          color: var(--text-secondary, #a0a0bc);
        }
        .genre-pill.active {
          background: rgba(168,85,247,0.15);
          border-color: rgba(168,85,247,0.5);
          color: var(--purple-neon, #a855f7);
        }
      `}</style>

            {/* ── Page header ── */}
            <section className="relative pt-32 pb-10 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none"
                    style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />

                <div className="relative max-w-7xl mx-auto">
                    <div className="fade-up flex items-center gap-2 mb-4">
                        <Zap size={14} style={{ color: "var(--purple-neon, #a855f7)" }} />
                        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--purple-neon, #a855f7)" }}>
                            Descoberta
                        </span>
                    </div>

                    <h1 className="fade-up font-black text-4xl md:text-5xl mb-3" style={{ letterSpacing: "-0.02em", animationDelay: "0.05s" }}>
                        Encontre seu DJ
                    </h1>
                    <p className="fade-up text-base mb-8" style={{ color: "var(--text-secondary, #a0a0bc)", animationDelay: "0.1s" }}>
                        Explore perfis, ouça mixes e envie propostas diretamente.
                    </p>

                    {/* Search + filtros */}
                    <div className="fade-up flex flex-col gap-4" style={{ animationDelay: "0.15s" }}>
                        {/* Search bar */}
                        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl max-w-xl"
                            style={{ background: "rgba(14,14,26,0.95)", border: "1px solid rgba(124,58,237,0.3)", boxShadow: "0 0 24px rgba(124,58,237,0.08)" }}>
                            <Search size={17} style={{ color: "var(--text-muted, #5a5a78)", flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder="Buscar por nome, gênero, cidade..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 bg-transparent text-sm"
                                style={{ color: "var(--text-primary, #f0f0f8)", outline: "none", border: "none" }}
                            />
                            {search && (
                                <button onClick={() => setSearch("")} style={{ color: "var(--text-muted)", fontSize: 18, background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>×</button>
                            )}
                            <SlidersHorizontal size={15} style={{ color: "var(--text-muted, #5a5a78)", flexShrink: 0 }} />
                        </div>

                        {/* Genre pills */}
                        <div className="flex gap-2 flex-wrap">
                            {GENRE_FILTERS.map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setGenreFilter(g)}
                                    className={`genre-pill ${genreFilter === g ? "active" : ""}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── DJ Grid ── */}
            <section className="pb-28 px-6">
                <div className="max-w-7xl mx-auto">

                    {/* Count */}
                    <div className="flex items-center justify-between mb-8">
                        <p className="text-sm" style={{ color: "var(--text-muted, #5a5a78)" }}>
                            {loading ? "Carregando…" : (
                                <>
                                    <span style={{ color: "var(--text-primary, #f0f0f8)", fontWeight: 600 }}>{filtered.length}</span>
                                    {" "}{filtered.length === 1 ? "DJ encontrado" : "DJs encontrados"}
                                    {genreFilter !== "Todos" && (
                                        <> em <span style={{ color: "var(--purple-neon, #a855f7)" }}>{genreFilter}</span></>
                                    )}
                                </>
                            )}
                        </p>
                    </div>

                    {/* Skeleton */}
                    {loading && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="aspect-[3/4] rounded-2xl animate-pulse"
                                    style={{ background: "var(--bg-card, #0e0e1a)" }} />
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && filtered.length === 0 && (
                        <div className="text-center py-24">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                                <Search size={32} style={{ color: "var(--purple-neon, #a855f7)" }} />
                            </div>
                            <p className="font-semibold text-lg mb-2" style={{ color: "var(--text-primary, #f0f0f8)" }}>
                                Nenhum DJ encontrado
                            </p>
                            <p className="text-sm mb-6" style={{ color: "var(--text-muted, #5a5a78)" }}>
                                Tente outro nome, gênero ou remova os filtros.
                            </p>
                            <button
                                onClick={() => { setSearch(""); setGenreFilter("Todos"); }}
                                style={{ padding: "8px 20px", borderRadius: 10, background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", color: "var(--purple-neon, #a855f7)", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                            >
                                Limpar filtros
                            </button>
                        </div>
                    )}

                    {/* Cards */}
                    {!loading && filtered.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filtered.map((dj, i) => (
                                <div key={dj.id} className="fade-up" style={{ animationDelay: `${i * 55}ms` }}>
                                    <DJCard
                                        dj={dj}
                                        index={i}
                                        onClick={() => setSelectedDJ(dj)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Profile panel */}
            <DJProfilePanel
                dj={selectedDJ}
                onClose={handleClose}
                isClub={user?.user_type === "CLUB"}
            />
        </div>
    );
}