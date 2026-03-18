"""
Email service via Resend.
Lazy-import so the server starts even if resend is not installed.
All sends are fire-and-forget (BackgroundTasks) — never block the request.
"""
from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _get_client():
    """Return a resend-compatible send function, or None if not configured."""
    try:
        import resend  # type: ignore
    except ImportError:
        logger.warning("resend not installed — email sending disabled")
        return None

    from app.core.config import settings
    api_key = getattr(settings, "RESEND_API_KEY", "")
    if not api_key:
        logger.warning("RESEND_API_KEY not set — email sending disabled")
        return None

    resend.api_key = api_key
    return resend.Emails.send


def _send(to: str, subject: str, html: str) -> None:
    send_fn = _get_client()
    if not send_fn:
        return
    try:
        from app.core.config import settings
        from_addr = getattr(settings, "EMAIL_FROM", "BASSLINE <no-reply@bassline.app>")
        send_fn({"from": from_addr, "to": [to], "subject": subject, "html": html})
        logger.info("Email sent to %s — %s", to, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)


# ─── Templates ────────────────────────────────────────────────────────────────

def _base(content: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BASSLINE</title></head>
<body style="margin:0;padding:0;background:#07070f;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07070f;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#0e0e1a;border-radius:20px;border:1px solid rgba(124,58,237,0.25);overflow:hidden;max-width:560px;width:100%;">

  <!-- Header -->
  <tr><td style="padding:28px 36px 24px;border-bottom:1px solid rgba(124,58,237,0.15);">
    <span style="font-size:20px;font-weight:900;letter-spacing:0.12em;background:linear-gradient(135deg,#a855f7,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">BASSLINE</span>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 36px 36px;">
    {content}
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 36px;border-top:1px solid rgba(124,58,237,0.1);">
    <p style="margin:0;font-size:12px;color:#3a3a55;text-align:center;">
      © 2026 BASSLINE · Você está recebendo este email porque tem uma conta na plataforma.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>
"""


def _btn(url: str, label: str) -> str:
    return f'<a href="{url}" style="display:inline-block;margin-top:20px;padding:13px 26px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;font-size:14px;font-weight:700;text-decoration:none;">{label} →</a>'


def _h1(text: str) -> str:
    return f'<h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#f0f0f8;">{text}</h1>'


def _p(text: str) -> str:
    return f'<p style="margin:8px 0;font-size:15px;color:#a0a0bc;line-height:1.6;">{text}</p>'


def _badge(text: str, color: str = "#a855f7", bg: str = "rgba(168,85,247,0.15)") -> str:
    return f'<span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:{color};background:{bg};border:1px solid {color}44;">{text}</span>'


def _info_row(label: str, value: str) -> str:
    return f"""
<tr>
  <td style="padding:8px 0;font-size:13px;color:#5a5a78;width:130px;">{label}</td>
  <td style="padding:8px 0;font-size:13px;color:#f0f0f8;font-weight:600;">{value}</td>
</tr>"""


def _info_table(*rows: str) -> str:
    inner = "".join(rows)
    return f'<table style="margin:20px 0;width:100%;border-collapse:collapse;background:rgba(168,85,247,0.05);border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0"><tr><td style="padding:0 16px;"><table width="100%">{inner}</table></td></tr></table>'


# ─── Public API ───────────────────────────────────────────────────────────────

def send_welcome(to: str, name: str, frontend_url: str) -> None:
    body = _base(
        _h1(f"Bem-vindo ao BASSLINE, {name}! 🎛️")
        + _p("Sua conta foi criada. Você tem <strong>30 dias grátis</strong> para explorar todas as funcionalidades.")
        + _p("Complete seu perfil agora e comece a usar.")
        + _btn(f"{frontend_url}/auth/login", "Acessar minha conta")
    )
    _send(to, "Bem-vindo ao BASSLINE — 30 dias grátis", body)


def send_new_booking_to_dj(
    dj_email: str,
    dj_name: str,
    club_name: str,
    event_name: str,
    event_date: str,
    fee: Optional[str],
    frontend_url: str,
) -> None:
    fee_str = f"R$ {fee}" if fee else "A combinar"
    body = _base(
        _badge("Nova proposta recebida")
        + _h1(f"Você recebeu uma proposta de {club_name}")
        + _p(f"Olá, {dj_name}! O club <strong>{club_name}</strong> quer te contratar.")
        + _info_table(
            _info_row("Evento", event_name),
            _info_row("Data", event_date),
            _info_row("Cachê proposto", fee_str),
        )
        + _p("Acesse o dashboard para aceitar, recusar ou negociar.")
        + _btn(f"{frontend_url}/dashboard/dj", "Ver proposta")
    )
    _send(dj_email, f"Nova proposta: {event_name} — {club_name}", body)


def send_booking_approved_to_club(
    club_email: str,
    club_name: str,
    dj_name: str,
    event_name: str,
    event_date: str,
    frontend_url: str,
) -> None:
    body = _base(
        _badge("Proposta aprovada", "#22c55e", "rgba(34,197,94,0.15)")
        + _h1(f"{dj_name} aceitou sua proposta!")
        + _p(f"Olá, {club_name}! Ótima notícia — o DJ <strong>{dj_name}</strong> confirmou sua proposta.")
        + _info_table(
            _info_row("Evento", event_name),
            _info_row("Data", event_date),
            _info_row("Status", "✅ Confirmado"),
        )
        + _p("O show está marcado. Acompanhe os detalhes no seu dashboard.")
        + _btn(f"{frontend_url}/dashboard/club", "Ver no dashboard")
    )
    _send(club_email, f"✅ Confirmado: {dj_name} para {event_name}", body)


def send_booking_refused_to_club(
    club_email: str,
    club_name: str,
    dj_name: str,
    event_name: str,
    reason: Optional[str],
    frontend_url: str,
) -> None:
    reason_block = _p(f"<em>Motivo: {reason}</em>") if reason else ""
    body = _base(
        _badge("Proposta recusada", "#ef4444", "rgba(239,68,68,0.12)")
        + _h1(f"{dj_name} recusou sua proposta")
        + _p(f"Olá, {club_name}. O DJ <strong>{dj_name}</strong> não pôde aceitar a proposta para <strong>{event_name}</strong>.")
        + reason_block
        + _p("Não desanime — há muitos outros DJs disponíveis na plataforma.")
        + _btn(f"{frontend_url}/dashboard/club", "Buscar outro DJ")
    )
    _send(club_email, f"Proposta recusada: {event_name}", body)


def send_booking_negotiating_to_club(
    club_email: str,
    club_name: str,
    dj_name: str,
    event_name: str,
    frontend_url: str,
) -> None:
    body = _base(
        _badge("Em negociação", "#f59e0b", "rgba(245,158,11,0.12)")
        + _h1(f"{dj_name} quer negociar")
        + _p(f"Olá, {club_name}! O DJ <strong>{dj_name}</strong> marcou a proposta de <strong>{event_name}</strong> como em negociação.")
        + _p("Acesse o chat para conversar e fechar os detalhes.")
        + _btn(f"{frontend_url}/dashboard/club", "Abrir chat")
    )
    _send(club_email, f"💬 {dj_name} quer negociar — {event_name}", body)


def send_booking_canceled(
    to_email: str,
    to_name: str,
    canceled_by: str,
    event_name: str,
    reason: Optional[str],
    frontend_url: str,
) -> None:
    reason_block = _p(f"<em>Motivo: {reason}</em>") if reason else ""
    body = _base(
        _badge("Proposta cancelada", "#6b7280", "rgba(107,114,128,0.12)")
        + _h1(f"A proposta foi cancelada")
        + _p(f"Olá, {to_name}. A proposta para <strong>{event_name}</strong> foi cancelada por <strong>{canceled_by}</strong>.")
        + reason_block
        + _btn(frontend_url, "Acessar plataforma")
    )
    _send(to_email, f"Proposta cancelada: {event_name}", body)
