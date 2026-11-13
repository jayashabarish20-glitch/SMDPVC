/// <reference types="vite/client" />
import primaryIntroImage3 from "../assests/images/Primary/primary intro image3 .jpeg";
import primaryIntroImage2 from "../assests/images/Primary/primary intro image2.jpeg";
import primaryIntroImage1 from "../assests/images/Primary/primary intro image1.jpeg";
import higherSecondaryIntroImage3 from "../assests/images/higher-secondary/highersecondary intro image3.jpeg";
import higherSecondaryIntroImage2 from "../assests/images/higher-secondary/highersecondary intro image2.jpeg";
import higherSecondaryIntroImage1 from "../assests/images/higher-secondary/highersecondary intro image1.jpeg";
import { campusImages } from "./data";

export type SchoolPageSection = {
  id: string;
  title: string;
  description: string;
  subsections?: string[];
};

export type SchoolPageConfig = {
  title: string;
  hero: {
    images: string[];
    slides: {
      badge: string;
      title: string;
      description: string;
    }[];
    firstSectionId: string;
  };
  sections: SchoolPageSection[];
};

const editablePlaceholder =
  "School-verified information to be added. Replace this editable placeholder with confirmed details.";

export const schoolPages: Record<string, SchoolPageConfig> = {
  nursery: {
    title: "Nursery",
    hero: {
      images: [campusImages.hero[0], campusImages.sports, campusImages.principal],
      slides: [
        { badge: "Nursery", title: "A Warm Start to Learning", description: "Explore the Nursery section. Add a school-approved introduction and learning environment details here." },
        { badge: "Discover", title: "Room to Explore and Grow", description: "Share confirmed information about the Nursery learning spaces and early experiences here." },
        { badge: "Every Day", title: "Learning Through New Experiences", description: "Add details about the activities and daily learning experiences offered in Nursery." },
      ],
      firstSectionId: "nursery-about",
    },
    sections: [
      { id: "nursery-about", title: "About Nursery", description: editablePlaceholder },
      { id: "nursery-classes", title: "Classes", description: editablePlaceholder },
      { id: "nursery-learning", title: "Learning Activities", description: editablePlaceholder },
      { id: "nursery-calendar", title: "Academic Calendar", description: editablePlaceholder },
      { id: "nursery-extracurricular", title: "Extracurricular Activities", description: editablePlaceholder },
    ],
  },
  primary: {
    title: "Primary",
    hero: {
      images: [primaryIntroImage3, primaryIntroImage2, primaryIntroImage1],
      slides: [
        { badge: "Primary", title: "Building Strong Foundations", description: "Explore the Primary section. Add the school's verified educational overview here." },
        { badge: "Learning", title: "Curiosity in Every Classroom", description: "Share confirmed information about teaching approaches and the Primary learning experience here." },
        { badge: "Growing", title: "Skills for the Next Step", description: "Add verified details about Primary classes and student activities here." },
      ],
      firstSectionId: "primary-about",
    },
    sections: [
      { id: "primary-about", title: "About Primary", description: editablePlaceholder },
      { id: "primary-classes", title: "Classes", description: editablePlaceholder },
      { id: "primary-learning", title: "Learning Activities", description: editablePlaceholder },
      { id: "primary-calendar", title: "Academic Calendar", description: editablePlaceholder },
      { id: "primary-extracurricular", title: "Extracurricular Activities", description: editablePlaceholder },
    ],
  },
  "higher-secondary": {
    title: "Higher Secondary",
    hero: {
      images: [
        higherSecondaryIntroImage3,
        higherSecondaryIntroImage2,
        higherSecondaryIntroImage1,
      ],
      slides: [
        { badge: "Higher Secondary", title: "Preparing for What Comes Next", description: "Explore the Higher Secondary section. Add a school-approved introduction here." },
        { badge: "Academic Journey", title: "Focus, Discover, Develop", description: "Share verified details about courses and academic learning when confirmed by the school." },
        { badge: "Student Life", title: "Learning Beyond the Classroom", description: "Add approved information about activities and opportunities available to students." },
      ],
      firstSectionId: "higher-about",
    },
    sections: [
      { id: "higher-about", title: "About Higher Secondary", description: editablePlaceholder },
      {
        id: "higher-courses",
        title: "Courses Offered",
        description:
          "Course groups and combinations have not been verified. Add only offerings confirmed by the school.",
      },
      { id: "higher-classes", title: "Classes", description: editablePlaceholder },
      { id: "higher-academic-information", title: "Academic Information", description: editablePlaceholder },
      { id: "higher-learning", title: "Learning Activities", description: editablePlaceholder },
      {
        id: "higher-achievements",
        title: "Achievements",
        description:
          "Add verified school achievements only. Do not publish sample student names, marks, or ranks.",
        subsections: [
          "Academic Achievements",
          "School Toppers",
          "Subject-wise Toppers",
          "10th Standard Results",
          "12th Standard Results",
        ],
      },
      { id: "higher-alumni", title: "Alumni Details", description: editablePlaceholder },
      { id: "higher-clubs", title: "Clubs", description: editablePlaceholder },
      { id: "higher-calendar", title: "Academic Calendar", description: editablePlaceholder },
      { id: "higher-extracurricular", title: "Extracurricular Activities", description: editablePlaceholder },
      { id: "higher-sports", title: "Sports", description: editablePlaceholder },
    ],
  },
};
