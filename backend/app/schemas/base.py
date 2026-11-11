from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)


class EntityRead(Schema):
    id: UUID
    created_at: datetime
    updated_at: datetime
