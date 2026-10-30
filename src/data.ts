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
    eyebrow: "School introduction",
    title: `Welcome to ${schoolName}`,
    description: schoolIntroduction,
  },
  {
    eyebrow: "Learning community",
    title: "A place to learn and grow",
    description: "Add verified information about the school's approach to learning.",
  },
  {
    eyebrow: "Our school",
    title: "Discover the school sections",
    description: "Update this introduction with approved school information before publishing.",
  },
];
