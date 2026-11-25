"""Public knowledge retrieval for the chatbot.

Reads ONLY what the public website already shows, by calling the existing public
router functions / public service reads (same published/active filters, same
deletion-pending media hiding). No admin data, no separate hardcoded knowledge base.

Retrieval is simple structured keyword/synonym scoring (no embeddings) — enough
for the small amount of school content, and easy to reason about.
"""
import json
import logging
import re
from dataclasses import dataclass, field

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.routers import public as public_api
from app.models.content_record import ContentRecord

logger = logging.getLogger(__name__)

_RECORD_KEYS = (
    ["principal.nursery", "principal.primary", "principal.highersecondary",
     "higher-secondary.course-groups", "infrastructure.gallery"]
    + [f"{lv}.{part}.gallery" for lv in ("nursery", "primary", "higher-secondary")
       for part in ("classes", "learning", "extracurricular")]
)

PAGES: dict[str, tuple[str, str]] = {
    # level key -> (display name, public URL)
    "home": ("SMDPVC", "/"),
    "nursery": ("Nursery", "/nursery"),
    "primary": ("Primary", "/primary"),
    "higher-secondary": ("Higher Secondary", "/higher-secondary"),
}

# Public page section anchors (ids rendered by SchoolPage / home components).
_SECTION_PREFIX = {"nursery": "nursery", "primary": "primary", "higher-secondary": "higher"}
_HOME_SECTIONS = {"leadership": "leadership", "infrastructure": "infrastructure"}


def section_link(level: str, part: str, label: str) -> tuple[str, str]:
    """(url-with-anchor, friendly label) for a public page section."""
    if level == "home":
        anchor = _HOME_SECTIONS.get(part)
        return (f"/#{anchor}" if anchor else "/"), label
    name, url = PAGES[level]
    return f"{url}#{_SECTION_PREFIX[level]}-{part}", f"{name} · {label}"


MAX_DOC_CHARS = 1200
MAX_CONTEXT_CHARS = 8000
MAX_DOCS = 6

# topic -> trigger terms. Latin terms match whole words; Tamil terms match as substrings
# (Tamil words take suffixes, e.g. விளையாட்டுகள்).
TOPIC_TERMS: dict[str, set[str]] = {
    "about": {"overview", "history", "vision", "mission", "introduction", "வரலாறு"},
    "principal": {"principal", "headmaster", "headmistress", "hm", "head", "முதல்வர்",
                  "தலைமை", "தலைமையாசிரியர்", "ப்ரின்சிபல்"},
    "leadership": {"management", "leader", "leaders", "leadership", "correspondent", "chairman",
                   "director", "secretary", "founder", "trustee", "நிர்வாக", "தாளாளர்"},
    "courses": {"course", "courses", "group", "groups", "stream", "streams", "subject", "subjects",
                "combination", "bio", "biology", "maths", "math", "computer", "commerce", "science",
                "padam", "paadam", "பாட", "பிரிவு", "குரூப்", "கோர்ஸ்"},
    "classes": {"class", "classes", "classroom", "classrooms", "வகுப்பு"},
    "learning": {"learning", "teaching", "study", "padippu", "padikka", "கற்றல்", "கற்பித்தல்"},
    "activities": {"activity", "activities", "extracurricular", "extra", "curricular", "events",
                   "cultural", "செயல்பாடு", "நிகழ்ச்சி"},
    "infrastructure": {"infrastructure", "facility", "facilities", "campus", "lab", "labs",
                       "library", "building", "buildings", "வசதி", "வளாகம்", "நூலகம்"},
    "sports": {"sport", "sports", "game", "games", "football", "cricket", "athletics", "play",
               "vilayattu", "விளையாட்டு"},
    "sports_achievements": {"achievement", "achievements", "medal", "medals", "won", "winner",
                            "winners", "award", "awards", "trophy", "champion", "championship",
                            "சாதனை", "பதக்க", "வெற்றி"},
    "clubs": {"club", "clubs", "society", "forum", "மன்ற", "கிளப்"},
    "academic_info": {"academic", "pdf", "document", "documents", "circular",
                      "notice", "syllabus", "exam", "exams", "timetable", "தேர்வு",
                      "பாடத்திட்ட", "அறிவிப்பு"},
    "calendar": {"calendar", "holiday", "holidays", "schedule", "dates", "term", "vacation",
                 "leave", "நாட்காட்டி", "விடுமுறை", "காலண்டர்"},
    "alumni": {"alumni", "alumnus", "former", "முன்னாள்"},
    "achievers": {"topper", "toppers", "achiever", "achievers", "rank", "ranks", "marks", "mark",
                  "score", "scores", "centum", "result", "results", "sslc", "hsc",
                  "முதலிட", "மதிப்பெண்", "சாதனையாளர்", "டாப்பர்"},
    "contact": {"contact", "phone", "email", "mail", "address", "location", "where",
                "admission", "admissions", "apply", "enquiry", "inquiry", "fee", "fees", "timing",
                "timings", "hours", "enga", "தொடர்பு", "சேர்க்கை", "கட்டண", "முகவரி"},
}

