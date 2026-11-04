import { useState } from 'react';
import { Icon } from '../Icon';

interface NavItem {
  id: string;
  label: string;
  section: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  navItems: NavItem[];
}

export function AdminLayout({
  children,
  activeSection,
  onSectionChange,
  navItems,
}: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-school-cream">
      {/* Sidebar Navigation */}
      <nav className="hidden w-64 overflow-y-auto border-r border-school-navy/10 bg-white lg:flex lg:flex-col">
        <div className="sticky top-0 border-b border-school-navy/10 bg-white p-6">
          <h1 className="font-serif text-2xl font-bold text-school-navy">
            Admin Panel
          </h1>
          <p className="mt-1 text-xs text-school-muted">Photo Management</p>
        </div>

        <div className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.section)}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                activeSection === item.section
                  ? 'bg-school-gold/15 text-school-navy shadow-sm'
                  : 'text-school-muted hover:bg-school-cream hover:text-school-navy'
              }`}
            >
              {item.label}
            </button>
          ))}
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
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.section);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                      activeSection === item.section
                        ? 'bg-school-gold/15 text-school-navy'
                        : 'text-school-muted hover:bg-school-cream'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
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
