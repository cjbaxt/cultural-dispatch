import json
import re
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import get_session
from app.models.post import Post

router = APIRouter(prefix="/api/posts", tags=["posts"])


def slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")


class PostIn(BaseModel):
    title: str
    type: str
    status: str = "draft"
    excerpt: Optional[str] = None
    body: str = ""
    related_event_urls: list[str] = []
    slug: Optional[str] = None
    created_at: Optional[datetime] = None


class PostOut(BaseModel):
    id: UUID
    slug: str
    title: str
    type: str
    status: str
    excerpt: Optional[str]
    body: str
    related_event_urls: list[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm(cls, p: Post) -> "PostOut":
        return cls(
            id=p.id,
            slug=p.slug,
            title=p.title,
            type=p.type,
            status=p.status,
            excerpt=p.excerpt,
            body=p.body,
            related_event_urls=json.loads(p.related_event_urls or "[]"),
            created_at=p.created_at,
            updated_at=p.updated_at,
        )


@router.get("", response_model=list[PostOut])
def list_posts(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    stmt = select(Post).order_by(Post.created_at.desc())
    posts = session.exec(stmt).all()
    if status:
        posts = [p for p in posts if p.status == status]
    if type:
        posts = [p for p in posts if p.type == type]
    return [PostOut.from_orm(p) for p in posts]


@router.post("", response_model=PostOut, status_code=201)
def create_post(data: PostIn, session: Session = Depends(get_session)):
    slug = data.slug or slugify(data.title)
    # Ensure unique slug
    existing = session.exec(select(Post).where(Post.slug == slug)).first()
    if existing:
        slug = f"{slug}-{int(datetime.now(timezone.utc).timestamp())}"
    now = datetime.now(timezone.utc)
    post = Post(
        slug=slug,
        title=data.title,
        type=data.type,
        status=data.status,
        excerpt=data.excerpt,
        body=data.body,
        related_event_urls=json.dumps(data.related_event_urls),
        created_at=data.created_at or now,
        updated_at=data.created_at or now,
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    return PostOut.from_orm(post)


@router.get("/{slug}", response_model=PostOut)
def get_post(slug: str, session: Session = Depends(get_session)):
    post = session.exec(select(Post).where(Post.slug == slug)).first()
    if not post:
        raise HTTPException(404, "Post not found")
    return PostOut.from_orm(post)


@router.patch("/{slug}", response_model=PostOut)
def update_post(slug: str, data: PostIn, session: Session = Depends(get_session)):
    post = session.exec(select(Post).where(Post.slug == slug)).first()
    if not post:
        raise HTTPException(404, "Post not found")
    post.title = data.title
    post.type = data.type
    post.status = data.status
    post.excerpt = data.excerpt
    post.body = data.body
    post.related_event_urls = json.dumps(data.related_event_urls)
    post.updated_at = datetime.now(timezone.utc)
    if data.created_at:
        post.created_at = data.created_at
    if data.slug and data.slug != slug:
        post.slug = data.slug
    session.add(post)
    session.commit()
    session.refresh(post)
    return PostOut.from_orm(post)


@router.delete("/{slug}", status_code=204)
def delete_post(slug: str, session: Session = Depends(get_session)):
    post = session.exec(select(Post).where(Post.slug == slug)).first()
    if not post:
        raise HTTPException(404, "Post not found")
    session.delete(post)
    session.commit()
