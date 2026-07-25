"""Configuración central de la aplicación (lee variables de entorno / .env)."""
from __future__ import annotations

from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    # Opcional: rol con privilegios DDL para Alembic (CREATE POLICY, ALTER TABLE...).
    # Si está vacío, Alembic usa DATABASE_URL. Necesario cuando DATABASE_URL apunta a un rol
    # de runtime sin BYPASSRLS (ver Row Level Security en db.py) — ese rol no puede correr migraciones.
    DATABASE_URL_MIGRATIONS: str = ""
    SECRET_KEY: str = "change-me-in-prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALGORITHM: str = "HS256"
    ENV: str = "dev"
    CORS_ORIGINS: str = "http://localhost:5173"
    # Conexión a Render desde fuera requiere SSL. Para un Postgres local sin SSL, poné DB_SSL=false.
    DB_SSL: bool = True

    # ── Correo (SMTP) ─────────────────────────────────────────────────────────
    # Si SMTP_HOST está vacío, el envío de correos queda deshabilitado (no rompe nada).
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""            # remitente (ej. no-reply@escencial.com); si vacío usa SMTP_USER
    SMTP_FROM_NAME: str = "ONE Core Analytics"
    SMTP_STARTTLS: bool = True     # True para puerto 587; False + SMTP_SSL para 465

    # ── IA (OpenAI) — informes gerenciales consolidados (Módulo 05) ───────────
    # La IA solo REDACTA sobre resultados ya calculados; nunca calcula resultados.
    # Si OPENAI_API_KEY está vacío, la generación queda deshabilitada (no rompe nada).
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_TOKENS: int = 3500

    # ── URLs de la app (para los links de los correos) ────────────────────────
    PUBLIC_BASE_URL: str = "http://localhost:5173"  # URL principal del frontend
    TENANT_DOMAIN: str = ""       # ej. "one.com" → links tipo https://techsur.one.com (cuando el subdominio esté activo)

    # ── Supabase Storage (CVs, selfies, firmas — reemplaza Google Drive) ──────
    # service_role: server-side ÚNICAMENTE, nunca se expone al navegador (salta RLS de Storage).
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    @model_validator(mode="after")
    def validar_produccion(self) -> "Settings":
        if self.ENV.lower() != "prod":
            return self
        secretos_inseguros = {
            "change-me-in-prod",
            "cambia-esto-por-una-clave-larga-y-secreta",
        }
        if self.SECRET_KEY in secretos_inseguros or len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY debe ser aleatoria y tener al menos 32 caracteres en producción")
        if "*" in self.cors_origins_list:
            raise ValueError("CORS_ORIGINS no puede contener '*' en producción")
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def email_habilitado(self) -> bool:
        return bool(self.SMTP_HOST.strip())

    @property
    def ia_habilitada(self) -> bool:
        return bool(self.OPENAI_API_KEY.strip())

    @property
    def storage_habilitado(self) -> bool:
        return bool(self.SUPABASE_URL.strip() and self.SUPABASE_SERVICE_ROLE_KEY.strip())

    def url_empresa(self, subdominio: str) -> str:
        """Link de acceso brandeado del admin de una empresa (subdominio si está activo)."""
        if self.TENANT_DOMAIN.strip():
            return f"https://{subdominio}.{self.TENANT_DOMAIN.strip()}"
        return f"{self.PUBLIC_BASE_URL.rstrip('/')}/acceso/{subdominio}"

    def url_evaluado(self, subdominio: str) -> str:
        """Link de acceso brandeado del portal del evaluado."""
        if self.TENANT_DOMAIN.strip():
            return f"https://{subdominio}.{self.TENANT_DOMAIN.strip()}/evaluado"
        return f"{self.PUBLIC_BASE_URL.rstrip('/')}/acceso/{subdominio}/evaluado"

    def url_eval(self, token: str) -> str:
        """Link público para responder una campaña de evaluación (por token)."""
        return f"{self.PUBLIC_BASE_URL.rstrip('/')}/eval/{token}"

    def _base_url(self, raw: str | None = None) -> str:
        # Render a veces entrega 'postgres://'; SQLAlchemy requiere 'postgresql://'.
        url = raw if raw is not None else self.DATABASE_URL
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        return url

    @property
    def async_database_url(self) -> str:
        """URL para asyncpg (app, en runtime). El SSL se maneja por connect_args, no en la query."""
        parts = urlsplit(self._base_url().replace("postgresql://", "postgresql+asyncpg://", 1))
        query = [(k, v) for k, v in parse_qsl(parts.query) if k != "sslmode"]
        return urlunsplit(parts._replace(query=urlencode(query)))

    @property
    def sync_database_url(self) -> str:
        """URL para psycopg (Alembic). Usa DATABASE_URL_MIGRATIONS si está seteada."""
        raw = self.DATABASE_URL_MIGRATIONS.strip() or self.DATABASE_URL
        parts = urlsplit(self._base_url(raw).replace("postgresql://", "postgresql+psycopg://", 1))
        query = dict(parse_qsl(parts.query))
        if self.DB_SSL:
            query.setdefault("sslmode", "require")
        return urlunsplit(parts._replace(query=urlencode(query)))


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
