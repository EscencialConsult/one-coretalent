"""Envío de correos vía la API HTTP de Brevo. Best-effort: si no está configurado, no rompe nada.

Se usa vía FastAPI BackgroundTasks para no demorar la respuesta del request. Se manda por HTTPS
(puerto 443) y no por SMTP porque Railway (y varios hostings tipo PaaS) bloquean o no rutean bien
los puertos SMTP salientes (25/465/587) — confirmado en producción con un TimeoutError real.
"""
from __future__ import annotations

import logging
from html import escape

import httpx

from app.core.config import settings

logger = logging.getLogger("app.email")

_BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


async def enviar_email(to: str, subject: str, html: str, from_name: str | None = None) -> bool:
    """Envía un correo HTML. Devuelve True si se envió, False si está deshabilitado o falló."""
    if not settings.email_habilitado:
        print(f"[email] Brevo no configurado; se omite el correo '{subject}' a {to}", flush=True)
        logger.warning("Brevo no configurado; se omite el correo '%s' a %s", subject, to)
        return False

    from_addr = settings.SMTP_FROM
    # El NOMBRE visible puede ser el de cada empresa (white-label); la DIRECCIÓN
    # es siempre la verificada en Brevo → escala a muchas empresas sin config extra.
    nombre = from_name or settings.SMTP_FROM_NAME
    payload = {
        "sender": {"name": nombre, "email": from_addr},
        "to": [{"email": to}],
        "subject": subject,
        "htmlContent": html,
    }
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                _BREVO_API_URL,
                json=payload,
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
            resp.raise_for_status()
        print(f"[email] Correo enviado a {to}: {subject}", flush=True)
        logger.info("Correo enviado a %s: %s", to, subject)
        return True
    except Exception as e:  # noqa: BLE001
        # print(..., flush=True) además del logger: por las dudas de que el handler del
        # logger no quede visible en los logs del hosting (ya pasó una vez).
        detalle = e.response.text if isinstance(e, httpx.HTTPStatusError) else repr(e)
        print(f"[email] ERROR enviando correo a {to}: {detalle}", flush=True)
        logger.error("Error enviando correo a %s: %s", to, detalle)
        return False


# ── Plantilla base ────────────────────────────────────────────────────────────
def _plantilla(marca: dict, titulo: str, cuerpo_html: str, cta_texto: str, cta_link: str, pie: str | None = None) -> str:
    razon = escape(marca.get("razon_social") or "ONE Core Analytics")
    c1 = marca.get("color_acento") or "#4d248f"
    c2 = marca.get("color_secundario") or "#6be1e3"
    logo = marca.get("logo_url") or ""
    # En correos, las imágenes data: base64 suelen bloquearse → solo usamos logos con URL http.
    cabecera = (
        f'<img src="{escape(logo)}" alt="{razon}" style="max-height:44px;max-width:200px;">'
        if logo.startswith("http")
        else f'<span style="color:#fff;font-size:20px;font-weight:800;">{razon}</span>'
    )
    return f"""\
<!DOCTYPE html>
<html lang="es"><body style="margin:0;background:#f4f4f7;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#1a181d;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px -12px rgba(0,0,0,.18);">
      <div style="background:linear-gradient(135deg,{c1},{c2});padding:26px 28px;">{cabecera}</div>
      <div style="padding:28px;">
        <h1 style="font-size:20px;margin:0 0 14px;">{titulo}</h1>
        {cuerpo_html}
        <div style="text-align:center;margin:26px 0 8px;">
          <a href="{escape(cta_link)}" style="display:inline-block;background:{c1};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:11px;">{escape(cta_texto)}</a>
        </div>
        <p style="font-size:12px;color:#8a8f9c;margin-top:18px;line-height:1.5;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br><span style="color:{c1};word-break:break-all;">{escape(cta_link)}</span></p>
      </div>
    </div>
    <p style="text-align:center;font-size:11.5px;color:#a4a8c0;margin-top:16px;">{escape(pie) if pie else f'Enviado por {razon} · ONE Core Analytics'}</p>
  </div>
</body></html>"""