LEVEL_TERMS: dict[str, set[str]] = {
    "nursery": {"nursery", "lkg", "ukg", "kg", "kindergarten", "prekg", "மழலையர்", "நர்சரி"},
    "primary": {"primary", "தொடக்க", "ஆரம்ப", "ப்ரைமரி"},
    "higher-secondary": {"higher", "secondary", "hsc", "plus", "11th", "12th", "xi", "xii",
                         "மேல்நிலை", "ஹையர்"},
}

_STOPWORDS = {
    "the", "and", "for", "are", "what", "which", "who", "how", "is", "in", "of", "to", "a", "an",
    "do", "does", "you", "your", "there", "any", "can", "about", "with", "this", "that", "have",
    "has", "tell", "me", "please", "school", "smdpvc", "available", "details", "info",
}
_GENERIC_ABOUT = {"about", "school", "pathi", "patthi", "smdpvc"}
_LATIN_WORD = re.compile(r"[a-z0-9]+")
_TAMIL_WORD = re.compile(r"[஀-௿]+")


@dataclass
class KnowledgeDoc:
    title: str
    url: str
    text: str
    topics: set[str]
    level: str = "home"
    source: str = ""  # friendly label for the source link, e.g. "Higher Secondary · Sports"
    tokens: set[str] = field(default_factory=set)

    def __post_init__(self) -> None:
        self.text = self.text.strip()[:MAX_DOC_CHARS]
        self.tokens = _tokens(f"{self.title} {self.text}")


def _tokens(text: str) -> set[str]:
    lowered = text.lower()
    latin = {w for w in _LATIN_WORD.findall(lowered) if len(w) >= 3 and w not in _STOPWORDS}
    return latin | set(_TAMIL_WORD.findall(text))


def _matches(term: str, words: set[str], raw: str) -> bool:
    if _TAMIL_WORD.fullmatch(term):
        return term in raw
    return term in words


def _query_profile(query: str) -> tuple[set[str], set[str], set[str]]:
    """Return (topics, levels, tokens) mentioned in the query."""
    raw = query.lower().replace("+1", " plus ").replace("+2", " plus ")
    words = set(_LATIN_WORD.findall(raw))
    topics = {t for t, terms in TOPIC_TERMS.items() if any(_matches(x, words, raw) for x in terms)}
    # Generic "tell me about the school" only means the About topic when nothing specific matched.
    if not topics and (words & _GENERIC_ABOUT or any(t in raw for t in ("பள்ளி", "பற்றி"))):
        topics = {"about"}
    levels = {lv for lv, terms in LEVEL_TERMS.items() if any(_matches(x, words, raw) for x in terms)}
    return topics, levels, _tokens(query)


def _score(doc: KnowledgeDoc, topics: set[str], levels: set[str], tokens: set[str]) -> float:
    topic_hits = len(doc.topics & topics)
    overlap = len(doc.tokens & tokens)
    if not topic_hits and not overlap:
        return 0.0
    score = 3.0 * topic_hits + 1.0 * overlap
    if levels:
        score = score + 2.0 if doc.level in levels else score * 0.3
    return score


