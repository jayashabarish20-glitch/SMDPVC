import { lazy, Suspense, useState } from 'react';
import { AdminLayout, type NavGroup } from '../components/admin/AdminLayout';
import { HomeHeroManager } from '../components/admin/HomeHeroManager';
import { LeadershipPhotosManager } from '../components/admin/LeadershipPhotosManager';
import { SchoolSectionsManager } from '../components/admin/SchoolSectionsManager';
import { Hero3DCardsManager } from '../components/admin/Hero3DCardsManager';
import { SchoolPageHeroManager } from '../components/admin/SchoolPageHeroManager';
import { ExcellenceManager } from '../components/admin/ExcellenceManager';
import { CampusLifeManager } from '../components/admin/CampusLifeManager';
import { PrimaryAboutManager } from '../components/admin/PrimaryAboutManager';
import { NurseryAboutManager } from '../components/admin/NurseryAboutManager';
import { PrimaryAcademicCalendarManager } from '../components/admin/PrimaryAcademicCalendarManager';
import { PrimaryPrincipalManager } from '../components/admin/PrimaryPrincipalManager';
import { NurseryPrincipalManager } from '../components/admin/NurseryPrincipalManager';
import { HigherSecondaryPrincipalManager } from '../components/admin/HigherSecondaryPrincipalManager';
import { NurseryClassesGalleryManager } from '../components/admin/NurseryClassesGalleryManager';
import { NurseryLearningActivitiesGalleryManager } from '../components/admin/NurseryLearningActivitiesGalleryManager';
import { NurseryExtracurricularGalleryManager } from '../components/admin/NurseryExtracurricularGalleryManager';
import { PrimaryClassesGalleryManager } from '../components/admin/PrimaryClassesGalleryManager';
import { PrimaryLearningActivitiesGalleryManager } from '../components/admin/PrimaryLearningActivitiesGalleryManager';
import { PrimaryExtracurricularGalleryManager } from '../components/admin/PrimaryExtracurricularGalleryManager';
import { InfrastructureGalleryManager } from '../components/admin/InfrastructureGalleryManager';
import { HigherSecondaryAboutManager } from '../components/admin/HigherSecondaryAboutManager';
import { HigherSecondaryClassesGalleryManager } from '../components/admin/HigherSecondaryClassesGalleryManager';
import { HigherSecondaryLearningActivitiesGalleryManager } from '../components/admin/HigherSecondaryLearningActivitiesGalleryManager';
import { HigherSecondaryExtracurricularGalleryManager } from '../components/admin/HigherSecondaryExtracurricularGalleryManager';
import { HigherSecondaryAcademicCalendarManager } from '../components/admin/HigherSecondaryAcademicCalendarManager';
import { CoursesOfferedManager } from '../components/admin/CoursesOfferedManager';
import { AchieversManager } from '../components/admin/AchieversManager';
import { AlumniManager } from '../components/admin/AlumniManager';
import { SportsManager } from '../components/admin/SportsManager';
import { SportsAchievementsManager } from '../components/admin/SportsAchievementsManager';
import { AcademicInformationManager } from '../components/admin/AcademicInformationManager';
import { ClubsManager } from '../components/admin/ClubsManager';

const NurseryAcademicCalendarManager = lazy(() =>
  import('../components/admin/NurseryAcademicCalendarManager').then((module) => ({
    default: module.NurseryAcademicCalendarManager,
  }))
);

type AdminSection =
  | 'home-hero'
  | 'leadership'
  | 'school-sections'
  | 'content-infrastructure'
  | 'content-nursery-classes'
  | 'content-nursery-learning'
  | 'content-nursery-extracurricular'
  | 'content-primary-classes'
  | 'content-primary-learning'
  | 'content-primary-extracurricular'
  | 'content-hs-classes'
  | 'content-hs-learning'
  | 'content-hs-extracurricular'
  | 'hero-3d'
  | 'nursery-hero'
  | 'nursery-about'
  | 'nursery-principal'
  | 'primary-hero'
  | 'primary-about'
  | 'primary-principal'
  | 'primary-academic-calendar'
  | 'nursery-academic-calendar'
  | 'hs-hero'
  | 'hs-about'
  | 'hs-principal'
  | 'hs-academic-calendar'
  | 'hs-courses'
  | 'hs-achievers'
  | 'hs-alumni'
  | 'hs-sports'
  | 'hs-sports-achievements'
  | 'hs-academic-information'
  | 'hs-clubs'
  | 'excellence'
  | 'campus-life';

