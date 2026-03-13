"""Behave environment configuration for 1A2B game benchmark tests.

Provides test infrastructure for FastAPI API testing and SQLAlchemy database
assertions. Hooks ensure proper test isolation between scenarios.

This file replaces pytest's conftest.py in the Behave framework.
"""

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


def before_all(context):
    # Future: Load global configuration, initialize shared resources
    pass


def before_scenario(context, scenario):
    """Implements the Behave Context Contract for benchmark tests.

    Note:
        Provides context attributes for step definitions:
        - client (TestClient): FastAPI test client for API calls
        - db_session (Session): In-memory SQLite session for database assertions
        - last_response (Optional[Response]): Stores last API response for Then steps
        - table: Auto-provided by Behave for datatable access
    """
    # Import here to avoid circular dependencies and allow app to be mocked
    from app import database
    from app.main import app
    from app.models import Base

    # Using :memory: with StaticPool ensures thread-safe access
    # StaticPool keeps a single connection shared across threads
    # This is critical for FastAPI TestClient which runs in a thread pool
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create all tables in the test database
    Base.metadata.create_all(bind=engine)

    # Override the app's database dependency to use our test database
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[database.get_db] = override_get_db

    context.client = TestClient(app)
    context.db_session = TestingSessionLocal()
    context._db_engine = engine
    context.last_response = None


def after_scenario(context, scenario):
    if hasattr(context, "db_session"):
        try:
            context.db_session.close()
        except Exception:
            pass  # Best-effort cleanup

    if hasattr(context, "_db_engine"):
        try:
            context._db_engine.dispose()
        except Exception:
            pass  # Best-effort cleanup; memory DB is ephemeral anyway

    context.last_response = None


def after_all(context):
    # Future: Clean up global resources, close connections
    pass
