import { campusImages } from "./data";

export const schoolBrandingByRoute = {
  "/": {
    fullName: "SMDPVC Group Of Schools",
    wordmark: "SMDPVC",
    subtitle: "Group Of Schools",
  },
  "/nursery": {
    fullName: "SMDPVC Nursery",
    wordmark: "SMDPVC",
    subtitle: "Nursery",
  },
  "/primary": {
    fullName: "SMDPVC Primary",
    wordmark: "SMDPVC",
    subtitle: "Primary",
  },
  "/higher-secondary": {
    fullName: "SMDPVC Higher Secondary School",
    wordmark: "SMDPVC",
    subtitle: "Higher Secondary School",
  },
} as const;

export const foundationContent = {
  vision: {
    title: "Our Vision",
    description:
      "To create a learning environment that encourages curiosity, knowledge, confidence, and responsible citizenship.",
    isDemo: true,
  },
  mission: {
    title: "Our Mission",
    description:
      "To support every learner through quality education, meaningful learning experiences, and opportunities for personal growth.",
    isDemo: true,
  },
};

export type LeadershipProfile = {
  id: string;
  name: string;
  designation: string;
  category: string;
  photo: string | null;
  message: string;
  shortBio: string;
  displayOrder: number;
  isActive: boolean;
};

export const leadershipProfiles: LeadershipProfile[] = [
  {
    id: "management-profile",
    name: "Name to be added",
    designation: "Designation to be confirmed",
    category: "Management",
    photo: null,
    message: "",
    shortBio: "Add a school-approved introduction for this leader.",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "trustee-profile",
    name: "Name to be added",
    designation: "Designation to be confirmed",
    category: "Trustee",
    photo: null,
    message: "",
    shortBio: "Add a school-approved introduction for this leader.",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "school-head-profile",
    name: "Name to be added",
    designation: "Designation to be confirmed",
    category: "School Head / Principal",
    photo: null,
    message: "",
    shortBio: "Add a school-approved introduction for this leader.",
    displayOrder: 3,
    isActive: true,
  },
];

export const schoolSectionCards = [
  {
    title: "Nursery",
    description: "Discover the Nursery section and its learning environment.",
    image: campusImages.hero[0],
    imageAlt: "Illustrative image for the Nursery section",
    href: "/nursery",
    category: "Early learning",
    displayOrder: 1,
  },
  {
    title: "Primary",
    description: "Explore the Primary section and its learning journey.",
    image: campusImages.hero[1],
    imageAlt: "Illustrative image for the Primary section",
    href: "/primary",
    category: "School section",
    displayOrder: 2,
  },
  {
    title: "Higher Secondary",
    description: "Learn more about the Higher Secondary section.",
    image: campusImages.sports,
    imageAlt: "Illustrative image for the Higher Secondary section",
    href: "/higher-secondary",
    category: "School section",
    displayOrder: 3,
  },
] as const;

export const schoolContact = {
  schoolName: "SMDPVC",
  address: null as string | null,
  phoneNumbers: [] as { label: string; number: string }[],
  emailAddresses: [] as { label: string; address: string }[],
  website: null as string | null,
  workingHours: null as string | null,
  mapsUrl: null as string | null,
  mapEmbedUrl: null as string | null,
};
