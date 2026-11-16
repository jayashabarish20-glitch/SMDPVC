export const schoolName = "SMDPVC";
export const schoolIntroduction =
  "School introduction placeholder — replace with the approved school profile.";
export const schoolHistory = "[Add verified school history here]";

export const schoolVision = {
  content: "School vision statement placeholder.",
  detail: "Replace with the approved school vision.",
};

export const schoolMission = {
  content: "School mission statement placeholder.",
  detail: "Replace with the approved school mission.",
};

export interface ManagementMember {
  name: string;
  designation: string;
  photo: string | null;
}

export interface ManagementMessage {
  name: string;
  designation: string;
  message: string;
  photo: string | null;
}

export const managementMembers: ManagementMember[] = [
  {
    name: "Name to be supplied",
    designation: "Designation to be supplied",
    photo: null,
  },
];

export const managementMessages: ManagementMessage[] = [
  {
    message: "Approved management message to be added.",
    name: "Name to be supplied",
    designation: "Designation to be supplied",
    photo: null,
  },
];

export const schoolSections = [
  {
    title: "Nursery",
    description: "Introduction, facilities, classes, and learning activities.",
    href: "/nursery",
    key: "nursery",
  },
  {
    title: "Primary",
    description: "Introduction, facilities, classes, and learning activities.",
    href: "/primary",
    key: "primary",
  },
  {
    title: "Higher Secondary",
    description: "School information, academic details, and student life.",
    href: "/higher-secondary",
    key: "higher-secondary",
  },
] as const;

const schoolApprovedNote = "School-approved information to be added.";

export const schoolPageContent = {
  nursery: {
    title: "Nursery",
    sections: [
      {
        id: "nursery-introduction",
        title: "Introduction",
        content: "Nursery introduction to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "nursery-infrastructure",
        title: "Infrastructure and Facilities",
        content: "Nursery infrastructure and facilities to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "nursery-classes-learning",
        title: "Classes and Learning Activities",
        content: "Nursery class information and learning activities to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "nursery-academic-calendar",
        title: "Academic Calendar",
        content: "Approved Nursery academic calendar to be supplied, if available.",
        detail: schoolApprovedNote,
      },
      {
        id: "nursery-extracurricular",
        title: "Extracurricular Activities",
        content: "Nursery extracurricular activities to be supplied, if available.",
        detail: schoolApprovedNote,
      },
    ],
  },
  primary: {
    title: "Primary",
    sections: [
      {
        id: "primary-introduction",
        title: "Introduction",
        content: "Primary introduction to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "primary-infrastructure",
        title: "Infrastructure and Facilities",
        content: "Primary infrastructure and facilities to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "primary-classes-learning",
        title: "Classes and Learning Activities",
        content: "Primary class information and learning activities to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "primary-academic-calendar",
        title: "Academic Calendar",
        content: "Approved Primary academic calendar to be supplied, if available.",
        detail: schoolApprovedNote,
      },
      {
        id: "primary-extracurricular",
        title: "Extracurricular Activities",
        content: "Primary extracurricular activities to be supplied, if available.",
        detail: schoolApprovedNote,
      },
    ],
  },
  "higher-secondary": {
    title: "Higher Secondary",
    sections: [
      {
        id: "higher-secondary-introduction",
        title: "Introduction",
        content: "Higher Secondary introduction to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "higher-secondary-infrastructure",
        title: "Infrastructure and Facilities",
        content: "Verified facilities information to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "higher-secondary-courses-offered",
        title: "Courses Offered",
        content: "Verified courses and subject combinations to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "higher-secondary-classes-academic",
        title: "Classes and Academic Information",
        content: "Class structure and academic information to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "higher-secondary-achievements",
        title: "Achievements",
        achievements: [
          {
            title: "Academic Achievements",
            fields: ["Academic year", "Achievement", "Supporting details"],
          },
          {
            title: "School Toppers",
            fields: [
              "Academic year",
              "Student name",
              "Examination",
              "Marks or percentage",
              "Rank",
            ],
          },
          {
            title: "Subject-wise Toppers",
            fields: [
              "Academic year",
              "Student name",
              "Subject",
              "Marks or percentage",
            ],
          },
          {
            title: "10th Standard Results",
            fields: [
              "Academic year",
              "Student name",
              "Marks or percentage",
              "Achievement",
            ],
          },
          {
            title: "12th Standard Results",
            fields: [
              "Academic year",
              "Student name",
              "Marks or percentage",
              "Achievement",
            ],
          },
        ],
      },
      {
        id: "higher-secondary-alumni-details",
        title: "Alumni Details",
        content: "Verified alumni profiles and details to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "higher-secondary-clubs",
        title: "Clubs",
        content: "Verified club names and descriptions to be supplied.",
        detail: schoolApprovedNote,
      },
      {
        id: "higher-secondary-academic-calendar",
        title: "Academic Calendar",
        content: "Approved academic calendar to be supplied, if applicable.",
        detail: schoolApprovedNote,
      },
      {
        id: "higher-secondary-extracurricular",
        title: "Extracurricular Activities",
        content: "Verified extracurricular information to be supplied, if applicable.",
        detail: schoolApprovedNote,
      },
    ],
  },
} as const;

