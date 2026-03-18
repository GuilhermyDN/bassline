"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Music2,
  Calendar,
  User as UserIcon,
  LogOut,
  CheckCircle,
  MessageSquare,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  TrendingUp,
  Inbox,
  Loader2,
  Camera,
} from "lucide-react";
import {
  getStoredUser,
  logout,
  getMyReceivedBookings,
  updateBookingStatus,
  getMyDJProfile,
  createMyDJProfile,
  updateMyDJProfile,
  uploadAvatar,
  listAvailability,
  createAvailability,
  deleteAvailability,
  type User,
  type Booking,
  type DJProfile,
} from "@/lib/api";
import { useSubscription } from "@/hooks/useSubscription";
import ProGate from "@/components/ProGate";
import Link from "next/link";
import ChatPanel from "@/components/ChatPanel";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "propostas" | "agenda" | "perfil";

interface AvailabilityBlock {
  id: string;
  start_time: string;
  end_time: string;
  title?: string;
  notes?: string;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PROPOSTA: { label: "Proposta", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  NEGOCIANDO: { label: "Negociando", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  APROVADO: { label: "Aprovado", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  RECUSADO: { label: "Recusado", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  CANCELADO: { label: "Cancelado", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, color: "#fff", bg: "rgba(255,255,255,0.1)" };
  return (
    <span style={{ color: m.color, background: m.bg, border: `1px solid ${m.color}33` }}
      className="text-xs font-semibold px-2.5 py-1 rounded-full">
      {m.label}
    </span>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="stat-card" style={{ borderColor: `${accent}30` }}>
      <div className="stat-icon" style={{ background: `${accent}18`, color: accent }}>{icon}</div>
      <div>
        <p className="stat-value" style={{ color: accent }}>{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );
}

// ─── Tab: Propostas ───────────────────────────────────────────────────────────

function TabPropostas({
  bookings, loading, onSelectBooking,
}: {
  bookings: Booking[];
  loading: boolean;
  onSelectBooking: (b: Booking) => void;
}) {
  const [filter, setFilter] = useState("TODOS");

  const filters = ["TODOS", "PROPOSTA", "NEGOCIANDO", "APROVADO", "RECUSADO", "CANCELADO"];
  const visible = filter === "TODOS" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="tab-content">
      {/* Filter pills */}
      <div className="filter-pills">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-pill ${filter === f ? "active" : ""}`}
            style={filter === f && f !== "TODOS" ? {
              background: STATUS_META[f]?.bg,
              borderColor: STATUS_META[f]?.color + "60",
              color: STATUS_META[f]?.color,
            } : {}}
          >
            {f === "TODOS" ? "Todos" : STATUS_META[f]?.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading-state">
          <Loader2 size={28} className="spin" style={{ color: "var(--purple-neon)" }} />
          <p>Carregando propostas…</p>
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="empty-state">
          <Inbox size={48} style={{ color: "var(--purple-neon)", opacity: 0.4 }} />
          <p>Nenhuma proposta {filter !== "TODOS" ? `com status "${STATUS_META[filter]?.label}"` : "ainda"}.</p>
        </div>
      )}

      <div className="booking-list">
        {visible.map((b, i) => (
          <div
            key={b.id}
            className="booking-row"
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => onSelectBooking(b)}
          >
            <div className="booking-row-left">
              <div className="booking-avatar">
                {(b.event_name ?? "E")[0].toUpperCase()}
              </div>
              <div>
                <p className="booking-club">{b.event_name}</p>
                <p className="booking-date">
                  <Calendar size={12} /> {b.event_date ? fmtShort(b.event_date) : "—"}
                </p>
              </div>
            </div>
            <div className="booking-row-right">
              {b.fee_amount != null && (
                <span className="booking-fee">R$ {Number(b.fee_amount).toLocaleString("pt-BR")}</span>
              )}
              <StatusBadge status={b.status} />
              <ChevronRight size={16} className="row-chevron" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Agenda ──────────────────────────────────────────────────────────────

function TabAgenda() {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ start: "", end: "", title: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await listAvailability();
      setBlocks(data as AvailabilityBlock[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.start || !form.end) { setError("Preencha início e fim."); return; }
    if (new Date(form.start) >= new Date(form.end)) { setError("Início deve ser antes do fim."); return; }
    setSaving(true); setError("");
    try {
      await createAvailability({ start_time: form.start, end_time: form.end, title: form.title || undefined });
      setForm({ start: "", end: "", title: "" });
      setAdding(false);
      load();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAvailability(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch (e) { console.error(e); }
  }

  return (
    <div className="tab-content">
      <div className="agenda-header">
        <div>
          <h3 className="section-title">Bloqueios de Agenda</h3>
          <p className="section-sub">Marque períodos em que você não está disponível.</p>
        </div>
        <button className="btn-add" onClick={() => setAdding((v) => !v)}>
          <Plus size={16} /> Bloquear período
        </button>
      </div>

      {adding && (
        <div className="add-block-form">
          <div className="form-row-2">
            <div className="field">
              <label>Início</label>
              <input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="input-field" />
            </div>
            <div className="field">
              <label>Fim</label>
              <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="field">
            <label>Motivo (opcional)</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Viagem, show exclusivo…" className="input-field" />
          </div>
          {error && <p className="form-error"><AlertCircle size={13} /> {error}</p>}
          <div className="form-actions">
            <button onClick={() => setAdding(false)} className="btn-cancel">Cancelar</button>
            <button onClick={handleCreate} disabled={saving} className="btn-save">
              {saving ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} Salvar bloqueio
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <Loader2 size={28} className="spin" style={{ color: "var(--purple-neon)" }} />
        </div>
      ) : blocks.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} style={{ color: "var(--purple-neon)", opacity: 0.4 }} />
          <p>Nenhum bloqueio cadastrado.</p>
        </div>
      ) : (
        <div className="blocks-list">
          {blocks.map((b, i) => (
            <div key={b.id} className="block-row" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="block-dates">
                <Calendar size={14} style={{ color: "var(--purple-neon)" }} />
                <span>{fmtDate(b.start_time)}</span>
                <span className="block-sep">→</span>
                <span>{fmtDate(b.end_time)}</span>
              </div>
              {b.title && <p className="block-reason">{b.title}</p>}
              <button className="btn-delete" onClick={() => handleDelete(b.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Perfil ──────────────────────────────────────────────────────────────

const GENRES = ["House", "Techno", "Drum & Bass", "Trance", "Dubstep", "Funk", "Hip-Hop", "R&B", "Afrobeat", "Reggaeton", "Pop", "Eletrônico"];

function TabPerfil() {
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const [form, setForm] = useState({
    stage_name: "", bio: "", city: "", state: "",
    instagram_url: "", soundcloud_url: "", youtube_url: "",
    genres: [] as string[],
  });

  useEffect(() => {
    // Carrega avatar do user armazenado
    const storedUser = getStoredUser();
    if (storedUser?.avatar_url) setAvatarUrl(storedUser.avatar_url);

    getMyDJProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          stage_name: p.stage_name ?? "",
          bio: p.bio ?? "",
          city: p.city ?? "",
          state: p.state ?? "",
          instagram_url: p.instagram_url ?? "",
          soundcloud_url: p.soundcloud_url ?? "",
          youtube_url: p.youtube_url ?? "",
          genres: p.genres ? (Array.isArray(p.genres) ? p.genres : p.genres.split(",").map((g) => g.trim())) : [],
        });
      })
      .catch(() => setIsNew(true))
      .finally(() => setLoading(false));
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const updatedUser = await uploadAvatar(file);
      setAvatarUrl(updatedUser.avatar_url ?? null);
      // Atualiza o user no localStorage
      const stored = getStoredUser();
      if (stored) {
        localStorage.setItem("bassline_user", JSON.stringify({ ...stored, avatar_url: updatedUser.avatar_url }));
      }
    } catch (e: any) {
      setAvatarError(e?.message ?? "Erro ao fazer upload.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function toggleGenre(g: string) {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }));
  }

  async function handleSave() {
    if (!form.stage_name.trim()) { setError("Nome artístico obrigatório."); return; }
    setSaving(true); setError(""); setSuccess(false);
    const payload = {
      stage_name: form.stage_name,
      bio: form.bio || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      instagram_url: form.instagram_url || undefined,
      soundcloud_url: form.soundcloud_url || undefined,
      youtube_url: form.youtube_url || undefined,
      genres: form.genres.length ? form.genres.join(",") : undefined,
    };
    try {
      if (isNew) {
        await createMyDJProfile(payload);
        setIsNew(false);
      } else {
        await updateMyDJProfile(payload);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="loading-state">
      <Loader2 size={28} className="spin" style={{ color: "var(--purple-neon)" }} />
    </div>
  );

  return (
    <div className="tab-content">
      <div className="profile-form">

        {/* ── Foto de perfil ── */}
        <div className="form-section">
          <h3 className="form-section-title">Foto de perfil</h3>
          <div className="avatar-upload-area">
            <label htmlFor="avatar-input" className="avatar-upload-label">
              {uploadingAvatar ? (
                <div className="avatar-placeholder">
                  <Loader2 size={28} className="spin" style={{ color: "var(--purple-neon)" }} />
                </div>
              ) : avatarUrl ? (
                <div className="avatar-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl} alt="Avatar" className="avatar-img" />
                  <div className="avatar-overlay">
                    <Camera size={20} />
                    <span>Trocar foto</span>
                  </div>
                </div>
              ) : (
                <div className="avatar-placeholder">
                  <Camera size={28} style={{ color: "var(--purple-neon)" }} />
                  <span>Adicionar foto</span>
                </div>
              )}
            </label>
            <input
              id="avatar-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            <div className="avatar-info">
              <p className="avatar-info-title">Foto profissional</p>
              <p className="avatar-info-sub">JPEG, PNG ou WebP · Máx. 5MB</p>
              {avatarError && <p className="avatar-error"><AlertCircle size={12} /> {avatarError}</p>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Identidade</h3>
          <div className="form-row-2">
            <div className="field">
              <label>Nome artístico *</label>
              <input value={form.stage_name} onChange={(e) => setForm({ ...form, stage_name: e.target.value })} placeholder="DJ Nome" className="input-field" />
            </div>
          </div>
          <div className="form-row-2">
            <div className="field">
              <label>Cidade</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="São Paulo" className="input-field" />
            </div>
            <div className="field">
              <label>Estado</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="SP" className="input-field" />
            </div>
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Conte sua história…" className="input-field textarea" rows={4} />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Gêneros musicais</h3>
          <div className="genre-grid">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className={`genre-pill ${form.genres.includes(g) ? "selected" : ""}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Links sociais</h3>
          <div className="field">
            <label>Instagram</label>
            <input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="https://instagram.com/seu_perfil" className="input-field" />
          </div>
          <div className="field">
            <label>SoundCloud</label>
            <input value={form.soundcloud_url} onChange={(e) => setForm({ ...form, soundcloud_url: e.target.value })} placeholder="https://soundcloud.com/seu_perfil" className="input-field" />
          </div>
          <div className="field">
            <label>YouTube</label>
            <input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/@seu_canal" className="input-field" />
          </div>
        </div>

        {error && <p className="form-error"><AlertCircle size={13} /> {error}</p>}
        {success && <p className="form-success"><CheckCircle size={13} /> Perfil salvo com sucesso!</p>}

        <button onClick={handleSave} disabled={saving} className="btn-save-profile">
          {saving ? <><Loader2 size={16} className="spin" /> Salvando…</> : isNew ? "Criar perfil" : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardDJPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("propostas");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const { isActive, isExpired, loading: subLoading } = useSubscription();

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.user_type !== "DJ") { router.push("/auth/login"); return; }
    setUser(u);
  }, [router]);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const data = await getMyReceivedBookings();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleStatusChange = async (bookingId: string, newStatus: string, reason?: string) => {
    const updated = await updateBookingStatus(bookingId, newStatus, reason);
    setBookings((prev) => prev.map((b) => b.id === updated.id ? updated : b));
    setChatBooking(updated);
  };

  function handleLogout() {
    logout();
    router.push("/");
  }

  const stats = {
    total: bookings.length,
    pendentes: bookings.filter((b) => ["PROPOSTA", "NEGOCIANDO"].includes(b.status)).length,
    aprovados: bookings.filter((b) => b.status === "APROVADO").length,
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "propostas", label: "Propostas", icon: <Inbox size={16} /> },
    { key: "agenda", label: "Agenda", icon: <Calendar size={16} /> },
    { key: "perfil", label: "Perfil", icon: <UserIcon size={16} /> },
  ];

  return (
    <>
      <style>{`
        :root {
          --bg-primary: #07070f;
          --bg-card: #0e0e1a;
          --bg-card-hover: #12121f;
          --text-primary: #f0f0f8;
          --text-secondary: #a0a0bc;
          --text-muted: #5a5a78;
          --purple-neon: #a855f7;
          --purple-bright: #c084fc;
          --purple-dark: #7c3aed;
          --border: rgba(124,58,237,0.18);
          --border-hover: rgba(168,85,247,0.35);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Geist', system-ui, sans-serif;
          min-height: 100vh;
        }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Layout ── */
        .dash-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ── Topbar ── */
        .topbar {
          position: sticky; top: 0; z-index: 50;
          background: rgba(7,7,15,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .topbar-logo {
          font-size: 18px; font-weight: 800; letter-spacing: 0.12em;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .topbar-user {
          font-size: 13px; color: var(--text-secondary);
          padding: 6px 14px; border-radius: 20px;
          background: rgba(168,85,247,0.1); border: 1px solid var(--border);
        }
        .topbar-user strong { color: var(--text-primary); }
        .btn-logout {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--text-muted);
          background: none; border: 1px solid var(--border);
          padding: 6px 12px; border-radius: 8px; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-logout:hover { color: #ef4444; border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.08); }

        /* ── Main ── */
        .dash-main {
          flex: 1;
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }

        /* ── Page header ── */
        .page-header {
          margin-bottom: 28px;
          animation: fadeUp 0.5s ease both;
        }
        .page-title {
          font-size: 26px; font-weight: 800; letter-spacing: -0.02em;
          color: var(--text-primary);
        }
        .page-sub { font-size: 14px; color: var(--text-muted); margin-top: 4px; }

        /* ── Stats ── */
        .stats-row {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
          margin-bottom: 28px;
          animation: fadeUp 0.5s ease 0.1s both;
        }
        .stat-card {
          background: var(--bg-card);
          border: 1px solid;
          border-radius: 16px;
          padding: 18px 20px;
          display: flex; align-items: center; gap: 14px;
          transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); }
        .stat-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .stat-value { font-size: 24px; font-weight: 800; line-height: 1; }
        .stat-label { font-size: 12px; color: var(--text-muted); margin-top: 3px; }

        /* ── Tabs ── */
        .tabs-nav {
          display: flex; gap: 4px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 24px;
          animation: fadeUp 0.5s ease 0.15s both;
        }
        .tab-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 10px 16px; border-radius: 10px;
          font-size: 14px; font-weight: 500;
          color: var(--text-muted);
          background: none; border: none; cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn:hover { color: var(--text-secondary); background: rgba(168,85,247,0.06); }
        .tab-btn.active {
          color: var(--purple-bright);
          background: rgba(168,85,247,0.15);
        }

        /* ── Tab content ── */
        .tab-content { animation: fadeUp 0.35s ease both; }

        /* ── Filter pills ── */
        .filter-pills {
          display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;
        }
        .filter-pill {
          padding: 5px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 500;
          background: var(--bg-card); border: 1px solid var(--border);
          color: var(--text-muted); cursor: pointer; transition: all 0.18s;
        }
        .filter-pill:hover { border-color: var(--border-hover); color: var(--text-secondary); }
        .filter-pill.active { background: rgba(168,85,247,0.12); border-color: rgba(168,85,247,0.4); color: var(--purple-bright); }

        /* ── Booking list ── */
        .booking-list { display: flex; flex-direction: column; gap: 10px; }
        .booking-row {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 14px; padding: 16px 18px;
          cursor: pointer; transition: all 0.2s;
          animation: fadeUp 0.35s ease both;
        }
        .booking-row:hover { border-color: var(--border-hover); background: var(--bg-card-hover); transform: translateX(3px); }
        .booking-row-left { display: flex; align-items: center; gap: 14px; }
        .booking-avatar {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 700; color: white;
        }
        .booking-club { font-size: 15px; font-weight: 600; color: var(--text-primary); }
        .booking-date {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: var(--text-muted); margin-top: 3px;
        }
        .booking-row-right { display: flex; align-items: center; gap: 10px; }
        .booking-fee { font-size: 13px; font-weight: 600; color: #22c55e; }
        .row-chevron { color: var(--text-muted); transition: transform 0.2s; }
        .booking-row:hover .row-chevron { transform: translateX(3px); color: var(--purple-neon); }

        /* ── Empty / loading states ── */
        .loading-state, .empty-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 60px 0; color: var(--text-muted); font-size: 14px;
        }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(7,7,15,0.8);
          backdrop-filter: blur(8px);
          display: flex; align-items: flex-end;
          justify-content: center;
          padding: 0 0 0 0;
          animation: fadeUp 0.2s ease;
        }
        .modal-box {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px 24px 0 0;
          width: 100%; max-width: 680px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 28px;
          animation: fadeUp 0.25s ease;
          display: flex; flex-direction: column; gap: 18px;
        }
        .modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .modal-title { font-size: 20px; font-weight: 700; color: var(--text-primary); }
        .modal-sub { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        .modal-close {
          background: rgba(255,255,255,0.06); border: 1px solid var(--border);
          border-radius: 8px; padding: 6px; cursor: pointer; color: var(--text-muted);
          transition: all 0.2s; flex-shrink: 0;
        }
        .modal-close:hover { color: var(--text-primary); border-color: var(--border-hover); }

        .booking-info-grid {
          display: flex; flex-wrap: wrap; gap: 14px;
          padding: 14px; background: rgba(168,85,247,0.06);
          border: 1px solid var(--border); border-radius: 12px;
        }
        .info-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); }
        .info-item svg { color: var(--purple-neon); flex-shrink: 0; }

        .booking-notes { padding: 14px; background: rgba(255,255,255,0.03); border-radius: 12px; }
        .notes-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .notes-text { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }

        /* ── Action buttons ── */
        .action-section { display: flex; flex-direction: column; gap: 12px; }
        .action-btns { display: flex; gap: 10px; flex-wrap: wrap; }

        .btn-approve, .btn-negotiate, .btn-refuse, .btn-confirm-refuse, .btn-cancel, .btn-save, .btn-save-profile, .btn-add {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; border: 1px solid transparent;
        }
        .btn-approve { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.4); color: #22c55e; }
        .btn-approve:hover:not(:disabled) { background: rgba(34,197,94,0.25); }
        .btn-negotiate { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.4); color: #f59e0b; }
        .btn-negotiate:hover:not(:disabled) { background: rgba(245,158,11,0.25); }
        .btn-refuse { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.35); color: #ef4444; }
        .btn-refuse:hover:not(:disabled) { background: rgba(239,68,68,0.22); }
        .btn-confirm-refuse { background: #ef4444; color: white; }
        .btn-confirm-refuse:disabled { opacity: 0.4; cursor: not-allowed; }

        .reason-row { display: flex; gap: 10px; }
        .reason-input {
          flex: 1; padding: 10px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.05); border: 1px solid var(--border);
          color: var(--text-primary); font-size: 14px; outline: none;
        }
        .reason-input:focus { border-color: rgba(239,68,68,0.5); }

        /* ── Section tabs (chat/history) ── */
        .section-tabs { display: flex; gap: 4px; }
        .section-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          font-size: 13px; font-weight: 500;
          color: var(--text-muted); background: none;
          border: 1px solid transparent; cursor: pointer; transition: all 0.18s;
        }
        .section-tab.active { color: var(--purple-bright); background: rgba(168,85,247,0.12); border-color: rgba(168,85,247,0.3); }

        /* ── Chat ── */
        .chat-area { display: flex; flex-direction: column; gap: 12px; }
        .chat-messages {
          max-height: 240px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 10px;
          padding: 4px;
        }
        .empty-chat { font-size: 13px; color: var(--text-muted); text-align: center; padding: 24px 0; }
        .chat-bubble { max-width: 75%; display: flex; flex-direction: column; gap: 4px; }
        .chat-bubble.mine { align-self: flex-end; align-items: flex-end; }
        .chat-bubble.theirs { align-self: flex-start; }
        .bubble-text {
          padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5;
        }
        .mine .bubble-text { background: rgba(168,85,247,0.22); color: var(--text-primary); border-bottom-right-radius: 4px; }
        .theirs .bubble-text { background: rgba(255,255,255,0.07); color: var(--text-primary); border-bottom-left-radius: 4px; }
        .bubble-time { font-size: 11px; color: var(--text-muted); }

        .chat-input-row { display: flex; gap: 8px; }
        .chat-input {
          flex: 1; padding: 11px 16px; border-radius: 12px;
          background: rgba(255,255,255,0.05); border: 1px solid var(--border);
          color: var(--text-primary); font-size: 14px; outline: none; transition: border-color 0.2s;
        }
        .chat-input:focus { border-color: var(--border-hover); }
        .chat-send {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          border: none; color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: opacity 0.2s;
        }
        .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── History ── */
        .history-list { display: flex; flex-direction: column; gap: 10px; }
        .history-item { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .history-time { font-size: 12px; color: var(--text-muted); }
        .history-reason { font-size: 12px; color: var(--text-secondary); font-style: italic; }

        /* ── Agenda ── */
        .agenda-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
        }
        .section-title { font-size: 18px; font-weight: 700; color: var(--text-primary); }
        .section-sub { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

        .btn-add {
          background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.4);
          color: var(--purple-bright); white-space: nowrap;
        }
        .btn-add:hover { background: rgba(168,85,247,0.25); }

        .add-block-form {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px;
          display: flex; flex-direction: column; gap: 14px;
          margin-bottom: 20px; animation: fadeUp 0.25s ease;
        }

        .blocks-list { display: flex; flex-direction: column; gap: 10px; }
        .block-row {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 14px; padding: 16px 18px;
          display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
          animation: fadeUp 0.35s ease both;
          transition: border-color 0.2s;
        }
        .block-row:hover { border-color: var(--border-hover); }
        .block-dates { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); flex: 1; }
        .block-sep { color: var(--text-muted); }
        .block-reason { font-size: 12px; color: var(--text-muted); font-style: italic; flex-basis: 100%; }
        .btn-delete {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          color: #ef4444; border-radius: 8px; padding: 7px;
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;
          margin-left: auto;
        }
        .btn-delete:hover { background: rgba(239,68,68,0.2); }

        /* ── Perfil form ── */
        .profile-form { display: flex; flex-direction: column; gap: 28px; }
        .form-section { display: flex; flex-direction: column; gap: 14px; }
        .form-section-title {
          font-size: 14px; font-weight: 700; color: var(--purple-bright);
          text-transform: uppercase; letter-spacing: 0.08em;
          padding-bottom: 10px; border-bottom: 1px solid var(--border);
        }

        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 540px) { .form-row-2 { grid-template-columns: 1fr; } }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
        .input-field {
          padding: 11px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.04); border: 1px solid var(--border);
          color: var(--text-primary); font-size: 14px; outline: none; transition: border-color 0.2s;
          width: 100%;
        }
        .input-field:focus { border-color: var(--border-hover); }
        .textarea { resize: vertical; min-height: 90px; font-family: inherit; line-height: 1.5; }

        .genre-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .genre-pill {
          padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;
          background: rgba(255,255,255,0.04); border: 1px solid var(--border);
          color: var(--text-muted); cursor: pointer; transition: all 0.18s;
        }
        .genre-pill:hover { border-color: rgba(168,85,247,0.4); color: var(--text-secondary); }
        .genre-pill.selected { background: rgba(168,85,247,0.2); border-color: rgba(168,85,247,0.6); color: var(--purple-bright); }

        .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-cancel {
          background: rgba(255,255,255,0.05); border: 1px solid var(--border);
          color: var(--text-muted); border-radius: 10px; padding: 10px 18px;
          font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .btn-cancel:hover { color: var(--text-primary); border-color: var(--border-hover); }
        .btn-save {
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          color: white; border: none; border-radius: 10px;
        }
        .btn-save:hover:not(:disabled) { opacity: 0.88; }
        .btn-save:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-save-profile {
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          color: white; border: none; border-radius: 12px;
          padding: 13px 24px; font-size: 15px;
          align-self: flex-start; width: 100%;
          justify-content: center;
        }
        .btn-save-profile:hover:not(:disabled) { opacity: 0.88; }
        .btn-save-profile:disabled { opacity: 0.45; cursor: not-allowed; }

        .form-error {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: #ef4444;
          padding: 10px 14px; border-radius: 10px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
        }
        .form-success {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: #22c55e;
          padding: 10px 14px; border-radius: 10px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25);
        }

        /* ── Avatar upload ── */
        .avatar-upload-area {
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
        }
        .avatar-upload-label { cursor: pointer; flex-shrink: 0; }
        .avatar-placeholder {
          width: 100px; height: 100px; border-radius: 50%;
          background: rgba(168,85,247,0.1); border: 2px dashed rgba(168,85,247,0.4);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 6px; font-size: 11px; color: var(--purple-neon); transition: all 0.2s;
        }
        .avatar-upload-label:hover .avatar-placeholder {
          background: rgba(168,85,247,0.18); border-color: rgba(168,85,247,0.7);
        }
        .avatar-preview {
          width: 100px; height: 100px; border-radius: 50%;
          position: relative; overflow: hidden;
          border: 2px solid rgba(168,85,247,0.5);
        }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
        .avatar-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px; color: white; font-size: 11px; font-weight: 600;
          opacity: 0; transition: opacity 0.2s;
        }
        .avatar-upload-label:hover .avatar-overlay { opacity: 1; }
        .avatar-info { display: flex; flex-direction: column; gap: 4px; }
        .avatar-info-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .avatar-info-sub { font-size: 12px; color: var(--text-muted); }
        .avatar-error {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: #ef4444; margin-top: 4px;
        }

        @media (max-width: 600px) {
          .stats-row { grid-template-columns: 1fr; }
          .tabs-nav { flex-direction: column; }
        }
      `}</style>

      <div className="dash-wrapper">
        {/* Topbar */}
        <header className="topbar">
          <span className="topbar-logo">BASSLINE</span>
          <div className="topbar-right">
            {user && (
              <span className="topbar-user">
                <strong>{user.name ?? user.email}</strong> · DJ
              </span>
            )}
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={14} /> Sair
            </button>
          </div>
        </header>

        <main className="dash-main">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">
              <Music2 size={24} style={{ display: "inline", marginRight: 10, color: "var(--purple-neon)" }} />
              Dashboard DJ
            </h1>
            <p className="page-sub">Gerencie suas propostas, agenda e perfil.</p>
          </div>

          {/* Expired subscription banner */}
          {!subLoading && isExpired && (
            <div
              className="rounded-2xl px-5 py-4 flex items-center gap-4 mb-2"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                  Seu período gratuito expirou
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Assine um plano Pro para continuar gerenciando sua agenda e recebendo propostas sem limites.
                </p>
              </div>
              <Link
                href="/pricing"
                className="text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#9333ea)",
                  color: "#fff",
                  boxShadow: "0 0 12px rgba(124,58,237,0.4)",
                }}
              >
                Ver planos
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <StatCard icon={<Inbox size={18} />} label="Total recebidas" value={stats.total} accent="#a855f7" />
            <StatCard icon={<TrendingUp size={18} />} label="Em aberto" value={stats.pendentes} accent="#f59e0b" />
            <StatCard icon={<CheckCircle size={18} />} label="Aprovadas" value={stats.aprovados} accent="#22c55e" />
          </div>

          {/* Tabs nav */}
          <nav className="tabs-nav">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`tab-btn ${tab === t.key ? "active" : ""}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          {tab === "propostas" && (
            <TabPropostas
              bookings={bookings}
              loading={loadingBookings}
              onSelectBooking={setChatBooking}
            />
          )}
          {tab === "agenda" && (
            <ProGate hasAccess={isActive} loading={subLoading} featureName="a agenda de disponibilidade">
              <TabAgenda />
            </ProGate>
          )}
          {tab === "perfil" && <TabPerfil />}
        </main>
      </div>

      {/* ChatPanel renderizado no nível da página — fora de qualquer transform/animation */}
      <ChatPanel
        booking={chatBooking}
        onClose={() => setChatBooking(null)}
        onStatusChange={handleStatusChange}
        isDJ
      />
    </>
  );
}