def _clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value)).strip() if value not in (None, "") else ""


def _join(*parts: tuple[str, object]) -> str:
    return "; ".join(f"{label}: {_clean(v)}" for label, v in parts if _clean(v))


def _record_text(payload: object) -> str:
    # The ORM column stores the payload as a JSON string (ContentRecordRead decodes it).
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except ValueError:
            return ""
    value = payload.get("description") if isinstance(payload, dict) else None
    return value if isinstance(value, str) else ""


def _media_url(media: object) -> str:
    url = getattr(media, "image_url", None) if media is not None else None
    return str(url) if url else ""


async def load_public_documents(session: AsyncSession) -> list[KnowledgeDoc]:
    """Build documents from currently published public content. Each source is isolated:
    a failure in one source never breaks the chat, it just contributes nothing."""
    docs: list[KnowledgeDoc] = []

    # All content-record payloads the chatbot uses, in ONE query (was one query per key).
    # Only payload text is used; media links are not needed, so no media joins.
    records: dict[str, object] = {}
    try:
        rows = await session.execute(
            select(ContentRecord.record_key, ContentRecord.payload).where(ContentRecord.record_key.in_(_RECORD_KEYS))
        )
        records = {key: payload for key, payload in rows.all()}
    except Exception:  # noqa: BLE001
        logger.exception("Chat knowledge source failed: content_records")

    async def collect(name: str, builder) -> None:
        try:
            docs.extend(await builder())
        except Exception:  # noqa: BLE001 - one bad source must not break chat
            logger.exception("Chat knowledge source failed: %s", name)

    def doc(title: str, level: str, part: str, label: str, text: str, topics: set[str]) -> KnowledgeDoc:
        url, source = section_link(level, part, label)
        return KnowledgeDoc(title, url, text, topics, level, source)

    async def about() -> list[KnowledgeDoc]:
        out = []
        for s in await public_api.list_public_about_sections(session):
            if s.section_key in PAGES and _clean(s.description):
                name = PAGES[s.section_key][0]
                out.append(doc(f"About {name}", s.section_key, "about", "About", _clean(s.description), {"about"}))
        return out

    async def principals() -> list[KnowledgeDoc]:
        out = []
        for level, key in (("nursery", "principal.nursery"), ("primary", "principal.primary"),
                           ("higher-secondary", "principal.highersecondary")):
            raw = _record_text(records.get(key))
            if not raw:
                continue
            try:
                data = json.loads(raw)
            except ValueError:
                data = {"name": raw}
            if not isinstance(data, dict):
                data = {"name": raw}
            text = _join(("Principal name", data.get("name")), ("Message", data.get("message")))
            if text:
                out.append(doc(f"{PAGES[level][0]} Principal", level, "principal", "Principal", text, {"principal"}))
        return out

    async def courses() -> list[KnowledgeDoc]:
        raw = _record_text(records.get("higher-secondary.course-groups"))
        if not raw:
            return []
        try:
            groups = json.loads(raw).get("groups", [])
        except (ValueError, AttributeError):
            return []
        lines = []
        for g in sorted((g for g in groups if isinstance(g, dict)), key=lambda g: g.get("order", 0)):
            if not _clean(g.get("name")):
                continue
            subjects = ", ".join(_clean(x) for x in g.get("subjects", []) if _clean(x)) or "not listed"
            lines.append(f"{_clean(g.get('name'))} (subjects: {subjects})")
        if not lines:
            return []
        return [doc("Higher Secondary Courses", "higher-secondary", "courses", "Courses Offered",
                    "Course groups offered: " + " | ".join(lines), {"courses"})]

    async def galleries() -> list[KnowledgeDoc]:
        out = []
        labels = {"classes": ("Classes", "classes"), "learning": ("Learning Activities", "learning"),
                  "extracurricular": ("Extracurricular Activities", "activities")}
        for level in ("nursery", "primary", "higher-secondary"):
            for part, (label, topic) in labels.items():
                text = _clean(_record_text(records.get(f"{level}.{part}.gallery")))
                if text:
                    out.append(doc(f"{PAGES[level][0]} {label}", level, part, label, text, {topic}))
        text = _clean(_record_text(records.get("infrastructure.gallery")))
        if text:
            out.append(doc("Infrastructure", "home", "infrastructure", "Infrastructure", text, {"infrastructure"}))
        return out

    async def content_items() -> list[KnowledgeDoc]:
        # Cards shown inside the Nursery/Primary Classes, Learning and Extracurricular sections.
        topic_for = {"classes": "classes", "learning": "learning", "extracurricular": "activities"}
        label_for = {"classes": "Classes", "learning": "Learning Activities",
                     "extracurricular": "Extracurricular Activities"}
        out = []
        for item in await public_api.list_public_content_items(session, None, None):
            level, part = item.page_slug, item.section_key
            if level not in _SECTION_PREFIX or part not in topic_for or not _clean(item.title):
                continue
            out.append(doc(f"{PAGES[level][0]} {label_for[part]}: {_clean(item.title)}", level, part,
                           label_for[part], _join(("Title", item.title), ("Details", item.description)),
                           {topic_for[part]}))
        return out

    async def leadership() -> list[KnowledgeDoc]:
        out = []
        for p in await public_api.list_public_leadership_profiles(session):
            text = _join(("Name", p.name), ("Designation", p.designation),
                         ("About", p.short_bio), ("Message", p.message))
            if text:
                out.append(doc(f"Leadership: {_clean(p.name)}", "home", "leadership", "Leadership", text,
                               {"leadership"}))
        return out

    async def sports() -> list[KnowledgeDoc]:
        return [doc(f"Sport: {_clean(s.name)}", "higher-secondary", "sports", "Sports",
                    _join(("Sport", s.name), ("Details", s.description)), {"sports"})
                for s in await public_api.list_public_sports(session) if _clean(s.name)]

    async def clubs() -> list[KnowledgeDoc]:
        return [doc(f"Club: {_clean(c.name)}", "higher-secondary", "clubs", "Clubs",
                    _join(("Club", c.name), ("Details", c.description)), {"clubs"})
                for c in await public_api.list_public_clubs(session) if _clean(c.name)]

    async def sports_achievements() -> list[KnowledgeDoc]:
        return [doc("Sports Achievement", "higher-secondary", "sports-achievements", "Sports Achievements",
                    _clean(a.description), {"sports_achievements", "sports"})
                for a in await public_api.list_public_sports_achievements(session) if _clean(a.description)]

    async def academic_info() -> list[KnowledgeDoc]:
        return [doc(f"Academic Information: {_clean(i.title)}", "higher-secondary", "academic-information",
                    "Academic Information",
                    _join(("Title", i.title), ("Details", i.description), ("Document link", _media_url(i.media))),
                    {"academic_info"})
                for i in await public_api.list_public_academic_information(session) if _clean(i.title)]

    async def alumni() -> list[KnowledgeDoc]:
        return [doc(f"Alumni: {_clean(a.name)}", "higher-secondary", "alumni", "Alumni",
                    _join(("Name", a.name), ("Batch", a.batch_year), ("About", a.description)), {"alumni"})
                for a in await public_api.list_public_alumni(session) if _clean(a.name)]

    async def achievers() -> list[KnowledgeDoc]:
        # Exactly the fields the public Achievers section displays (AchieversSection / ToppersResultsDisplay).
        out = []
        for t in await public_api.list_public_toppers(session):
            if not _clean(t.student_name):
                continue
            centum_subjects = ", ".join(_clean(x) for x in (t.centum_subjects or []) if _clean(x))
            text = _join(
                ("Student", t.student_name), ("Grade", f"Class {t.grade_level}"), ("Class name", t.class_name),
                ("Section", t.section), ("Year", t.academic_year), ("Score", t.score), ("Stream", t.stream),
                ("Subject", t.subject), ("Rank", t.rank),
                ("Centums scored", t.centums_scored or None), ("Centum subjects", centum_subjects),
            )
            grade = str(t.grade_level)
            board = {"10": "SSLC / Class 10", "12": "HSC / Class 12"}.get(grade, "")
            title = f"Achiever ({board}): {_clean(t.student_name)}" if board else f"Achiever: {_clean(t.student_name)}"
            out.append(doc(title, "higher-secondary", "achievers", "Achievers", text, {"achievers"}))
        return out

    async def calendars() -> list[KnowledgeDoc]:
        latest: dict[str, str] = {}
        for config in await public_api.list_public_photos(session):
            if config.config_key.startswith("academic-calendar.") and config.media is not None:
                latest[config.config_key.split(".", 1)[1]] = _media_url(config.media)  # ordered: last wins
        out = []
        for level, url in latest.items():
            if level in PAGES and url:
                name = PAGES[level][0]
                out.append(doc(f"{name} Academic Calendar", level, "calendar", "Academic Calendar",
                               f"The {name} academic calendar is published as a document. Document link: {url}",
                               {"calendar"}))
        return out

    # Only sources that are actually displayed on the public website. Deliberately NOT used:
    # website_settings (no public page shows it), the achievements table (its component is not
    # mounted anywhere), and static frontend copy (labelled as placeholder/demo text on the site).
    for name, builder in [
        ("about", about), ("principals", principals), ("courses", courses), ("galleries", galleries),
        ("content_items", content_items), ("leadership", leadership), ("sports", sports), ("clubs", clubs),
        ("sports_achievements", sports_achievements), ("academic_info", academic_info), ("alumni", alumni),
        ("achievers", achievers), ("calendars", calendars),
    ]:
        await collect(name, builder)
    return [d for d in docs if d.text]