export const heroSlides = [
  {
    badge: "Welcome",
    title: "A Place to Learn, Grow & Discover",
    description:
      "Explore the learning journey at SMDPVC. Add a verified school introduction here.",
  },
  {
    badge: "Learning",
    title: "Curiosity Opens New Possibilities",
    description:
      "Share the school's learning approach and opportunities here, using verified information.",
  },
  {
    badge: "Community",
    title: "Growing Together, Every Day",
    description:
      "Add a verified message about the school community and student experience here.",
  },
];

type CampusPerson = { name: string; image: string; role: string };
type SchoolTopper = { name: string; image: string; score: string; stream: string };

export const campusImages: {
  hero: string[];
  sports: string;
  principal: string;
  location: string;
  trustees: CampusPerson[];
  alumni: (CampusPerson & { batch: string; quote: string })[];
  toppers12: SchoolTopper[];
} = {
  hero: [],
  sports: "",
  principal: "",
  location: "",
  trustees: [],
  alumni: [],
  toppers12: [],
};

export const navItems = [
  { label: "Home", id: "home" },
  { label: "Our Foundation", id: "foundation" },
  { label: "Leadership", id: "leadership" },
  { label: "School Sections", id: "school-sections" },
  { label: "Infrastructure", id: "infrastructure" },
  { label: "Enquiry", id: "enquiry" },
];

export const streams = [
  {
    icon: "flask",
    group: "Group I",
    title: "Pure Science",
    subjects: ["Mathematics", "Physics", "Chemistry", "Computer Science"],
    medium: "English Medium",
  },
  {
    icon: "microscope",
    group: "Group II",
    title: "Bio Science",
    subjects: ["Physics", "Chemistry", "Biology", "Mathematics"],
    medium: "English Medium",
  },
  {
    icon: "briefcase",
    group: "Group III",
    title: "Commerce & CS",
    subjects: ["Commerce", "Accountancy", "Computer Applications"],
    medium: "English & Tamil Medium",
  },
  {
    icon: "chart",
    group: "Group IV",
    title: "Commerce & Econ.",
    subjects: ["Commerce", "Accountancy", "Economics", "Business Mathematics"],
    medium: "Tamil Medium",
  },
] as const;

export const toppers10 = [
  {
    name: "Vikram Chandran",
    score: "498/500",
    stream: "General",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format",
  },
  {
    name: "Ananya Rajan",
    score: "496/500",
    stream: "General",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&auto=format",
  },
  {
    name: "Kiran Selvam",
    score: "495/500",
    stream: "General",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format",
  },
];

export const centumScores = [
  { count: "38", subject: "Mathematics" },
  { count: "27", subject: "Computer Science" },
  { count: "19", subject: "Accountancy" },
  { count: "14", subject: "Chemistry" },
];

export const sportsAchievements = [
  { title: "State Champions", sport: "Kabaddi – Boys", level: "State", year: "2025" },
  { title: "District Gold", sport: "Athletics – 4×100m", level: "District", year: "2025" },
  { title: "Zonal Winners", sport: "Chess – Girls", level: "Zonal", year: "2024" },
  { title: "State Runners-up", sport: "Volleyball – Girls", level: "State", year: "2024" },
  { title: "District Champions", sport: "Throw Ball – Boys", level: "District", year: "2024" },
  { title: "State Qualifier", sport: "Swimming – Individual", level: "State", year: "2025" },
];

export const clubs = [
  {
    icon: "robot",
    title: "Robotics Club",
    description: "Building the engineers of tomorrow through hands-on STEM projects.",
  },
  {
    icon: "leaf",
    title: "Eco Warriors",
    description: "Student-led sustainability initiatives and environmental conservation.",
  },
  {
    icon: "book",
    title: "Literary Society",
    description: "Debates, elocutions, creative writing, and journalism workshops.",
  },
  {
    icon: "shield",
    title: "NCC / NSS",
    description: "Nation-building through discipline, service, and social responsibility.",
  },
  {
    icon: "palette",
    title: "Fine Arts",
    description: "Painting, sculpture, classical music, and Bharatanatyam.",
  },
  {
    icon: "telescope",
    title: "Science Forum",
    description: "Science fairs, olympiad coaching, and research project mentoring.",
  },
] as const;

export const admissionSteps = [
  {
    number: "01",
    title: "Inquiry",
    description:
      "Fill the enquiry form or call our admissions office. We'll guide you through stream selection.",
  },
  {
    number: "02",
    title: "Campus Visit",
    description: "Schedule a personal campus tour. Meet the Principal and subject teachers.",
  },
  {
    number: "03",
    title: "Registration",
    description:
      "Submit documents, complete registration formalities, and join the Saraswathi family.",
  },
];

export const accreditation = [
  "Tamil Nadu State Board Affiliated",
  "CBSE Recognised (Class VI–VIII)",
  "ISO 9001:2015 Certified",
  "NAAC Accredited – Grade A",
];
