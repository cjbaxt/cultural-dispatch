#!/usr/bin/env python3
"""
Dump the local cultural_dispatch Postgres DB to static JSON files.
Run this before committing to publish new data to GitHub Pages.

  python scripts/dump_to_json.py
"""

import json
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from sqlmodel import Session, create_engine, select
from app.models.post import Post

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://clairebaxter@localhost:5432/cultural_dispatch"
)

OUT = Path(__file__).parent.parent / "frontend" / "public" / "data"


def write(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, default=str, ensure_ascii=False, indent=None), encoding="utf-8")
    print(f"  {path.relative_to(OUT.parent.parent)}")


def dump_post(p: Post) -> dict:
    return {
        "id": str(p.id),
        "slug": p.slug,
        "title": p.title,
        "type": p.type,
        "status": p.status,
        "excerpt": p.excerpt,
        "body": p.body,
        "related_event_urls": json.loads(p.related_event_urls or "[]"),
        "lead_image": p.lead_image,
        "is_forever_draft": p.is_forever_draft or False,
        "featured": p.featured or False,
        "parent_slug": p.parent_slug,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


def main():
    engine = create_engine(DATABASE_URL)

    with Session(engine) as s:
        posts = s.exec(
            select(Post).where(Post.status == "published").order_by(Post.created_at.desc())
        ).all()

        print("Posts list…")
        write(OUT / "posts.json", [dump_post(p) for p in posts])

        print("Post details…")
        for p in posts:
            write(OUT / "posts" / f"{p.slug}.json", dump_post(p))

    print(f"\nDone. {len(posts)} published posts dumped to {OUT}")


if __name__ == "__main__":
    main()