def retrieve(docs: list[KnowledgeDoc], message: str, previous_user_message: str | None = None) -> list[KnowledgeDoc]:
    """Rank documents for the message; the previous user turn helps follow-ups ("and clubs?")."""
    current = _query_profile(message)
    previous = _query_profile(previous_user_message) if previous_user_message else (set(), set(), set())
    # A follow-up inherits the previous level ("what about its principal?") if it names none.
    levels = current[1] or previous[1]
    scored = []
    for doc in docs:
        score = _score(doc, current[0], levels, current[2])
        if previous_user_message:
            score += 0.5 * _score(doc, previous[0], levels, previous[2])
        if score > 0:
            scored.append((score, doc))
    # Topic focus: if the visitor named specific topics, documents that only share a school-level
    # word ("nursery") or a common token are not answers. If nothing covers the topic, send nothing
    # (the prompt then lists it as unpublished) instead of loosely related sections.
    asked = current[0] or (previous[0] if previous_user_message and not current[2] - previous[2] else set())
    if current[0] == {"about"}:
        pass  # general "tell me about ..." questions: an overview may use any section of that level
    elif current[0]:
        scored = [(score, doc) for score, doc in scored if doc.topics & current[0]]
    elif asked:
        scored = [(score, doc) for score, doc in scored if doc.topics & asked] or scored
    scored.sort(key=lambda pair: pair[0], reverse=True)

    picked, total = [], 0
    floor = scored[0][0] * 0.4 if scored else 0
    for score, doc in scored[:MAX_DOCS]:
        if score < floor:
            break
        if total + len(doc.text) > MAX_CONTEXT_CHARS:
            break
        picked.append(doc)
        total += len(doc.text)
    return picked


