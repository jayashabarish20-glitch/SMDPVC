import { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { HomeHeroManager } from '../components/admin/HomeHeroManager';
import { LeadershipPhotosManager } from '../components/admin/LeadershipPhotosManager';
import { SchoolSectionsManager } from '../components/admin/SchoolSectionsManager';
import { Hero3DCardsManager } from '../components/admin/Hero3DCardsManager';
import { SchoolPageHeroManager } from '../components/admin/SchoolPageHeroManager';
import { ExcellenceManager } from '../components/admin/ExcellenceManager';
import { CampusLifeManager } from '../components/admin/CampusLifeManager';
import { PrimaryClassesGalleryManager } from '../components/admin/PrimaryClassesGalleryManager';
import { PrimaryAboutManager } from '../components/admin/PrimaryAboutManager';
import { NurseryClassesManager } from '../components/admin/NurseryClassesManager';
import { ContentItemsManager } from '../components/admin/ContentItemsManager';

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
  | 'hero-3d'
  | 'nursery-hero'
  | 'primary-hero'
  | 'primary-classes-gallery'
  | 'primary-about'
  | 'hs-hero'
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
    { id: '5a', label: 'Nursery – Classes', section: 'content-nursery-classes' as AdminSection },
    { id: '5b', label: 'Nursery – Learning Activities', section: 'content-nursery-learning' as AdminSection },
    { id: '5c', label: 'Nursery – Extracurricular', section: 'content-nursery-extracurricular' as AdminSection },
    { id: '6', label: 'Primary Page Hero', section: 'primary-hero' as AdminSection },
    { id: '6a', label: 'Primary – Classes', section: 'content-primary-classes' as AdminSection },
    { id: '6b', label: 'Primary – Learning Activities', section: 'content-primary-learning' as AdminSection },
    { id: '6c', label: 'Primary – Extracurricular', section: 'content-primary-extracurricular' as AdminSection },
    { id: '6d', label: 'Primary – Classes Gallery', section: 'primary-classes-gallery' as AdminSection },
    { id: '6e', label: 'Primary – About', section: 'primary-about' as AdminSection },
    { id: '7', label: 'Higher Secondary Hero', section: 'hs-hero' as AdminSection },
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
      {activeSection === 'content-infrastructure' && <ContentItemsManager />}
      {activeSection === 'hero-3d' && <Hero3DCardsManager />}
      {activeSection === 'nursery-hero' && (
        <SchoolPageHeroManager
          pageKey="nursery"
          pageTitle="Nursery"
          pagePath="/nursery"
          description="Manage the background images for the Nursery page hero carousel. Add, remove, or reorder images."
        />
      )}
      {activeSection === 'primary-hero' && (
        <SchoolPageHeroManager
          pageKey="primary"
          pageTitle="Primary"
          pagePath="/primary"
          description="Manage the background images for the Primary page hero carousel, including the location photo."
        />
      )}
      {activeSection === 'content-nursery-classes' && <NurseryClassesManager />}
      {activeSection === 'content-nursery-learning' && <ContentItemsManager />}
      {activeSection === 'content-nursery-extracurricular' && <ContentItemsManager />}
      {activeSection === 'content-primary-classes' && <ContentItemsManager />}
      {activeSection === 'content-primary-learning' && <ContentItemsManager />}
      {activeSection === 'content-primary-extracurricular' && <ContentItemsManager />}
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
      {activeSection === 'primary-classes-gallery' && <PrimaryClassesGalleryManager />}
      {activeSection === 'primary-about' && <PrimaryAboutManager />}
    </AdminLayout>
  );
}
