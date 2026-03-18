"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, MessageSquare, History, CheckCircle, XCircle, MessageCircle, ChevronDown } from "lucide-react";
import { getStoredUser, getMessages, sendMessage, getBookingHistory } from "@/lib/api";
import type { Booking, BookingMessage } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PROPOSTA:   { label: "Proposta",   color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  NEGOCIANDO: { label: "Negociando", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  APROVADO:   { label: "Aprovado",   color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  RECUSADO:   { label: "Recusado",   color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  CANCELADO:  { label: "Cancelado",  color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

const inp: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(124,58,237,0.2)",
  color: "var(--text-primary)",
};

interface ChatPanelProps {
  booking: Booking | null;
  onClose: () => void;
  // DJ mode: action buttons
  isDJ?: boolean;
  onStatusChange?: (bookingId: string, newStatus: string, reason?: string) => Promise<void>;
}

export default function ChatPanel({ booking, onClose, isDJ = false, onStatusChange }: ChatPanelProps) {
  const user = getStoredUser();
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "historico">("chat");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showReasonFor, setShowReasonFor] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (booking) {
      setVisible(true);
      setChatMsg("");
      setReason("");
      setShowReasonFor(null);
      setActiveTab("chat");
      loadData(booking.id);
    } else {
      setVisible(false);
    }
  }, [booking?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async (id: string) => {
    const [msgs, hist] = await Promise.all([
      getMessages(id).catch(() => []),
      getBookingHistory(id).catch(() => []),
    ]);
    setMessages(msgs as BookingMessage[]);
    setHistory(hist as any[]);
  };

  const handleSendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !chatMsg.trim()) return;
    setSendingMsg(true);
    try {
      const msg = await sendMessage(booking.id, chatMsg.trim());
      setMessages((prev) => [...prev, msg as BookingMessage]);
      setChatMsg("");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAction = async (newStatus: string) => {
    if (!booking || !onStatusChange) return;
    if ((newStatus === "RECUSADO" || newStatus === "CANCELADO") && !reason.trim()) {
      setShowReasonFor(newStatus);
      return;
    }
    setActionLoading(newStatus);
    try {
      await onStatusChange(booking.id, newStatus, reason || undefined);
      setReason("");
      setShowReasonFor(null);
      loadData(booking.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!booking) return null;

  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PROPOSTA;
  const canAct = isDJ && ["PROPOSTA", "NEGOCIANDO"].includes(booking.status);
  const chatEnabled = ["NEGOCIANDO", "APROVADO"].includes(booking.status);
  const chatClosed = ["CANCELADO", "RECUSADO"].includes(booking.status);
  const chatPending = booking.status === "PROPOSTA";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "min(420px, 100vw)",
          background: "var(--bg-card)",
          borderLeft: "1px solid rgba(124,58,237,0.25)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-black text-base truncate" style={{ color: "var(--text-primary)" }}>
                {booking.event_name}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
                {booking.event_date && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(booking.event_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                )}
                {booking.fee_amount != null && (
                  <span className="text-xs font-semibold" style={{ color: "var(--purple-neon)" }}>
                    R$ {Number(booking.fee_amount).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
            <button onClick={handleClose}
              className="flex-shrink-0 rounded-lg p-1.5 transition-colors"
              style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          {/* DJ action buttons */}
          {canAct && (
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <button onClick={() => handleAction("APROVADO")}
                  disabled={!!actionLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", cursor: "pointer" }}>
                  {actionLoading === "APROVADO" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  Aprovar
                </button>
                <button onClick={() => handleAction("NEGOCIANDO")}
                  disabled={!!actionLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", cursor: "pointer" }}>
                  {actionLoading === "NEGOCIANDO" ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />}
                  Negociar
                </button>
                <button onClick={() => setShowReasonFor(showReasonFor === "RECUSADO" ? null : "RECUSADO")}
                  disabled={!!actionLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer" }}>
                  <XCircle size={13} /> Recusar
                </button>
              </div>
              {showReasonFor && (
                <div className="flex gap-2">
                  <input value={reason} onChange={(e) => setReason(e.target.value)}
                    placeholder={`Motivo${showReasonFor === "RECUSADO" ? " da recusa" : " do cancelamento"} *`}
                    className="flex-1 px-3 py-2 rounded-xl text-xs" style={inp} />
                  <button onClick={() => handleAction(showReasonFor)}
                    disabled={!reason.trim() || !!actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                    style={{ background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}>
                    {actionLoading ? <Loader2 size={12} className="animate-spin" /> : "OK"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Club cancel */}
          {!isDJ && !chatClosed && (
            <div className="mt-3">
              {showReasonFor !== "CANCELADO" ? (
                <button onClick={() => setShowReasonFor("CANCELADO")}
                  className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.18)", cursor: "pointer" }}>
                  <XCircle size={13} /> Cancelar proposta
                </button>
              ) : (
                <div className="flex gap-2">
                  <input value={reason} onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo do cancelamento *"
                    className="flex-1 px-3 py-2 rounded-xl text-xs" style={inp} />
                  <button onClick={() => handleAction("CANCELADO")}
                    disabled={!reason.trim() || !!actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                    style={{ background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}>
                    {actionLoading ? <Loader2 size={12} className="animate-spin" /> : "OK"}
                  </button>
                  <button onClick={() => setShowReasonFor(null)}
                    className="px-3 py-2 rounded-xl text-xs"
                    style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "none", cursor: "pointer" }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 px-5 py-2.5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          {(["chat", "historico"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              style={{
                background: activeTab === t ? "rgba(124,58,237,0.2)" : "transparent",
                color: activeTab === t ? "var(--purple-neon)" : "var(--text-muted)",
                border: "none", cursor: "pointer",
              }}>
              {t === "chat" ? <><MessageSquare size={12} /> Chat</> : <><History size={12} /> Histórico</>}
            </button>
          ))}
        </div>

        {/* ── Chat ── */}
        {activeTab === "chat" && (
          <>
            {/* Waiting state — proposta ainda não respondida */}
            {chatPending ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <MessageSquare size={24} style={{ color: "var(--purple-neon)", opacity: 0.7 }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  {isDJ ? "Responda a proposta para liberar o chat" : "Aguardando resposta do DJ"}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {isDJ
                    ? "Clique em Aprovar ou Negociar para começar a conversa."
                    : "O chat será liberado assim que o DJ aprovar ou entrar em negociação."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2" style={{ minHeight: 0 }}>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                        style={{ background: "rgba(124,58,237,0.1)" }}>
                        <MessageSquare size={22} style={{ color: "var(--purple-neon)", opacity: 0.6 }} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Nenhuma mensagem ainda</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Inicie a conversa abaixo</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.sender_user_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[78%] px-4 py-2.5 rounded-2xl text-sm"
                          style={{
                            background: isMe ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(255,255,255,0.07)",
                            color: isMe ? "#fff" : "var(--text-primary)",
                            borderBottomRightRadius: isMe ? 5 : undefined,
                            borderBottomLeftRadius: !isMe ? 5 : undefined,
                          }}>
                          <p style={{ lineHeight: 1.5 }}>{msg.message}</p>
                          <p className="text-xs mt-1" style={{ opacity: 0.55 }}>
                            {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {chatEnabled ? (
                  <form onSubmit={handleSendMsg}
                    className="flex gap-2 px-4 py-3 flex-shrink-0"
                    style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }}>
                    <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)}
                      placeholder="Mensagem..."
                      className="flex-1 px-4 py-2.5 rounded-2xl text-sm" style={inp} />
                    <button type="submit" disabled={sendingMsg || !chatMsg.trim()}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", border: "none", cursor: "pointer" }}>
                      {sendingMsg ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </form>
                ) : (
                  <div className="px-5 py-3 text-center text-xs flex-shrink-0"
                    style={{ color: "var(--text-muted)", borderTop: "1px solid rgba(124,58,237,0.1)" }}>
                    Conversa encerrada
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Histórico ── */}
        {activeTab === "historico" && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {history.length === 0 && (
              <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>Sem histórico.</p>
            )}
            {(history as any[]).map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: STATUS_CONFIG[h.new_status]?.color ?? "#a855f7" }} />
                <div>
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                    Status alterado para{" "}
                    <span style={{ color: STATUS_CONFIG[h.new_status]?.color, fontWeight: 600 }}>
                      {STATUS_CONFIG[h.new_status]?.label ?? h.new_status}
                    </span>
                  </p>
                  {h.reason && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{h.reason}</p>}
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {new Date(h.changed_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
