from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Gig Platform API"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    DATABASE_URL: str
    FRONTEND_URL: str = "http://localhost:3000"

    # URL pública do backend (usada para montar URLs de arquivos)
    # Ex local: http://localhost:8001
    # Ex Railway: https://bassline-api.railway.app
    API_BASE_URL: str = "http://localhost:8001"

    # Stripe — cole as chaves do dashboard stripe.com
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_DJ_PRO_PRICE_ID: str = ""
    STRIPE_CLUB_PRO_PRICE_ID: str = ""

    # Resend — https://resend.com (grátis até 3000 emails/mês)
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "BASSLINE <no-reply@bassline.app>"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()