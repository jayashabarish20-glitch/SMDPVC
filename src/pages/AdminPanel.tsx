import { lazy, Suspense, useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
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
  | 'excellence'
  | 'campus-life';

export function AdminPanel() {
  const [activeSection, setActiveSection] = useState<AdminSection>('home-hero');

  const navItems = [
    { id: '1', label: 'Home Page Hero Carousel', section: 'home-hero' as AdminSection },
    { id: '2', label: 'Leadership Profiles', section: 'leadership' as AdminSection },
    { id: '3', label: 'School Sections Cards', section: 'school-sections' as AdminSection },
    { id: '3a', label: 'Group of Schools – Infrastructure', section: 'content-infrastructure' as AdminSection },
    { id: '4', label: 'Hero 3D Cards', section: 'hero-3d' as AdminSection },
    { id: '5', label: 'Nursery Page Hero', section: 'nursery-hero' as AdminSection },
    { id: '5a', label: 'Nursery – Classes Gallery', section: 'content-nursery-classes' as AdminSection },
    { id: '5b', label: 'Nursery – Learning Activities Gallery', section: 'content-nursery-learning' as AdminSection },
    { id: '5c', label: 'Nursery – Extracurricular Gallery', section: 'content-nursery-extracurricular' as AdminSection },
    { id: '5d', label: 'Nursery – About', section: 'nursery-about' as AdminSection },
    { id: '5e', label: 'Nursery – Principal', section: 'nursery-principal' as AdminSection },
    { id: '5f', label: 'Nursery – Academic Calendar', section: 'nursery-academic-calendar' as AdminSection },
    { id: '6', label: 'Primary Page Hero', section: 'primary-hero' as AdminSection },
    { id: '6a', label: 'Primary – Classes Gallery', section: 'content-primary-classes' as AdminSection },
    { id: '6b', label: 'Primary – Learning Activities Gallery', section: 'content-primary-learning' as AdminSection },
    { id: '6c', label: 'Primary – Extracurricular Gallery', section: 'content-primary-extracurricular' as AdminSection },
    { id: '6d', label: 'Primary – About', section: 'primary-about' as AdminSection },
    { id: '6e', label: 'Primary – Principal', section: 'primary-principal' as AdminSection },
    { id: '6f', label: 'Primary – Academic Calendar', section: 'primary-academic-calendar' as AdminSection },
    { id: '7', label: 'Higher Secondary Hero', section: 'hs-hero' as AdminSection },
    { id: '7a', label: 'Higher Secondary – Classes Gallery', section: 'content-hs-classes' as AdminSection },
    { id: '7b', label: 'Higher Secondary – Learning Activities Gallery', section: 'content-hs-learning' as AdminSection },
    { id: '7c', label: 'Higher Secondary – Extracurricular Gallery', section: 'content-hs-extracurricular' as AdminSection },
    { id: '7d', label: 'Higher Secondary – About', section: 'hs-about' as AdminSection },
    { id: '7e', label: 'Higher Secondary – Principal', section: 'hs-principal' as AdminSection },
    { id: '7f', label: 'Higher Secondary – Academic Calendar', section: 'hs-academic-calendar' as AdminSection },
    { id: '7g', label: 'Higher Secondary – Courses Offered (Class XI)', section: 'hs-courses' as AdminSection },
    { id: '8', label: 'Excellence & Toppers', section: 'excellence' as AdminSection },
    { id: '9', label: 'Campus Life & Alumni', section: 'campus-life' as AdminSection },
  ];

  return (
    <AdminLayout
      activeSection={activeSection}
      onSectionChange={(section) => setActiveSection(section as AdminSection)}
      navItems={navItems}
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
