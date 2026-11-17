import asyncio
import uuid
from datetime import datetime
from app.database import engine
from app.models.content import Alumni
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, insert

async def reset_and_add_alumni():
    # First clear existing alumni for a clean test
    async with AsyncSession(engine) as session:
        await session.execute(delete(Alumni))
        await session.commit()
        print("✓ Cleared existing alumni records")

    # Add fresh test data with varied information
    test_alumni = [
        {
            "id": uuid.uuid4(),
            "name": "Rahul Saxena",
            "batch_year": "2023",
            "description": "JEE Advanced 1234 rank, Currently at IIT Delhi pursuing Computer Science with AI focus",
            "display_order": 1,
            "is_published": True,
            "media_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "id": uuid.uuid4(),
            "name": "Priya Krishnan",
            "batch_year": "2023",
            "description": "NEET 99.5 percentile, Medical student at AIIMS Delhi. Aspiring pediatrician",
            "display_order": 2,
            "is_published": True,
            "media_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "id": uuid.uuid4(),
            "name": "Arjun Khanna",
            "batch_year": "2022",
            "description": "Founder of EduTech startup, 100K+ students served. Former NSUI President",
            "display_order": 3,
            "is_published": True,
            "media_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "id": uuid.uuid4(),
            "name": "Sneha Deshmukh",
            "batch_year": "2022",
            "description": "Published author with 2 novels, TED speaker on education. Literary award winner",
            "display_order": 4,
            "is_published": True,
            "media_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "id": uuid.uuid4(),
            "name": "Vikram Patel",
            "batch_year": "2021",
            "description": "Professional cricketer, state team captain. Training for national selection",
            "display_order": 5,
            "is_published": True,
            "media_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "id": uuid.uuid4(),
            "name": "Anjali Verma",
            "batch_year": "2021",
            "description": "Award-winning journalist with BBC, Al Jazeera. Investigative reporter",
            "display_order": 6,
            "is_published": True,
            "media_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "id": uuid.uuid4(),
            "name": "Zainab Khan",
            "batch_year": "2020",
            "description": "Doctoral researcher in Biotechnology, 5+ publications. Working on cancer therapy",
            "display_order": 7,
            "is_published": True,
            "media_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
        {
            "id": uuid.uuid4(),
            "name": "Rohit Nair",
            "batch_year": "2020",
            "description": "Corporate executive at Fortune 500 company. Leadership development mentor",
            "display_order": 8,
            "is_published": False,
            "media_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        },
    ]

    async with AsyncSession(engine) as session:
        for alum in test_alumni:
            await session.execute(insert(Alumni).values(**alum))
        await session.commit()
        print(f"✓ Added {len(test_alumni)} test alumni records")

        # Verify they were saved
        result = await session.execute(select(Alumni).where(Alumni.is_published == True))
        published = result.scalars().all()
        print(f"✓ Confirmed {len(published)} published alumni in database")
        for alum in published:
            print(f"  - {alum.name} (Batch {alum.batch_year})")

asyncio.run(reset_and_add_alumni())
