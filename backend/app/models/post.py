from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel
import uuid


class Post(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    slug: str = Field(unique=True, index=True)
    title: str
    type: str  # "essay" | "dispatch"
    status: str = Field(default="draft")  # "draft" | "published"
    excerpt: Optional[str] = None
    body: str = Field(default="")  # rich text HTML from Tiptap
    related_event_urls: str = Field(default="[]")  # JSON array stored as text
    lead_image: Optional[str] = None
    is_forever_draft: bool = Field(default=False)
    featured: bool = Field(default=False)
    parent_slug: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Subscriber(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