def topic_catalog(docs: list[KnowledgeDoc]) -> list[str]:
    """Distinct section names that ARE published (no content), offered when nothing matched."""
    seen: list[str] = []
    for doc in docs:
        label = doc.source or doc.title
        if label not in seen:
            seen.append(label)
    return seen[:25]


TOPIC_LABELS = {
    "about": "About", "principal": "Principal", "leadership": "Leadership", "courses": "Courses Offered",
    "classes": "Classes", "learning": "Learning Activities", "activities": "Extracurricular Activities",
    "infrastructure": "Infrastructure", "sports": "Sports", "sports_achievements": "Sports Achievements",
    "clubs": "Clubs", "academic_info": "Academic Information", "calendar": "Academic Calendar",
    "alumni": "Alumni", "achievers": "Achievers",
    "contact": "Contact details, admissions, fees and school timings",
}


def missing_topics(docs: list[KnowledgeDoc], message: str) -> list[str]:
    """Topics the visitor explicitly asked about that have NO published content (for the asked
    school level, if one was named). Lets the model say "not available" instead of guessing."""
    topics, levels, _ = _query_profile(message)
    missing = []
    for topic in sorted(topics):
        available = [d for d in docs if topic in d.topics and (not levels or d.level in levels)]
        if not available:
            where = ", ".join(PAGES[lv][0] for lv in sorted(levels)) if levels else ""
            missing.append(f"{TOPIC_LABELS.get(topic, topic)}{f' ({where})' if where else ''}")
    return missing


