#!/usr/bin/env python3
"""CLI script to safely create an admin user for the SMDPVC dashboard.

This script should be run from the backend directory:
    python -m scripts.create_admin

Environment variables:
    ADMIN_EMAIL: Email address for the admin user (required if not provided via stdin)
    ADMIN_PASSWORD: Password for the admin user (required if not provided via stdin)
    SECRET_KEY: JWT secret key (required for the app to work)
    DATABASE_URL: Database URL (optional, uses default if not set)

Usage:
    # Interactive mode (prompts for email and password)
    python -m scripts.create_admin

    # Using environment variables
    export ADMIN_EMAIL="admin@school.edu"
    export ADMIN_PASSWORD="secure_password_here"
    python -m scripts.create_admin
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.exc import IntegrityError

from app.database import SessionFactory
from app.models.admin import AdminUser
from app.services.auth_service import hash_password


async def create_admin() -> None:
    """Create a new admin user in the database."""

    # Get email from environment or prompt user
    email = os.environ.get("ADMIN_EMAIL", "").strip()
    if not email:
        try:
            email = input("Enter admin email address: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nOperation cancelled.")
            sys.exit(1)

    if not email or "@" not in email:
        print("Error: Invalid email address provided.")
        sys.exit(1)

    # Get password from environment or prompt user
    password = os.environ.get("ADMIN_PASSWORD", "").strip()
    if not password:
        try:
            import getpass
            password = getpass.getpass("Enter admin password: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nOperation cancelled.")
            sys.exit(1)

    if not password or len(password) < 8:
        print("Error: Password must be at least 8 characters long.")
        sys.exit(1)

    # Confirm password if not from environment
    if not os.environ.get("ADMIN_PASSWORD"):
        try:
            import getpass
            password_confirm = getpass.getpass("Confirm password: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nOperation cancelled.")
            sys.exit(1)

        if password != password_confirm:
            print("Error: Passwords do not match.")
            sys.exit(1)

    # Create the admin user
    password_hash = hash_password(password)
    admin_user = AdminUser(
        email=email,
        password_hash=password_hash,
        is_active=True,
    )

    async with SessionFactory() as session:
        try:
            session.add(admin_user)
            await session.commit()
            print(f"\nSuccess! Admin user created with email: {email}")
            print(f"Admin ID: {admin_user.id}")
            print("\nThe admin can now login using these credentials.")
        except IntegrityError:
            await session.rollback()
            print(f"Error: An admin user with email '{email}' already exists.")
            sys.exit(1)
        except Exception as e:
            await session.rollback()
            print(f"Error creating admin user: {e}")
            sys.exit(1)


def main() -> None:
    """Entry point for the CLI script."""

    # Check for required environment variables
    if not os.environ.get("SECRET_KEY"):
        print("Error: SECRET_KEY environment variable is not set.")
        print("Please set SECRET_KEY before running this script:")
        print("  export SECRET_KEY='your-secure-secret-key-here'")
        sys.exit(1)

    print("SMDPVC Admin User Creation Tool")
    print("=" * 40)

    try:
        asyncio.run(create_admin())
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
