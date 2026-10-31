import { useEffect, useState } from "react";
import { schoolBrandingByRoute } from "./homepageContent";
import { schoolPages } from "./schoolPageData";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Icon, scrollToSection } from "./components/Icon";
import { Leadership } from "./components/Leadership";
import { SchoolPage } from "./components/SchoolPage";
import { SchoolSections } from "./components/SchoolSections";

function currentPath() {
  const path = window.location.pathname.replace(/\/+$/, "");
  return path || "/";
}

export function App() {
  const [path, setPath] = useState(currentPath);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const page = schoolPages[path.slice(1)];

  useEffect(() => {
    const handleNavigation = () => {
      setPath(currentPath());
      window.scrollTo(0, 0);
    };
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    const handleRouteClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;

      const destination = new URL(link.href);
      const destinationPath = destination.pathname.replace(/\/+$/, "") || "/";
      if (
        destination.origin !== window.location.origin ||
        !(destinationPath in schoolBrandingByRoute) ||
        (destinationPath === currentPath() && destination.hash)
      ) {
        return;
      }

      event.preventDefault();
      window.history.pushState({}, "", destination.href);
      setPath(destinationPath);
      setShowScrollTop(false);
      window.scrollTo(0, 0);
    };

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleRouteClick);
    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleRouteClick);
    };
  }, []);

  const branding =
    schoolBrandingByRoute[path as keyof typeof schoolBrandingByRoute] ??
    schoolBrandingByRoute["/"];
  return (
    <div className="min-h-screen bg-school-cream text-school-navy selection:bg-school-gold/25 selection:text-school-navy">
      <Header key={path} page={page} branding={branding} />
      {page ? (
        <SchoolPage page={page} />
      ) : (
        <main>
          <Hero />
          <About />
          <Leadership />
          <SchoolSections />
          <Contact />
        </main>
      )}
      <Footer />
      {showScrollTop && (
        <button
          type="button"
          aria-label="Scroll to top"
          onClick={() =>
            scrollToSection(page?.sections[0]?.id ?? "home")
          }
          className="fixed bottom-7 right-7 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-school-navy text-school-gold shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Icon name="up" className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default App;