# ---------------------------------------------------------------------------
# Public-knowledge cache
#
# Building the documents costs ~13 queries; it is cached in memory and reused while
# the public content is unchanged. Validity is checked on EVERY request:
#   1. Version counter: any ORM write to a content table in this process bumps it
#      (session flush events + bulk UPDATE/DELETE statements), so admin edits and
#      deletions are visible on the very next chat message.
#   2. Fingerprint: one query reading COUNT(*) and MAX(updated_at) of every source
#      table; catches changes made by other processes/workers or raw SQL.
#   3. TTL (CHAT_KNOWLEDGE_CACHE_SECONDS) as a final safety net.
# Only documents built from public reads are cached — never admin/private data.
# ---------------------------------------------------------------------------
import time  # noqa: E402

from sqlalchemy import event, func  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.models.content import (  # noqa: E402
    AboutSection,
    AcademicInformation,
    Alumni,
    Club,
    ContentItem,
    LeadershipProfile,
    Sport,
    SportsAchievementPhoto,
    Topper,
)
from app.models.content_record import ContentRecordMedia  # noqa: E402
from app.models.media import Media, PhotoConfiguration  # noqa: E402

_SOURCE_MODELS = (
    AboutSection, LeadershipProfile, Sport, Club, SportsAchievementPhoto, ContentItem,
    AcademicInformation, Alumni, Topper, ContentRecord, ContentRecordMedia,
    PhotoConfiguration, Media,
)
_SOURCE_TABLES = {m.__table__.name for m in _SOURCE_MODELS}


@dataclass
class _CacheEntry:
    docs: list[KnowledgeDoc]
    fingerprint: tuple
    version: int
    created: float


_cache: _CacheEntry | None = None
_version = 0


def invalidate_cache() -> None:
    global _version, _cache
    _version += 1
    _cache = None


@event.listens_for(Session, "after_flush")
def _on_flush(session: Session, _ctx: object) -> None:
    for obj in (*session.new, *session.dirty, *session.deleted):
        if isinstance(obj, _SOURCE_MODELS):
            invalidate_cache()
            return


@event.listens_for(Session, "do_orm_execute")
def _on_bulk_write(state) -> None:  # bulk update()/delete() bypass flush events
    if state.is_update or state.is_delete:
        table = getattr(getattr(state.statement, "table", None), "name", None)
        if table is None or table in _SOURCE_TABLES:
            invalidate_cache()


async def _fingerprint(session: AsyncSession) -> tuple:
    columns = []
    for model in _SOURCE_MODELS:
        columns.append(select(func.count()).select_from(model).scalar_subquery())
        columns.append(select(func.max(model.updated_at)).scalar_subquery())
    row = (await session.execute(select(*columns))).one()
    return tuple(row)


async def get_public_documents(session: AsyncSession, stats: dict | None = None) -> list[KnowledgeDoc]:
    """Cached load_public_documents(); always validated against the current content."""
    global _cache
    stats = stats if stats is not None else {}
    ttl = get_settings().chat_knowledge_cache_seconds
    version = _version
    fingerprint = await _fingerprint(session)
    entry = _cache
    if (
        entry is not None
        and ttl > 0
        and entry.version == version
        and entry.fingerprint == fingerprint
        and time.monotonic() - entry.created < ttl
    ):
        stats["cache"] = "hit"
        return entry.docs
    stats["cache"] = "miss"
    docs = await load_public_documents(session)
    if _version == version:  # a write during the load would make this snapshot stale
        _cache = _CacheEntry(docs, fingerprint, version, time.monotonic())
    return docs
