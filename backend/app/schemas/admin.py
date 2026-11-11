from typing import Annotated
from uuid import UUID

from pydantic import EmailStr, Field, SecretStr

from app.schemas.base import EntityRead, Schema

class PermissionCreate(Schema):
    code: Annotated[str, Field(min_length=1, max_length=120)]
    description: str | None = None


class PermissionUpdate(Schema):
    code: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    description: str | None = None


class PermissionRead(EntityRead):
    code: str
    description: str | None


class RoleCreate(Schema):
    name: Annotated[str, Field(min_length=1, max_length=80)]
    description: str | None = None
    permission_ids: list[UUID] = Field(default_factory=list)


class RoleUpdate(Schema):
    name: Annotated[str, Field(min_length=1, max_length=80)] | None = None
    description: str | None = None
    permission_ids: list[UUID] | None = None


class RoleSummary(Schema):
    id: UUID
    name: str


class RoleRead(EntityRead):
    name: str
    description: str | None
    permissions: list[PermissionRead] = Field(default_factory=list)


class AdminUserCreate(Schema):
    email: EmailStr
    password: SecretStr
    is_active: bool = True
    role_ids: list[UUID] = Field(default_factory=list)


class AdminUserUpdate(Schema):
    email: EmailStr | None = None
    password: SecretStr | None = None
    is_active: bool | None = None
    role_ids: list[UUID] | None = None


class AdminUserRead(EntityRead):
    email: EmailStr
    is_active: bool
    roles: list[RoleSummary] = Field(default_factory=list)


__all__ = [
    "AdminUserCreate",
    "AdminUserRead",
    "AdminUserUpdate",
    "PermissionCreate",
    "PermissionRead",
    "PermissionUpdate",
    "RoleCreate",
    "RoleRead",
    "RoleSummary",
    "RoleUpdate",
]
