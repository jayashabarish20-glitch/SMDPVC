import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { AdminLogout } from './AdminLogout';
import { AdminSidebarGroup } from './AdminSidebarGroup';

export interface NavItem {
  id: string;
  label: string;
  section: string;
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  navGroups: NavGroup[];
}

export function AdminLayout({
  children,
  activeSection,
  onSectionChange,
  navGroups,
}: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeGroupId = navGroups.find((group) =>
    group.items.some((item) => item.section === activeSection)
  )?.id;

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(activeGroupId ? [activeGroupId] : [])
  );

  // Ensure the group holding the active section is expanded whenever it changes.
  useEffect(() => {
    if (!activeGroupId) return;
    setOpenGroups((prev) => (prev.has(activeGroupId) ? prev : new Set(prev).add(activeGroupId)));
  }, [activeGroupId]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const renderGroups = (
    idPrefix: string,
    onSelect: (section: string) => void,
    variant: 'desktop' | 'mobile'
  ) =>
    navGroups.map((group) => (
      <AdminSidebarGroup
        key={group.id}
        groupId={group.id}
        title={group.title}
        idPrefix={idPrefix}
        isOpen={openGroups.has(group.id)}
        containsActive={group.id === activeGroupId}
        onToggle={() => toggleGroup(group.id)}
      >
        {group.items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.section)}
            className={
              variant === 'desktop'
                ? `w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                    activeSection === item.section
                      ? 'bg-school-gold/15 text-school-navy shadow-sm'
                      : 'text-school-muted hover:bg-school-cream hover:text-school-navy'
                  }`
                : `w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                    activeSection === item.section
                      ? 'bg-school-gold/15 text-school-navy'
                      : 'text-school-muted hover:bg-school-cream'
                  }`
            }
          >
            {item.label}
          </button>
        ))}
      </AdminSidebarGroup>
    ));

  return (
    <div className="flex h-screen bg-school-cream">
      {/* Sidebar Navigation */}
      <nav className="hidden w-64 overflow-y-auto border-r border-school-navy/10 bg-white lg:flex lg:flex-col">
        <div className="sticky top-0 border-b border-school-navy/10 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-school-navy">
                Admin Panel
              </h1>
              <p className="mt-1 text-xs text-school-muted">Photo Management</p>
            </div>
            <AdminLogout />
          </div>
        </div>

        <div className="flex-1 space-y-3 p-4">
          {renderGroups('desktop', onSectionChange, 'desktop')}
        </div>

        <div className="border-t border-school-navy/10 p-4">
          <a
            href="/"
            className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-school-muted transition-colors hover:bg-school-cream hover:text-school-navy"
          >
            <Icon name="arrow" className="h-4 w-4 rotate-180" />
            Back to Website
          </a>
        </div>
      </nav>

      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-school-gold text-school-navy shadow-lg"
          aria-label="Toggle menu"
        >
          <Icon name={mobileMenuOpen ? 'x' : 'menu'} className="h-5 w-5" />
        </button>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-school-navy/50 backdrop-blur-sm">
            <div className="absolute right-0 top-0 h-full w-64 overflow-y-auto border-l border-school-navy/10 bg-white p-4">
              <div className="mb-4">
                <h1 className="font-serif text-2xl font-bold text-school-navy">
                  Admin
                </h1>
              </div>
              <div className="space-y-3">
                {renderGroups(
                  'mobile',
                  (section) => {
                    onSectionChange(section);
                    setMobileMenuOpen(false);
                  },
                  'mobile'
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
