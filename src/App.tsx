import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
  type SVGProps,
} from "react";
import {
  accreditation,
  admissionSteps,
  campusImages,
  centumScores,
  clubs,
  heroSlides,
  navItems,
  sportsAchievements,
  streams,
  toppers10,
} from "./data";

type IconName = "menu" | "close" | "arrow" | "up" | "check";

function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  const shared = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  const paths: Record<IconName, ReactNode> = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    up: <path d="m6 14 6-6 6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...shared} {...props}>
      {paths[name]}
    </svg>
  );
}

function Logo({ darkText = false }: { darkText?: boolean }) {
  return (
    <a
      href="#home"
      className="flex shrink-0 items-center gap-3"
      aria-label="Saraswathi Vidyalaya home"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9a84c] font-serif text-lg font-bold text-[#0f2044] shadow-sm">
        S
      </span>
      <span className="leading-tight">
        <span className={`block text-sm font-bold ${darkText ? "text-[#0f2044]" : "text-white"}`}>
          Saraswathi Vidyalaya
        </span>
        <span className="mt-0.5 block text-[10px] uppercase leading-none tracking-widest text-[#c9a84c]">
          Higher Secondary School
        </span>
      </span>
    </a>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const navigate = (id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "bg-white/95 shadow-sm backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:h-20 lg:px-16">
        <Logo darkText={scrolled || menuOpen} />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors hover:text-[#c9a84c] ${
                scrolled ? "text-[#0f2044]" : "text-white"
              }`}
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            className="ml-3 rounded-full bg-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-[#0f2044] transition-colors hover:bg-[#d9bd70]"
            onClick={() => navigate("admissions")}
          >
            Enquire Now
          </button>
        </nav>

        <button
          className={`p-2 text-white lg:hidden ${
            scrolled || menuOpen ? "text-[#0f2044]" : ""
          }`}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Toggle menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? "close" : "menu"} className="h-6 w-6" />
        </button>
      </div>

      {menuOpen && (
        <nav
          className="border-t border-[#0f2044]/10 bg-[#0f2044] px-6 py-4 lg:hidden"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              className="block w-full py-3 text-left text-sm font-medium text-white/85 transition-colors hover:text-[#c9a84c]"
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            className="mt-2 rounded-full bg-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-[#0f2044]"
            onClick={() => navigate("admissions")}
          >
            Enquire Now
          </button>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % heroSlides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const slide = heroSlides[activeSlide];

  return (
    <section
      id="home"
      className="relative flex min-h-[600px] h-screen flex-col justify-end overflow-hidden"
      aria-label="Welcome"
    >
      {campusImages.hero.map((image, index) => (
        <div
          key={`hero-slide-${index}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === activeSlide ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          <img
            className="h-full w-full object-cover"
            src={image}
            alt=""
            fetchPriority={index === 0 ? "high" : "auto"}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f2044]/90 via-[#0f2044]/45 to-[#0f2044]/35" />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pb-20 lg:px-16 lg:pb-28">
        <div className="max-w-3xl">
          <span className="mb-5 inline-flex rounded-full border border-[#c9a84c]/50 bg-[#0f2044]/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#e2c76f] backdrop-blur-sm">
            {slide.badge}
          </span>
          <h1 className="mb-4 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            {slide.title}
          </h1>
          <p className="mb-8 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
            {slide.description}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-[#c9a84c] hover:bg-white/10"
              onClick={() => scrollToSection("academics")}
            >
              Explore Academics
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-[#c9a84c] px-6 py-3 text-sm font-bold text-[#0f2044] transition-all hover:bg-[#dec36e]"
              onClick={() => scrollToSection("admissions")}
            >
              Admission 2026–27
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-7 right-6 z-10 flex items-center gap-2 lg:right-16">
        {heroSlides.map((item, index) => (
          <button
            key={item.title}
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === activeSlide}
            onClick={() => setActiveSlide(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === activeSlide ? "w-8 bg-[#c9a84c]" : "w-2.5 bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function Statistics() {
  const stats = [
    { value: "147+", label: "Centum Scores" },
    { value: "68 Yrs", label: "Years of Legacy" },
    { value: "2,400+", label: "University Placements" },
    { value: "98%", label: "Pass Rate" },
  ];

  return (
    <div className="bg-[#0f2044] text-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 px-6 py-9 lg:grid-cols-4 lg:px-16 lg:py-12">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`px-3 py-4 text-center sm:px-6 ${
              index > 0 ? "border-l border-white/15" : ""
            }`}
          >
            <p className="font-serif text-3xl font-bold text-[#c9a84c] sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65 sm:text-xs">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  inverse?: boolean;
}) {
  return (
    <div className="mb-12 text-center lg:mb-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a84c]">
        {eyebrow}
      </p>
      <h2
        className={`mt-2 font-serif text-3xl font-bold sm:text-4xl lg:text-5xl ${
          inverse ? "text-white" : "text-[#0f2044]"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mx-auto mt-4 max-w-3xl text-sm leading-7 ${
            inverse ? "text-white/70" : "text-[#42506a]"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-[#faf8f3] py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-16">
        <SectionHeading eyebrow="Our Foundation" title="About Saraswathi Vidyalaya" />

        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-[#0f2044]/5 sm:p-9">
            <span className="text-3xl" aria-hidden="true">🎯</span>
            <h3 className="mt-4 font-serif text-2xl font-bold text-[#0f2044]">Our Vision</h3>
            <p className="mt-3 text-sm leading-7 text-[#526078]">
              To be a beacon of academic excellence — nurturing intellectually curious,
              ethically grounded, and globally competent citizens who contribute
              meaningfully to society.
            </p>
          </article>
          <article className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-[#0f2044]/5 sm:p-9">
            <span className="text-3xl" aria-hidden="true">🌱</span>
            <h3 className="mt-4 font-serif text-2xl font-bold text-[#0f2044]">Our Mission</h3>
            <p className="mt-3 text-sm leading-7 text-[#526078]">
              We commit to delivering holistic, student-centred education through inspired
              teaching, character development, and a rich co-curricular ecosystem that
              unlocks every child&apos;s potential.
            </p>
          </article>
        </div>

        <div className="mt-20 grid items-center gap-9 lg:mt-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a84c]">
              Principal&apos;s Desk
            </p>
            <h3 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#0f2044] sm:text-4xl">
              &ldquo;Excellence is not an act, but a habit we cultivate daily.&rdquo;
            </h3>
            <p className="mt-5 text-sm leading-7 text-[#526078]">
              Welcome to Saraswathi Vidyalaya — an institution where tradition and
              innovation walk hand in hand. For over six decades, we have been shaping
              young minds into responsible, compassionate, and accomplished individuals.
              We believe that every child is gifted, and our role is to discover and
              amplify that gift.
            </p>
            <div className="mt-6 border-l-2 border-[#c9a84c] pl-4">
              <p className="font-semibold text-[#0f2044]">
                Dr. Meenakshi Sundaram, M.Phil., Ph.D.
              </p>
              <p className="mt-1 text-xs text-[#68758a]">
                Principal &amp; Chief Academic Officer
              </p>
            </div>
          </div>
          <div className="h-72 overflow-hidden rounded-2xl shadow-lg sm:h-96">
            <img
              src={campusImages.principal}
              alt="Principal of Saraswathi Vidyalaya"
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          </div>
        </div>

        <div className="mt-20 lg:mt-24">
          <h3 className="mb-8 text-center font-serif text-2xl font-bold text-[#0f2044]">
            Board of Trustees
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {campusImages.trustees.map((person) => (
              <article
                key={person.name}
                className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-[#0f2044]/5 sm:p-6"
              >
                <img
                  src={person.image}
                  alt={person.name}
                  className="mx-auto h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
                  loading="lazy"
                />
                <p className="mt-4 text-sm font-semibold text-[#0f2044]">{person.name}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c]">
                  {person.role}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Academics() {
  return (
    <section id="academics" className="scroll-mt-20 bg-[#0f2044] py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-16">
        <SectionHeading
          eyebrow="Streams & Curriculum"
          title="Academic Programmes"
          description="Tamil Nadu State Board (HSC) affiliated streams designed for both academic depth and career readiness."
          inverse
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {streams.map((stream) => (
            <article
              key={stream.group}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-white transition-colors hover:bg-white/[0.1] sm:p-7"
            >
              <span className="text-3xl" aria-hidden="true">{stream.icon}</span>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c9a84c]">
                {stream.group}
              </p>
              <h3 className="mt-1 font-serif text-2xl font-bold">{stream.title}</h3>
              <ul className="mt-5 space-y-2 text-sm text-white/75">
                {stream.subjects.map((subject) => (
                  <li key={subject} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[#c9a84c]" />
                    {subject}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-white/10 pt-4 text-[10px] font-semibold uppercase tracking-widest text-white/55">
                {stream.medium}
              </p>
              <button
                className="mt-4 inline-flex items-center gap-2 text-left text-xs font-semibold text-[#c9a84c] underline underline-offset-2 transition-colors hover:text-white"
                onClick={() => scrollToSection("admissions")}
              >
                Curriculum Overview <Icon name="arrow" className="h-3.5 w-3.5" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

type AchievementsTab = "academic" | "sports";
type ClassTab = "12" | "10";

function Excellence() {
  const [tab, setTab] = useState<AchievementsTab>("academic");
  const [classTab, setClassTab] = useState<ClassTab>("12");
  const toppers = classTab === "12" ? campusImages.toppers12 : toppers10;

  return (
    <section id="excellence" className="scroll-mt-20 bg-[#faf8f3] py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-16">
        <SectionHeading eyebrow="Hall of Fame" title="Excellence Hub" />

        <div className="mb-9 flex flex-wrap justify-center gap-3">
          {(["academic", "sports"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-full px-7 py-2.5 text-sm font-semibold capitalize transition-all ${
                tab === value
                  ? "bg-[#0f2044] text-white shadow-md"
                  : "border border-[#0f2044]/15 bg-white text-[#0f2044] hover:border-[#c9a84c]"
              }`}
            >
              {value === "academic" ? "🎓 Academic" : "🏆 Sports & Athletics"}
            </button>
          ))}
        </div>

        {tab === "academic" ? (
          <>
            <div className="mb-8 flex justify-center gap-2">
              {(["12", "10"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={classTab === value}
                  onClick={() => setClassTab(value)}
                  className={`rounded-lg border-2 px-5 py-2 text-sm font-medium transition-colors ${
                    classTab === value
                      ? "border-[#0f2044] bg-[#0f2044] text-white"
                      : "border-[#0f2044]/15 text-[#0f2044] hover:border-[#c9a84c]"
                  }`}
                >
                  Class {value} Toppers
                </button>
              ))}
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {toppers.map((student, index) => (
                <article
                  key={student.name}
                  className={`relative rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-[#0f2044]/5 ${
                    index === 0 ? "md:-translate-y-2 md:shadow-lg" : ""
                  }`}
                >
                  {index === 0 && (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#c9a84c] px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0f2044]">
                      🥇 School Topper
                    </span>
                  )}
                  <img
                    src={student.image}
                    alt={student.name}
                    className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[#faf8f3]"
                    loading="lazy"
                  />
                  <h3 className="mt-4 font-serif text-xl font-bold text-[#0f2044]">
                    {student.name}
                  </h3>
                  <p className="mt-1 text-2xl font-bold text-[#c9a84c]">{student.score}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[#788399]">
                    {student.stream}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-12 rounded-2xl bg-[#0f2044] p-6 text-white sm:p-8">
              <h3 className="text-center font-serif text-xl font-bold sm:text-2xl">
                Subject-wise Centum Scorers — 2025
              </h3>
              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {centumScores.map((item) => (
                  <div
                    key={item.subject}
                    className="rounded-xl border border-white/10 bg-white/[0.06] p-4 text-center"
                  >
                    <p className="font-serif text-3xl font-bold text-[#c9a84c]">
                      {item.count}
                    </p>
                    <p className="mt-1 text-xs text-white/75">{item.subject}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid items-stretch gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {sportsAchievements.map((achievement) => (
                <article
                  key={achievement.title}
                  className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#0f2044]/5"
                >
                  <span className="mt-0.5 text-2xl" aria-hidden="true">🏆</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#0f2044]">{achievement.title}</h3>
                    <p className="mt-1 text-xs text-[#536079]">{achievement.sport}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c]">
                      {achievement.level} · {achievement.year}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <div className="min-h-72 overflow-hidden rounded-2xl bg-[#0f2044]">
              <img
                src={campusImages.sports}
                alt="Basketball representing the school's sports achievements"
                className="h-full min-h-72 w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CampusLife() {
  return (
    <section id="campus-life" className="scroll-mt-20 bg-[#0f2044] py-24 text-white lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-16">
        <SectionHeading eyebrow="Beyond Classrooms" title="Campus Life" inverse />

        <h3 className="mb-6 font-serif text-2xl font-bold">Student Clubs &amp; Activities</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <article
              key={club.title}
              className="rounded-xl border border-white/10 bg-white/[0.05] p-5 transition-colors hover:bg-white/[0.09] sm:p-6"
            >
              <span className="text-2xl" aria-hidden="true">{club.icon}</span>
              <h4 className="mt-3 font-semibold">{club.title}</h4>
              <p className="mt-2 text-xs leading-6 text-white/60">{club.description}</p>
            </article>
          ))}
        </div>

        <div className="mb-6 mt-20 flex flex-wrap items-center justify-between gap-4 lg:mt-24">
          <h3 className="font-serif text-2xl font-bold">Alumni Spotlight</h3>
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-[#c9a84c] transition-colors hover:text-white"
            onClick={() => scrollToSection("contact")}
          >
            View All Alumni <Icon name="arrow" className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {campusImages.alumni.map((person) => (
            <article key={person.name} className="rounded-2xl bg-white p-5 text-[#0f2044] sm:p-6">
              <div className="flex items-center gap-3">
                <img
                  src={person.image}
                  alt={person.name}
                  className="h-14 w-14 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <h4 className="text-sm font-bold">{person.name}</h4>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c]">
                    {person.batch}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold text-[#526078]">{person.role}</p>
              <blockquote className="mt-4 border-l-2 border-[#c9a84c] pl-3 text-xs italic leading-6 text-[#68758a]">
                &ldquo;{person.quote}&rdquo;
              </blockquote>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Admissions() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  };

  return (
    <section id="admissions" className="scroll-mt-20 bg-[#faf8f3] py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-16">
        <SectionHeading eyebrow="Admissions 2026–27" title="Begin Your Journey" />

        <div className="mb-14 grid gap-5 md:grid-cols-3">
          {admissionSteps.map((step) => (
            <article key={step.number} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#0f2044]/5">
              <span className="font-serif text-4xl font-bold text-[#c9a84c]/70">{step.number}</span>
              <h3 className="mt-3 font-serif text-xl font-bold text-[#0f2044]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#68758a]">{step.description}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-[#0f2044]/5">
          <div className="bg-[#0f2044] px-6 py-6 text-white sm:px-9">
            <h3 className="font-serif text-2xl font-bold">
              Request a Prospectus / Call Back
            </h3>
            <p className="mt-2 text-sm text-white/65">
              We typically respond within one business day.
            </p>
          </div>
          <form className="space-y-5 p-6 sm:p-9" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-[#0f2044]">
                Student Name *
                <input
                  className="form-field mt-2"
                  type="text"
                  name="studentName"
                  placeholder="Full name"
                  autoComplete="name"
                  required
                  onChange={() => setSubmitted(false)}
                />
              </label>
              <label className="block text-xs font-semibold text-[#0f2044]">
                Class Applying For *
                <select
                  className="form-field mt-2"
                  name="classApplyingFor"
                  defaultValue=""
                  required
                  onChange={() => setSubmitted(false)}
                >
                  <option value="" disabled>Select class</option>
                  <option>Class XI – Pure Science</option>
                  <option>Class XI – Bio Science</option>
                  <option>Class XI – Commerce &amp; CS</option>
                  <option>Class XI – Commerce &amp; Econ.</option>
                  <option>Class VI – VIII</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-[#0f2044]">
                Parent Contact *
                <input
                  className="form-field mt-2"
                  type="tel"
                  name="parentContact"
                  placeholder="+91 XXXXX XXXXX"
                  autoComplete="tel"
                  required
                  onChange={() => setSubmitted(false)}
                />
              </label>
              <label className="block text-xs font-semibold text-[#0f2044]">
                Email Address
                <input
                  className="form-field mt-2"
                  type="email"
                  name="email"
                  placeholder="parent@email.com"
                  autoComplete="email"
                  onChange={() => setSubmitted(false)}
                />
              </label>
            </div>
            <label className="block text-xs font-semibold text-[#0f2044]">
              Medium Preference
              <select
                className="form-field mt-2"
                name="medium"
                defaultValue=""
                onChange={() => setSubmitted(false)}
              >
                <option value="">Select medium</option>
                <option>English Medium</option>
                <option>Tamil Medium</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-[#0f2044]">
              Message
              <textarea
                className="form-field mt-2 min-h-28 resize-y"
                name="message"
                placeholder="Any specific questions or requirements..."
                onChange={() => setSubmitted(false)}
              />
            </label>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c9a84c] py-3 font-bold text-sm text-[#0f2044] transition-colors hover:bg-[#ddc16c]"
              type="submit"
            >
              Request Prospectus / Call Back <Icon name="arrow" className="h-4 w-4" />
            </button>
            {submitted && (
              <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
                Thank you. This demo form does not send or save your information.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const mapUrl =
    "https://www.google.com/maps/search/?api=1&query=No.+47%2C+Rajaji+Salai%2C+Kumbakonam+612001";

  return (
    <section id="contact" className="scroll-mt-20 bg-[#0f2044] py-24 text-white lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-16">
        <SectionHeading eyebrow="Get In Touch" title="Contact Us" inverse />
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <span className="text-2xl" aria-hidden="true">📍</span>
            <h3 className="mt-4 text-sm font-bold uppercase tracking-wider">Address</h3>
            <p className="mt-3 text-sm leading-6 text-white/65">
              No. 47, Rajaji Salai,<br />
              Kumbakonam – 612 001,<br />
              Tamil Nadu, India
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <span className="text-2xl" aria-hidden="true">📞</span>
            <h3 className="mt-4 text-sm font-bold uppercase tracking-wider">Phone</h3>
            <div className="mt-3 space-y-1 text-sm leading-6 text-white/65">
              <p>+91 435 242 1000</p>
              <p>+91 435 242 1001</p>
              <p>Admissions: +91 98421 00000</p>
            </div>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <span className="text-2xl" aria-hidden="true">✉️</span>
            <h3 className="mt-4 text-sm font-bold uppercase tracking-wider">Email</h3>
            <div className="mt-3 space-y-1 break-all text-sm leading-6 text-white/65">
              <p>principal@saraswathividyalaya.edu.in</p>
              <p>admissions@saraswathividyalaya.edu.in</p>
              <p>info@saraswathividyalaya.edu.in</p>
            </div>
          </article>
        </div>

        <div className="relative mt-8 h-64 overflow-hidden rounded-2xl bg-[#081022] sm:h-80">
          <img
            src={campusImages.location}
            alt="City view near the Saraswathi Vidyalaya campus"
            className="h-full w-full object-cover opacity-40"
            loading="lazy"
          />
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#c9a84c] px-5 py-3 text-xs font-bold text-[#0f2044] shadow-lg transition-colors hover:bg-[#dec36e]"
          >
            📍 Get Directions on Google Maps <Icon name="arrow" className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#080f22] text-white">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-16 lg:py-16">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9a84c] font-serif font-bold text-[#0f2044]">
              S
            </span>
            <p className="font-semibold">Saraswathi Vidyalaya HSS</p>
          </div>
          <p className="mt-4 max-w-xs text-xs leading-6 text-white/45">
            Affiliated to Tamil Nadu State Board of Secondary Education.
            <br />
            Affiliation No. TN/HSS/2024/04871
          </p>
          <div className="mt-5 flex gap-3 text-[10px] font-bold text-white/45" aria-label="Social channels">
            <span>FB</span><span>TW</span><span>YT</span><span>IN</span>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c9a84c]">
            Quick Links
          </h3>
          {navItems.map((item) => (
            <button
              key={item.id}
              className="mb-2 block text-left text-xs text-white/45 transition-colors hover:text-[#c9a84c]"
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c9a84c]">
            Accreditation
          </h3>
          <ul className="space-y-3">
            {accreditation.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-white/45">
                <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c9a84c]">
            Reach Us
          </h3>
          <address className="space-y-1 text-xs not-italic leading-6 text-white/45">
            <p>No. 47, Rajaji Salai</p>
            <p>Kumbakonam – 612 001</p>
            <p>Tamil Nadu, India</p>
            <p className="pt-2">+91 435 242 1000</p>
            <p>info@saraswathividyalaya.edu.in</p>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 text-[10px] text-white/35 sm:flex-row sm:items-center sm:justify-between lg:px-16">
          <p>© 2026 Saraswathi Vidyalaya Higher Secondary School. All rights reserved.</p>
          <p>Designed with <span className="text-[#c9a84c]">♥</span> for education</p>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const update = () => setShowTop(window.scrollY > 500);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <>
      <Header />
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
      <Footer />
      {showTop && (
        <button
          type="button"
          aria-label="Scroll to top"
          className="fixed bottom-8 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#c9a84c] text-[#0f2044] shadow-lg transition-all hover:-translate-y-1 hover:bg-[#dec36e] lg:right-8"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Icon name="up" className="h-5 w-5" />
        </button>
      )}
    </>
  );
}

export default App;
