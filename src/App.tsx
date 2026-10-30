import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Statistics } from "./components/Statistics";
import { About } from "./components/About";
import { Academics } from "./components/Academics";
import { Excellence } from "./components/Excellence";
import { CampusLife } from "./components/CampusLife";
import { Admissions } from "./components/Admissions";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { Icon, scrollToSection } from "./components/Icon";

export function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-school-cream text-school-navy selection:bg-school-gold/25 selection:text-school-navy">
      {/* Floating Glassmorphic Header */}
      <Header />

      {/* Main Content Sections */}
      <main>
        <Hero />
        <Statistics />
        <About />
        <Academics />
        <Excellence />
        <CampusLife />
        <Admissions />
        <Contact />
      </main>

      {/* Minimalist Apple Dark Footer */}
      <Footer />

      {/* Back to top floating pill */}
      {showScrollTop && (
        <button
          type="button"
          aria-label="Scroll back to top"
          onClick={() => scrollToSection("home")}
          className="fixed bottom-7 right-7 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-school-navy text-school-gold shadow-2xl border border-white/20 backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Icon name="up" className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default App;