export function AdminPanel() {
  const [activeSection, setActiveSection] = useState<AdminSection>('home-hero');

  const navGroups: NavGroup[] = [
    {
      id: 'home',
      title: 'Home Page',
      items: [
        { id: '1', label: 'Home Page Hero Carousel', section: 'home-hero' },
        { id: '3', label: 'School Sections Cards', section: 'school-sections' },
        { id: '4', label: 'Hero 3D Cards', section: 'hero-3d' },
      ],
    },
    {
      id: 'nursery',
      title: 'Nursery',
      items: [
        { id: '5', label: 'Nursery Page Hero', section: 'nursery-hero' },
        { id: '5a', label: 'Classes Gallery', section: 'content-nursery-classes' },
        { id: '5b', label: 'Learning Activities Gallery', section: 'content-nursery-learning' },
        { id: '5c', label: 'Extracurricular Gallery', section: 'content-nursery-extracurricular' },
        { id: '5d', label: 'About', section: 'nursery-about' },
        { id: '5e', label: 'Principal', section: 'nursery-principal' },
        { id: '5f', label: 'Academic Calendar', section: 'nursery-academic-calendar' },
      ],
    },
    {
      id: 'primary',
      title: 'Primary',
      items: [
        { id: '6', label: 'Primary Page Hero', section: 'primary-hero' },
        { id: '6a', label: 'Classes Gallery', section: 'content-primary-classes' },
        { id: '6b', label: 'Learning Activities Gallery', section: 'content-primary-learning' },
        { id: '6c', label: 'Extracurricular Gallery', section: 'content-primary-extracurricular' },
        { id: '6d', label: 'About', section: 'primary-about' },
        { id: '6e', label: 'Principal', section: 'primary-principal' },
        { id: '6f', label: 'Academic Calendar', section: 'primary-academic-calendar' },
      ],
    },
    {
      id: 'higher-secondary',
      title: 'Higher Secondary',
      items: [
        { id: '7', label: 'Higher Secondary Hero', section: 'hs-hero' },
        { id: '7a', label: 'Classes Gallery', section: 'content-hs-classes' },
        { id: '7b', label: 'Learning Activities Gallery', section: 'content-hs-learning' },
        { id: '7c', label: 'Extracurricular Gallery', section: 'content-hs-extracurricular' },
        { id: '7d', label: 'About', section: 'hs-about' },
        { id: '7e', label: 'Principal', section: 'hs-principal' },
        { id: '7f', label: 'Academic Calendar', section: 'hs-academic-calendar' },
        { id: '7g', label: 'Courses Offered (Class XI)', section: 'hs-courses' },
        { id: '7h', label: 'Achievers', section: 'hs-achievers' },
        { id: '7i', label: 'Alumni', section: 'hs-alumni' },
        { id: '7j', label: 'Sports Categories', section: 'hs-sports' },
        { id: '7k', label: 'Sports Achievements', section: 'hs-sports-achievements' },
        { id: '7l', label: 'Academic Information', section: 'hs-academic-information' },
        { id: '7m', label: 'Clubs', section: 'hs-clubs' },
      ],
    },
    {
      id: 'common',
      title: 'Common Sections',
      items: [
        { id: '2', label: 'Leadership Profiles', section: 'leadership' },
        { id: '3a', label: 'Group of Schools – Infrastructure', section: 'content-infrastructure' },
        { id: '8', label: 'Excellence & Toppers', section: 'excellence' },
        { id: '9', label: 'Campus Life & Alumni', section: 'campus-life' },
      ],
    },
  ];

  return (
    <AdminLayout
      activeSection={activeSection}
      onSectionChange={(section) => setActiveSection(section as AdminSection)}
      navGroups={navGroups}
    >
      {activeSection === 'home-hero' && <HomeHeroManager />}
      {activeSection === 'leadership' && <LeadershipPhotosManager />}
      {activeSection === 'school-sections' && <SchoolSectionsManager />}
      {activeSection === 'content-infrastructure' && <InfrastructureGalleryManager />}
      {activeSection === 'hero-3d' && <Hero3DCardsManager />}
      {activeSection === 'nursery-hero' && (
        <SchoolPageHeroManager
          pageKey="nursery"
          pageTitle="Nursery"
          pagePath="/nursery"
          description="Manage the background images for the Nursery page hero carousel. Add, remove, or reorder images."
        />
      )}
      {activeSection === 'nursery-academic-calendar' && (
        <Suspense
          fallback={
            <p className="text-sm text-school-muted" role="status">
              Loading the Nursery calendar manager…
            </p>
          }
        >
          <NurseryAcademicCalendarManager />
        </Suspense>
      )}
      {activeSection === 'primary-hero' && (
        <SchoolPageHeroManager
          pageKey="primary"
          pageTitle="Primary"
          pagePath="/primary"
          description="Manage the background images for the Primary page hero carousel, including the location photo."
        />
      )}
      {activeSection === 'content-nursery-classes' && <NurseryClassesGalleryManager />}
      {activeSection === 'content-nursery-learning' && <NurseryLearningActivitiesGalleryManager />}
      {activeSection === 'content-nursery-extracurricular' && <NurseryExtracurricularGalleryManager />}
      {activeSection === 'nursery-about' && <NurseryAboutManager />}
      {activeSection === 'nursery-principal' && <NurseryPrincipalManager />}
      {activeSection === 'content-primary-classes' && <PrimaryClassesGalleryManager />}
      {activeSection === 'content-primary-learning' && <PrimaryLearningActivitiesGalleryManager />}
      {activeSection === 'content-primary-extracurricular' && <PrimaryExtracurricularGalleryManager />}
      {activeSection === 'content-hs-classes' && <HigherSecondaryClassesGalleryManager />}
      {activeSection === 'content-hs-learning' && <HigherSecondaryLearningActivitiesGalleryManager />}
      {activeSection === 'content-hs-extracurricular' && <HigherSecondaryExtracurricularGalleryManager />}
      {activeSection === 'primary-principal' && <PrimaryPrincipalManager />}
      {activeSection === 'hs-about' && <HigherSecondaryAboutManager />}
      {activeSection === 'hs-hero' && (
        <SchoolPageHeroManager
          pageKey="higherSecondary"
          pageTitle="Higher Secondary"
          pagePath="/higher-secondary"
          description="Manage the background images for the Higher Secondary page hero carousel."
        />
      )}
      {activeSection === 'hs-achievers' && <AchieversManager />}
      {activeSection === 'hs-alumni' && <AlumniManager />}
      {activeSection === 'hs-sports' && <SportsManager />}
      {activeSection === 'hs-sports-achievements' && <SportsAchievementsManager />}
      {activeSection === 'hs-academic-information' && <AcademicInformationManager />}
      {activeSection === 'hs-clubs' && <ClubsManager />}
      {activeSection === 'excellence' && <ExcellenceManager />}
      {activeSection === 'campus-life' && <CampusLifeManager />}
      {activeSection === 'primary-about' && <PrimaryAboutManager />}
      {activeSection === 'primary-academic-calendar' && <PrimaryAcademicCalendarManager />}
      {activeSection === 'hs-academic-calendar' && <HigherSecondaryAcademicCalendarManager />}
      {activeSection === 'hs-courses' && <CoursesOfferedManager />}
      {activeSection === 'hs-principal' && <HigherSecondaryPrincipalManager />}
    </AdminLayout>
  );
}
