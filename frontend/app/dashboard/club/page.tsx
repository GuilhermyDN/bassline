"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Send, MessageSquare,
  Loader2, X, AlertCircle, Zap, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import DJCard from "@/components/DJCard";
import DJProfilePanel from "@/components/DJProfilePanel";
import ProGate from "@/components/ProGate";
import ChatPanel from "@/components/ChatPanel";
import { useSubscription } from "@/hooks/useSubscription";
import {
  getStoredUser, getMyClubProfile, getMySentBookings,
  listDJs, createBooking, createMyClubProfile, updateBookingStatus,
} from "@/lib/api";
import type { ClubProfile, Booking, DJProfile } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PROPOSTA:   { label: "Proposta",   color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  NEGOCIANDO: { label: "Negociando", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  APROVADO:   { label: "Aprovado",   color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  RECUSADO:   { label: "Recusado",   color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  CANCELADO:  { label: "Cancelado",  color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

const inp: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(124,58,237,0.25)",
  color: "var(--text-primary)",
};

export default function ClubDashboard() {
  const router = useRouter();
  const { isActive, isExpired, loading: subLoading } = useSubscription();
  const [clubProfile, setClubProfile] = useState<ClubProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [djs, setDjs] = useState<DJProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"propostas" | "djs" | "perfil">("propostas");
  const [selectedDJ, setSelectedDJ] = useState<DJProfile | null>(null);

  // New proposal modal
  const [bookingModal, setBookingModal] = useState<DJProfile | null>(null);
  const [bookingForm, setBookingForm] = useState({ event_name: "", event_date: "", fee_amount: "", notes: "" });
  const [sendingBooking, setSendingBooking] = useState(false);

  // Chat panel
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);

  // Club profile form
  const [clubForm, setClubForm] = useState({ club_name: "", description: "", instagram_url: "", city: "", state: "" });
  const [editingClub, setEditingClub] = useState(false);

  const user = getStoredUser();

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    if (user.user_type !== "CLUB") { router.push("/"); return; }

    Promise.all([
      getMyClubProfile().catch(() => null),
      getMySentBookings().catch(() => []),
      listDJs().catch(() => []),
    ]).then(([prof, bkgs, djList]) => {
      setClubProfile(prof as ClubProfile | null);
      setBookings(bkgs as Booking[]);
      setDjs(djList as DJProfile[]);
      if (prof) {
        const p = prof as ClubProfile;
        setClubForm({
          club_name: p.club_name ?? "",
          description: p.description ?? "",
          instagram_url: p.instagram_url ?? "",
          city: p.city ?? "",
          state: p.state ?? "",
        });
      }
    }).finally(() => setLoading(false));
  }, [router]);

  const handleStatusChange = async (bookingId: string, newStatus: string, reason?: string) => {
    const updated = await updateBookingStatus(bookingId, newStatus, reason);
    setBookings((prev) => prev.map((b) => b.id === updated.id ? updated : b));
    setChatBooking(updated);
  };

  const handleSendBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModal) return;
    setSendingBooking(true);
    try {
      const booking = await createBooking({
        dj_profile_id: bookingModal.id,
        event_name: bookingForm.event_name,
        event_date: bookingForm.event_date || undefined,
        fee_amount: bookingForm.fee_amount ? Number(bookingForm.fee_amount) : undefined,
        notes: bookingForm.notes || undefined,
      });
      setBookings((prev) => [booking, ...prev]);
      setBookingModal(null);
      setBookingForm({ event_name: "", event_date: "", fee_amount: "", notes: "" });
      setActiveTab("propostas");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar proposta");
    } finally {
      setSendingBooking(false);
    }
  };

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prof = await createMyClubProfile(clubForm);
      setClubProfile(prof);
      setEditingClub(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar perfil");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="pt-20 max-w-5xl mx-auto px-6 pb-16">

        {/* Header */}
        <div className="flex items-center gap-4 py-8">
          <div className="rounded-2xl p-3" style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
            <Building2 size={24} color="#fff" />
          </div>
          <div>
            <h1 className="font-black text-2xl" style={{ color: "var(--text-primary)" }}>
              {clubProfile?.club_name || user?.name || "Club Dashboard"}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
          </div>
        </div>

        {/* Expired banner */}
        {!subLoading && isExpired && (
          <div className="rounded-2xl px-5 py-4 flex items-center gap-4 mb-6"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>Seu período gratuito expirou</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Assine um plano Pro para continuar sem limites.</p>
            </div>
            <Link href="/pricing" className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap"
              style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff" }}>
              <Zap size={13} /> Ver planos
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Propostas", value: bookings.length, color: "#a855f7" },
            { label: "Em Negociação", value: bookings.filter((b) => b.status === "NEGOCIANDO").length, color: "#f59e0b" },
            { label: "Aprovados", value: bookings.filter((b) => b.status === "APROVADO").length, color: "#22c55e" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
              <p className="font-black text-3xl" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "var(--bg-card)", width: "fit-content" }}>
          {(["propostas", "djs", "perfil"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: activeTab === tab ? "linear-gradient(135deg, #7c3aed, #9333ea)" : "transparent",
                color: activeTab === tab ? "#fff" : "var(--text-muted)",
              }}>
              {tab === "propostas" ? "Propostas" : tab === "djs" ? "Buscar DJs" : "Perfil"}
            </button>
          ))}
        </div>

        {/* ── PROPOSTAS ── */}
        {activeTab === "propostas" && (
          <div className="space-y-3">
            {bookings.length === 0 && (
              <div className="text-center py-16 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid rgba(124,58,237,0.1)" }}>
                <Send size={40} className="mx-auto mb-3" style={{ color: "var(--purple-neon)", opacity: 0.5 }} />
                <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>Nenhuma proposta enviada</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Busque um DJ e envie sua primeira proposta</p>
              </div>
            )}
            {bookings.map((booking) => {
              const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PROPOSTA;
              return (
                <div key={booking.id}
                  className="rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all"
                  style={{ background: "var(--bg-card)", border: "1px solid rgba(124,58,237,0.12)" }}
                  onClick={() => setChatBooking(booking)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(168,85,247,0.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.12)")}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{booking.event_name}</h3>
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {booking.event_date && new Date(booking.event_date).toLocaleDateString("pt-BR")}
                      {booking.fee_amount != null && ` · R$ ${Number(booking.fee_amount).toLocaleString("pt-BR")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "rgba(168,85,247,0.1)", color: "var(--purple-neon)" }}>
                      <MessageSquare size={13} /> Chat
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── BUSCAR DJS ── */}
        {activeTab === "djs" && (
          <ProGate hasAccess={isActive} loading={subLoading} featureName="a busca de DJs">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {djs.map((dj, i) => (
                <DJCard key={dj.id} dj={dj} index={i} onClick={() => setSelectedDJ(dj)} />
              ))}
            </div>
          </ProGate>
        )}

        {/* ── PERFIL ── */}
        {activeTab === "perfil" && (
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Perfil do Club</h3>
              {clubProfile && !editingClub && (
                <button onClick={() => setEditingClub(true)}
                  className="text-xs font-semibold px-4 py-2 rounded-lg"
                  style={{ background: "rgba(124,58,237,0.15)", color: "var(--purple-neon)", border: "1px solid rgba(124,58,237,0.3)" }}>
                  Editar
                </button>
              )}
            </div>
            <form onSubmit={handleSaveClub} className="space-y-4">
              {([
                { label: "Nome do Club *", key: "club_name", placeholder: "Nome do seu clube/evento" },
                { label: "Descrição", key: "description", placeholder: "Sobre o seu espaço..." },
                { label: "Instagram", key: "instagram_url", placeholder: "https://instagram.com/..." },
                { label: "Cidade", key: "city", placeholder: "São Paulo" },
                { label: "Estado", key: "state", placeholder: "SP" },
              ] as { label: string; key: keyof typeof clubForm; placeholder: string }[]).map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
                    style={{ color: "var(--text-muted)" }}>{label}</label>
                  <input type="text" value={clubForm[key]}
                    onChange={(e) => setClubForm({ ...clubForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    readOnly={!!clubProfile && !editingClub}
                    className="w-full px-4 py-3 rounded-xl text-sm" style={inp} />
                </div>
              ))}
              {(!clubProfile || editingClub) && (
                <div className="flex gap-3">
                  {editingClub && (
                    <button type="button" onClick={() => setEditingClub(false)}
                      className="flex-1 py-3 rounded-xl font-bold text-sm"
                      style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid rgba(124,58,237,0.2)" }}>
                      Cancelar
                    </button>
                  )}
                  <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-sm"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)", color: "#fff" }}>
                    Salvar
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* DJ Profile Panel */}
      <DJProfilePanel dj={selectedDJ} onClose={() => setSelectedDJ(null)}
        isClub onRequestBooking={(dj) => { setSelectedDJ(null); setBookingModal(dj); }} />

      {/* ── New Booking Modal ── */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(124,58,237,0.3)", boxShadow: "0 0 60px rgba(124,58,237,0.2)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                Proposta para {bookingModal.stage_name}
              </h2>
              <button onClick={() => setBookingModal(null)} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendBooking} className="space-y-4">
              {([
                { label: "Nome do Evento *", key: "event_name", type: "text", placeholder: "Festival de Verão", required: true },
                { label: "Data do Evento", key: "event_date", type: "date", placeholder: "" },
                { label: "Cachê (R$)", key: "fee_amount", type: "number", placeholder: "3000" },
                { label: "Observações", key: "notes", type: "text", placeholder: "Rider, horário, estilo musical..." },
              ] as { label: string; key: keyof typeof bookingForm; type: string; placeholder: string; required?: boolean }[]).map(
                ({ label, key, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
                      style={{ color: "var(--text-muted)" }}>{label}</label>
                    <input type={type} value={bookingForm[key]}
                      onChange={(e) => setBookingForm({ ...bookingForm, [key]: e.target.value })}
                      placeholder={placeholder} required={required}
                      className="w-full px-4 py-3 rounded-xl text-sm" style={inp} />
                  </div>
                )
              )}
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Horários e detalhes técnicos podem ser combinados no chat após o envio.
              </p>
              <button type="submit" disabled={sendingBooking}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)", color: "#fff" }}>
                {sendingBooking ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Enviar Proposta</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Chat Panel ── */}
      <ChatPanel
        booking={chatBooking}
        onClose={() => setChatBooking(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