def _caja_credenciales(c1: str, email: str, password: str, extra_label: str = "") -> str:
    return f"""\
<div style="background:#f7f7fb;border:1px solid #e6e7ee;border-radius:12px;padding:16px 18px;margin:6px 0 4px;">
  {f'<div style="font-size:12px;color:#8a8f9c;margin-bottom:10px;">{escape(extra_label)}</div>' if extra_label else ''}
  <div style="font-size:13px;margin-bottom:8px;"><span style="color:#8a8f9c;">Usuario:</span> <b>{escape(email)}</b></div>
  <div style="font-size:13px;"><span style="color:#8a8f9c;">Contraseña:</span> <b style="color:{c1};font-family:monospace;font-size:15px;">{escape(password)}</b></div>
</div>"""


# ── Correos concretos ─────────────────────────────────────────────────────────
async def enviar_bienvenida_empresa(marca: dict, email: str, password: str, link: str) -> bool:
    # Este correo lo envía ONE (no la empresa): usa SIEMPRE la marca ONE Core Analytics,
    # no la de la empresa. (El resto de los correos —evaluados, evaluadores 360°— sí van con
    # la marca de cada empresa.)
    nombre_empresa = escape(marca.get("razon_social") or "tu empresa")
    marca_one = {
        "razon_social": "ONE Core Analytics",
        "color_acento": "#4d248f",
        "color_secundario": "#6be1e3",
        "logo_url": f"{settings.PUBLIC_BASE_URL.rstrip('/')}/logo.png",
    }
    c1 = marca_one["color_acento"]
    cuerpo = (
        f'<p style="font-size:14.5px;line-height:1.6;">Hola, equipo <b>{nombre_empresa}</b>:</p>'
        '<p style="font-size:14.5px;line-height:1.6;">Les damos la bienvenida a <b>ONE Core Analytics</b>, su nuevo entorno '
        'centralizado para la evaluación de talento y procesos organizacionales.</p>'
        '<p style="font-size:14.5px;line-height:1.6;">Su espacio de administración exclusivo ya está configurado y activo. '
        'Desde este panel podrán gestionar candidatos, asignar baterías de pruebas, implementar evaluaciones 360º y acceder a '
        'informes automatizados con base en evidencia.</p>'
        f'{_caja_credenciales(c1, email, password, "Sus datos de acceso:")}'
        '<p style="font-size:12.5px;color:#8a8f9c;margin-top:10px;">Les recomendamos cambiar la contraseña después del primer ingreso.</p>'
    )
    html = _plantilla(
        marca_one, "Bienvenida a ONE Core Analytics", cuerpo, "Ingresar al panel", link,
        pie="Equipo de ONE Core Analytics",
    )
    return await enviar_email(
        email,
        f"ONE Core Analytics — Credenciales de acceso para {marca.get('razon_social') or 'tu empresa'}",
        html,
        from_name="ONE Core Analytics",
    )


async def enviar_nuevas_credenciales_empresa(email: str, password: str, link: str) -> bool:
    # Reenvío de credenciales desde ONE: nueva contraseña, MISMO usuario y MISMO link.
    marca_one = {
        "razon_social": "ONE Core Analytics",
        "color_acento": "#4d248f",
        "color_secundario": "#6be1e3",
        "logo_url": f"{settings.PUBLIC_BASE_URL.rstrip('/')}/logo.png",
    }
    c1 = marca_one["color_acento"]
    cuerpo = (
        '<p style="font-size:14.5px;line-height:1.6;">Generamos una <b>nueva contraseña</b> para el acceso a su panel en '
        '<b>ONE Core Analytics</b>. El usuario y el enlace de acceso no cambian; ingresen con la contraseña que figura abajo.</p>'
        f'{_caja_credenciales(c1, email, password, "Sus datos de acceso:")}'
        '<p style="font-size:12.5px;color:#8a8f9c;margin-top:10px;">Por seguridad, les recomendamos cambiar la contraseña '
        'después de ingresar, desde <b>Configuración</b> en su panel.</p>'
    )
    html = _plantilla(
        marca_one, "Nuevas credenciales de acceso", cuerpo, "Ingresar al panel", link,
        pie="Equipo de ONE Core Analytics",
    )
    return await enviar_email(email, "Nuevas credenciales - ONE Core Analytics", html, from_name="ONE Core Analytics")


