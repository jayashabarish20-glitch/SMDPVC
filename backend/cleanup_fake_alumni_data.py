"""
Cleanup script to remove fake alumni test data from the database.

This script removes all alumni records that were added for testing purposes.
Run this after the database has been initialized.

Usage:
    python cleanup_fake_alumni_data.py --remove-all  # Remove all alumni
    python cleanup_fake_alumni_data.py              # Remove only unpublished alumni
"""
import asyncio
import sys
from app.database import engine
from app.models.content import Alumni
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select

async def cleanup_alumni(remove_all: bool = False):
    """Remove fake alumni data from the database."""
    async with AsyncSession(engine) as session:
        # Get current count
        result = await session.execute(select(Alumni))
        all_alumni = result.scalars().all()
        print(f"Current alumni records in database: {len(all_alumni)}")

        for alum in all_alumni:
            print(f"  - {alum.name} (Batch {alum.batch_year}, Published: {alum.is_published})")

        if remove_all:
            await session.execute(delete(Alumni))
            await session.commit()
            print("\n✓ Removed ALL alumni records")
        else:
            # Only remove unpublished records (likely test data)
            stmt = delete(Alumni).where(Alumni.is_published == False)
            result = await session.execute(stmt)
            await session.commit()
            print(f"\n✓ Removed {result.rowcount} unpublished alumni records")

        # Verify cleanup
        result = await session.execute(select(Alumni))
        remaining = result.scalars().all()
        print(f"Remaining alumni records: {len(remaining)}")
        for alum in remaining:
            print(f"  - {alum.name} (Batch {alum.batch_year})")

if __name__ == "__main__":
    remove_all = "--remove-all" in sys.argv
    if remove_all:
        print("WARNING: This will remove ALL alumni records from the database!")
        confirm = input("Continue? (yes/no): ")
        if confirm.lower() != "yes":
            print("Cancelled.")
            sys.exit(0)

    asyncio.run(cleanup_alumni(remove_all=remove_all))
