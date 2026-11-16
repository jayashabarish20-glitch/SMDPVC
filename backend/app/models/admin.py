from sqlalchemy import Boolean, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.associations import admin_user_roles, role_permissions
from app.models.base import Base, TimestampMixin, UUIDPrimaryKey


class AdminUser(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "admin_users"
    __table_args__ = (Index("ix_admin_users_is_active", "is_active"),)

    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    roles: Mapped[list["Role"]] = relationship(
        secondary=admin_user_roles,
        back_populates="users",
        lazy="selectin",
    )


class Role(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)

    users: Mapped[list[AdminUser]] = relationship(
        secondary=admin_user_roles,
        back_populates="roles",
    )
    permissions: Mapped[list["Permission"]] = relationship(
        secondary=role_permissions,
        back_populates="roles",
        lazy="selectin",
    )


class Permission(UUIDPrimaryKey, TimestampMixin, Base):
    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)

    roles: Mapped[list[Role]] = relationship(
        secondary=role_permissions,
        back_populates="permissions",
    )