async def enviar_recuperacion_password(email: str, link: str, marca: dict | None = None) -> bool:
    """Link de recuperación (1 uso, expira) — para Usuario (admin) o Persona (candidato)."""
    marca = marca or {
        "razon_social": "AdRHA",
        "color_acento": "#B4272D",
        "color_secundario": "#4FADD1",
        "logo_url": f"{settings.PUBLIC_BASE_URL.rstrip('/')}/iconadhracompletocolor.png",
    }
    cuerpo = (
        '<p style="font-size:14.5px;line-height:1.6;">Recibimos una solicitud para restablecer tu contraseña.</p>'
        '<p style="font-size:14.5px;line-height:1.6;">Si fuiste vos, hacé clic en el botón de abajo para elegir una nueva. '
        'El enlace vale por <b>1 hora</b> y solo se puede usar una vez.</p>'
        '<p style="font-size:12.5px;color:#8a8f9c;margin-top:10px;">Si no fuiste vos, ignorá este correo: tu contraseña actual sigue funcionando.</p>'
    )
    html = _plantilla(marca, "Restablecer tu contraseña", cuerpo, "Elegir nueva contraseña", link)
    return await enviar_email(email, "Restablecer contraseña — ONE Core Analytics", html, from_name=marca.get("razon_social"))


async def enviar_invitacion_evaluado(marca: dict, nombre: str, email: str, password: str, link: str) -> bool:
    c1 = marca.get("color_acento") or "#B4272D"
    razon = escape(marca.get("razon_social") or "la empresa")
    cuerpo = (
        f'<p style="font-size:14.5px;line-height:1.6;">Hola {escape(nombre)}, <b>{razon}</b> te invitó a realizar una evaluación en línea. '
        'Ingresá con estos datos y completá las pruebas que tengas asignadas. No hay respuestas correctas ni incorrectas.</p>'
        f'{_caja_credenciales(c1, email, password, "Tus datos de acceso:")}'
    )
    html = _plantilla(marca, "Tenés una evaluación pendiente", cuerpo, "Comenzar la evaluación", link)
    remitente = marca.get("razon_social") or settings.SMTP_FROM_NAME
    return await enviar_email(email, f"Invitación a tu evaluación · {marca.get('razon_social') or 'ONE Core Analytics'}", html, from_name=remitente)


async def enviar_notificacion_vacante(marca: dict, nombre: str, email: str, vacante_puesto: str, link: str) -> bool:
    """Aviso de match automático a un candidato (motor de matching, ver app/core/matching.py)."""
    razon = escape(marca.get("razon_social") or "una empresa")
    cuerpo = (
        f'<p style="font-size:14.5px;line-height:1.6;">Hola {escape(nombre)}, tu perfil coincide con una '
        f'búsqueda activa de <b>{razon}</b>: <b>{escape(vacante_puesto)}</b>.</p>'
        '<p style="font-size:13.5px;line-height:1.6;color:#555;">Podés revisar los detalles y confirmar tu postulación desde el enlace.</p>'
    )
    html = _plantilla(marca, "Hay una búsqueda que puede interesarte", cuerpo, "Ver la búsqueda", link)
    remitente = marca.get("razon_social") or settings.SMTP_FROM_NAME
    return await enviar_email(email, f"Nueva oportunidad: {vacante_puesto} · {razon}", html, from_name=remitente)


async def enviar_invitacion_evaluador360(
    marca: dict, email: str, evaluador: str, sujeto: str, tipo_texto: str, link: str
) -> bool:
    razon = escape(marca.get("razon_social") or "la empresa")
    cuerpo = (
        f'<p style="font-size:14.5px;line-height:1.6;">Hola {escape(evaluador)}, <b>{razon}</b> te invitó a participar de una '
        f'<b>{escape(tipo_texto)}</b> sobre <b>{escape(sujeto)}</b>. Solo te va a llevar unos minutos.</p>'
        '<p style="font-size:13.5px;line-height:1.6;color:#555;">No hay respuestas correctas ni incorrectas: se valoran percepciones y comportamientos. '
        'Tus respuestas se procesan de forma <b>confidencial y promediada</b>.</p>'
    )
    html = _plantilla(marca, "Te invitaron a una evaluación", cuerpo, "Responder la evaluación", link)
    remitente = marca.get("razon_social") or settings.SMTP_FROM_NAME
    return await enviar_email(
        email, f"Invitación a una evaluación · {marca.get('razon_social') or 'ONE Core Analytics'}", html, from_name=remitente,
    )
