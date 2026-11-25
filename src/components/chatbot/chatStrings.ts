import type { ChatLanguage, ReplyLanguage } from "../../services/chatApi";

export interface ChatStrings {
  title: string;
  subtitle: string;
  welcome: string;
  suggestions: string[];
  placeholder: string;
  send: string;
  clear: string;
  open: string;
  close: string;
  thinking: string;
  sources: string;
  languageLabel: string;
}

export const LANGUAGE_OPTIONS: { value: ChatLanguage; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "en", label: "English" },
  { value: "ta", label: "தமிழ்" },
  { value: "tanglish", label: "Tanglish" },
];

export const CHAT_STRINGS: Record<ReplyLanguage, ChatStrings> = {
  en: {
    title: "SMDPVC Assistant",
    subtitle: "Answers from our published school information",
    welcome:
      "Hello! I can help with information about SMDPVC: courses, principals, sports, clubs, achievers and more. Ask me in English, Tamil or Tanglish.",
    suggestions: [
      "What courses are available in higher secondary?",
      "Who is the principal of the nursery section?",
      "What sports are offered?",
      "Which clubs are there?",
    ],
    placeholder: "Type your question…",
    send: "Send",
    clear: "Clear conversation",
    open: "Open school assistant",
    close: "Close assistant",
    thinking: "Thinking…",
    sources: "Sources",
    languageLabel: "Reply language",
  },
  ta: {
    title: "SMDPVC உதவியாளர்",
    subtitle: "பள்ளியின் வெளியிடப்பட்ட தகவல்களிலிருந்து பதில்கள்",
    welcome:
      "வணக்கம்! SMDPVC பற்றிய பாடப்பிரிவுகள், முதல்வர்கள், விளையாட்டு, மன்றங்கள், சாதனையாளர்கள் போன்ற தகவல்களுக்கு உதவுகிறேன். தமிழ், ஆங்கிலம் அல்லது Tanglish-ல் கேளுங்கள்.",
    suggestions: [
      "மேல்நிலைப் பள்ளியில் என்ன பாடப்பிரிவுகள் உள்ளன?",
      "நர்சரி பிரிவின் முதல்வர் யார்?",
      "பள்ளியில் என்ன விளையாட்டுகள் உள்ளன?",
      "என்ன மன்றங்கள் உள்ளன?",
    ],
    placeholder: "உங்கள் கேள்வியை எழுதுங்கள்…",
    send: "அனுப்பு",
    clear: "உரையாடலை அழி",
    open: "பள்ளி உதவியாளரைத் திற",
    close: "உதவியாளரை மூடு",
    thinking: "யோசிக்கிறது…",
    sources: "ஆதாரங்கள்",
    languageLabel: "பதில் மொழி",
  },
  tanglish: {
    title: "SMDPVC Assistant",
    subtitle: "School-oda published information-la irundhu answers",
    welcome:
      "Vanakkam! SMDPVC pathi courses, principal, sports, clubs, achievers ellam kelunga. English, Tamil illa Tanglish-la kekkalam.",
    suggestions: [
      "Higher secondary la enna courses irukku?",
      "Nursery principal yaaru?",
      "School la enna sports irukku?",
      "Enna clubs irukku?",
    ],
    placeholder: "Unga question type pannunga…",
    send: "Send",
    clear: "Conversation clear pannu",
    open: "School assistant open pannu",
    close: "Assistant close pannu",
    thinking: "Yosikkiren…",
    sources: "Sources",
    languageLabel: "Reply language",
  },
};

export function stringsFor(language: ChatLanguage): ChatStrings {
  return CHAT_STRINGS[language === "auto" ? "en" : language];
}
