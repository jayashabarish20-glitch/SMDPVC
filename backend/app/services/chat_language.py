"""Language detection and reply-language instructions for the public chatbot.

Supported reply languages:
  en        English
  ta        Tamil (Tamil script)
  tanglish  Tamil written in Latin script, mixed with English
"""
import re
from typing import Literal

ReplyLanguage = Literal["en", "ta", "tanglish"]
RequestLanguage = Literal["auto", "en", "ta", "tanglish"]

_TAMIL_SCRIPT = re.compile(r"[஀-௿]")
_WORD = re.compile(r"[a-z]+")

# Common romanized-Tamil words. Kept conservative so ordinary English is not misdetected.
_TANGLISH_WORDS = frozenset(
    {
        "enna", "yenna", "ennaa", "epdi", "eppadi", "yepdi", "eppo", "eppothu", "enga", "engae",
        "yaaru", "yaar", "evlo", "evvalavu", "ethana", "irukku", "iruku", "irukka", "iruka",
        "irukkuma", "irukkaa", "illa", "illai", "venum", "vendum", "venuma", "sollunga", "sollu",
        "solla", "theriyuma", "theriyum", "theriyala", "pannanum", "panna", "pannunga", "pannalam",
        "vanakkam", "nandri", "romba", "konjam", "naan", "nanga", "unga", "ungal", "enakku",
        "enaku", "inga", "anga", "kudunga", "kidaikkum", "kedaikuma", "padikka", "padippu",
        "paadam", "vilayattu", "pasanga", "pullainga", "pallikoodam", "seri", "sari", "aana",
        "appo", "ippo", "ennoda", "unnoda", "yen", "edhuku", "ethuku", "pathi", "patthi",
        "kaalai", "maalai", "naal", "kitta", "vaanga", "ponga", "mudiyuma", "mudiyum",
    }
)
# Tamil case suffixes glued to English words, e.g. "school-la", "class ku".
_TANGLISH_SUFFIX = re.compile(r"\b[a-z]+(?:-| )?(?:la|ku|oda|ukku|kku)\b")


def detect_language(text: str) -> ReplyLanguage:
    """Best-effort detection; Tamil script wins, then Tanglish word hits, else English."""
    if _TAMIL_SCRIPT.search(text):
        return "ta"
    words = _WORD.findall(text.lower())
    hits = sum(1 for w in words if w in _TANGLISH_WORDS)
    if hits >= 2 or (hits == 1 and (len(words) <= 4 or _TANGLISH_SUFFIX.search(text.lower()))):
        return "tanglish"
    return "en"


def resolve_language(requested: RequestLanguage, message: str) -> ReplyLanguage:
    return detect_language(message) if requested == "auto" else requested


LANGUAGE_INSTRUCTIONS: dict[ReplyLanguage, str] = {
    "en": "Reply in clear, simple English.",
    "ta": (
        "Reply in Tamil using Tamil script (தமிழ்). Keep proper nouns, course and subject names as written in the "
        "school data. Write the whole reply in Tamil, including any closing section pointer, for example: "
        "\"இதை இணையதளத்தின் Higher Secondary · Sports பகுதியில் பார்க்கலாம்.\""
    ),
    "tanglish": (
        "Reply in Tanglish: Tamil written in English (Latin) letters, naturally mixed with English words, "
        "the way the visitor wrote. Do not use Tamil script. Write any closing section pointer in Tanglish too, "
        "for example: \"Idha website-la Higher Secondary · Sports section-la paakalam.\""
    ),
}

# Fixed, non-AI replies used when the AI provider cannot be reached.
UNAVAILABLE_REPLIES: dict[ReplyLanguage, str] = {
    "en": "Sorry, the school assistant is temporarily unavailable. Please try again in a little while.",
    "ta": "மன்னிக்கவும், பள்ளி உதவியாளர் தற்காலிகமாக கிடைக்கவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
    "tanglish": "Sorry, school assistant ippo temporary-a available illa. Konjam neram kalichu try pannunga.",
}

# Shown when the answer stopped part-way (provider error after some text was sent).
INTERRUPTED_REPLIES: dict[ReplyLanguage, str] = {
    "en": "The answer was interrupted. Please ask again.",
    "ta": "பதில் இடையில் நின்றுவிட்டது. தயவுசெய்து மீண்டும் கேளுங்கள்.",
    "tanglish": "Answer naduvula ninnuduchu. Thirumba kelunga.",
}
