from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "ops@yourdomain.com"
    SECRET_KEY: str = "dev-secret-key"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()
