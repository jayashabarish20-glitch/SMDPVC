import importlib.util
from pathlib import Path
from types import ModuleType

from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect

from app.models import Base


def load_revision(path: Path) -> ModuleType:
    spec = importlib.util.spec_from_file_location(path.stem, path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_migration_chain_matches_models_and_downgrades_cleanly() -> None:
    version_dir = Path(__file__).parents[1] / "alembic" / "versions"
    revisions = [
        load_revision(path)
        for path in sorted(version_dir.glob("*.py"))
    ]
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        for revision in revisions:
            context = MigrationContext.configure(connection)
            with Operations.context(context):
                revision.upgrade()

        diff = compare_metadata(
            MigrationContext.configure(connection),
            Base.metadata,
        )
        assert diff == []

        for revision in reversed(revisions):
            context = MigrationContext.configure(connection)
            with Operations.context(context):
                revision.downgrade()

        assert inspect(connection).get_table_names() == []
