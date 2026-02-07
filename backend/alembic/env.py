from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.models import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Swap asyncpg to psycopg2 for sync Alembic migrations
sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
# asyncpg uses ssl=require, psycopg2 uses sslmode=require
sync_url = sync_url.replace("?ssl=require", "?sslmode=require")
sync_url = sync_url.replace("&ssl=require", "&sslmode=require")
# Use direct endpoint for migrations (pooler/PgBouncer can hang on DDL)
sync_url = sync_url.replace("-pooler.", ".")
# Add connect timeout so migrations don't hang indefinitely
if "?" in sync_url:
    sync_url += "&connect_timeout=10"
else:
    sync_url += "?connect_timeout=10"
config.set_main_option("sqlalchemy.url", sync_url)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
