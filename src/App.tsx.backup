import {
  useEffect,
  useState,
  type FormEventHandler,
  type ReactNode,
  type SVGProps,
} from "react";
import {
  heroSlides,
  managementMembers,
  managementMessages,
  schoolHistory,
  schoolIntroduction,
  schoolMission,
  schoolName,
  schoolPageContent,
  schoolSections,
  schoolVision,
} from "./data";

type IconName = "menu" | "close" | "arrow";
type PageKey = "home" | keyof typeof schoolPageContent;
type NavigationItem = { id: string; title: string };
type EnquiryField =
  | "parentName"
  | "studentName"
  | "contactNumber"
  | "email"
  | "section"
  | "currentClass"
  | "message";
type EnquiryErrors = Partial<Record<EnquiryField, string>>;

const homeNavigation: NavigationItem[] = [
  { id: "home", title: "Home" },
  { id: "about", title: "About Us" },
  { id: "foundation", title: "Our Foundation" },
  { id: "leadership", title: "Leadership" },
  { id: "school-sections", title: "School Sections" },
  { id: "enquiry", title: "Enquiry" },
];

function currentPage(): PageKey {
  const path = window.location.pathname.replace(/\/+$/, "").toLowerCase();
  if (path === "/nursery") return "nursery";
  if (path === "/primary") return "primary";
  if (path === "/higher-secondary") return "higher-secondary";
  return "home";
}

function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

const pageLabels: Record<PageKey, string> = {
  home: "School Home",
  nursery: "Nursery",
  primary: "Primary",
  "higher-secondary": "Higher Secondary",
};

function Logo({ page }: { page: PageKey }) {
  return (
    <a
      href="/"
      className="flex shrink-0 items-center gap-3"
      aria-label={`${schoolName} home`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9a84c] font-serif text-lg font-bold text-[#0f2044]">
        S
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-[#0f2044]">{schoolName}</span>
        <span className="mt-0.5 block text-[10px] uppercase leading-none tracking-widest text-[#7b6220]">
          {pageLabels[page]}
        </span>
      </span>
    </a>
  );
}

function Header({ page }: { page: PageKey }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sections: readonly NavigationItem[] =
    page === "home" ? homeNavigation : schoolPageContent[page].sections;
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (page === "home" || typeof IntersectionObserver === "undefined") return;

    setActiveSection(sections[0]?.id ?? "");
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visibleSection) setActiveSection(visibleSection.target.id);
      },
      { rootMargin: "-176px 0px -65% 0px", threshold: 0 },
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [page, sections]);

  useEffect(() => {
    if (page === "home" || !activeSection) return;
    const activeLink = document.querySelector<HTMLElement>(
      `[data-section-link="${activeSection}"]`,
    );
    const nav = activeLink?.closest<HTMLElement>("[data-school-section-nav]");
    if (!activeLink || !nav) return;

    const linkBounds = activeLink.getBoundingClientRect();
    const navBounds = nav.getBoundingClientRect();
    const left = nav.scrollLeft + linkBounds.left - navBounds.left;
    const right = left + linkBounds.width;

    if (left < nav.scrollLeft) {
      nav.scrollTo({ left, behavior: "smooth" });
    } else if (right > nav.scrollLeft + nav.clientWidth) {
      nav.scrollTo({ left: right - nav.clientWidth, behavior: "smooth" });
    }
  }, [activeSection, page]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#0f2044]/10 bg-white/95 shadow-sm backdrop-blur">
      {page === "home" ? (
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-5 sm:gap-4 sm:px-8 lg:px-16">
          <Logo page={page} />
          <>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={activeSection === section.id ? "location" : undefined}
                  onClick={() => setActiveSection(section.id)}
                  className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? "text-[#8c6b14]"
                      : "text-[#0f2044] hover:text-[#8c6b14]"
                  }`}
                >
                  {section.title}
                </a>
              ))}
            </nav>
            <button
              className="rounded p-2 text-[#0f2044] hover:bg-[#0f2044]/5 lg:hidden"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? "close" : "menu"} className="h-6 w-6" />
            </button>
          </>
        </div>
      ) : (
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-3 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-16">
          <Logo page={page} />
          <div className="min-w-0 flex-1">
            <nav
              data-school-section-nav
              className="overflow-x-auto border-b border-[#0f2044]/10 pb-2"
              aria-label={`${pageLabels[page]} page sections`}
            >
              <div className="flex w-max min-w-full justify-end gap-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    data-section-link={section.id}
                    aria-current={activeSection === section.id ? "location" : undefined}
                    onClick={() => setActiveSection(section.id)}
                    className={`shrink-0 whitespace-nowrap rounded px-3 py-2 text-xs font-semibold transition-colors lg:px-2 lg:text-[11px] ${
                      activeSection === section.id
                        ? "bg-[#14264B] text-white hover:bg-[#14264B] hover:text-white focus-visible:bg-[#14264B] focus-visible:text-white"
                        : "bg-white text-[#14264B] hover:bg-[#c9a84c]/35 hover:text-[#14264B] focus-visible:text-[#14264B]"
                    }`}
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </nav>
            <div className="flex justify-end pt-2">
              <a
                href="/"
                className="inline-flex shrink-0 rounded px-3 py-2 text-sm font-medium text-[#14264B] transition-colors hover:bg-[#c9a84c]/35 hover:text-[#14264B] focus-visible:text-[#14264B]"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      )}
      {page === "home" && menuOpen && (
        <nav
          id="mobile-navigation"
          className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-[#0f2044]/10 bg-white px-5 py-3 lg:hidden"
          aria-label="Mobile navigation"
        >
          {page !== "home" && (
            <a
              href="/"
              onClick={() => setMenuOpen(false)}
              className="block rounded px-3 py-3 text-sm font-semibold text-[#0f2044] hover:bg-[#faf8f3]"
            >
              Back to Home
            </a>
          )}
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={activeSection === section.id ? "location" : undefined}
              onClick={() => setMenuOpen(false)}
              className={`block rounded px-3 py-3 text-sm font-medium hover:bg-[#faf8f3] ${
                activeSection === section.id ? "text-[#8c6b14]" : "text-[#0f2044]"
              }`}
            >
              {section.title}
            </a>
          ))}
        </nav>
      )}
    </header>
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
    <div className="mb-10 max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a781c]">
        {eyebrow}
      </p>
      <h2
        className={`mt-2 font-serif text-3xl font-bold sm:text-4xl ${
          inverse ? "text-white" : "text-[#0f2044]"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-sm leading-7 ${inverse ? "text-white/75" : "text-[#526078]"}`}>
          {description}
        </p>
      )}
    </div>
  );
}

function Placeholder({
  title,
  detail = "School-approved information to be added.",
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#9a781c]/50 bg-[#fffdf7] p-5">
      <p className="text-sm font-semibold text-[#0f2044]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#526078]">{detail}</p>
    </div>
  );
}

function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = heroSlides[activeSlide];

  return (
    <section
      id="home"
      className="relative flex min-h-[560px] scroll-mt-20 flex-col justify-end overflow-hidden bg-[#0f2044] sm:min-h-[620px]"
      aria-label="School introduction"
    >
      <div
        aria-hidden="true"
        className="absolute -right-36 -top-32 h-[28rem] w-[28rem] rounded-full border border-white/10 bg-white/[0.03] sm:h-[40rem] sm:w-[40rem]"
      />
      <div
        aria-hidden="true"
        className="absolute right-10 top-16 h-48 w-48 rounded-full border border-[#c9a84c]/25 sm:right-32 sm:top-24 sm:h-72 sm:w-72"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f2044] via-[#0f2044]/95 to-[#0f2044]/60" />
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pb-20 pt-24 lg:px-16 lg:pb-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#e2c76f]">
            {slide.eyebrow}
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          <p className="mb-8 mt-5 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
            {slide.description}
          </p>
          <a
            href="#school-sections"
            className="inline-flex items-center gap-2 rounded-full bg-[#c9a84c] px-6 py-3 text-sm font-bold text-[#0f2044] transition-colors hover:bg-[#dec36e]"
          >
            Explore school sections <Icon name="arrow" className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div className="absolute bottom-5 right-6 z-10 flex items-center gap-2">
        {heroSlides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-label={`Show introduction slide ${index + 1}`}
            aria-pressed={index === activeSlide}
            onClick={() => setActiveSlide(index)}
            className={`h-2.5 rounded-full transition-all ${
              index === activeSlide ? "w-8 bg-[#c9a84c]" : "w-2.5 bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function AboutUs() {
  return (
    <section id="about" className="bg-[#faf8f3] py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
        <SectionHeading eyebrow="About the School" title="About Us" />
        <p className="max-w-3xl text-sm leading-7 text-[#526078]">{schoolIntroduction}</p>
        <div className="mt-8 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-[#0f2044]/5 sm:p-9">
          <h3 className="font-serif text-2xl font-bold text-[#0f2044]">History of the School</h3>
          <p className="mt-4 text-sm leading-7 text-[#526078]">{schoolHistory}</p>
        </div>
      </div>
    </section>
  );
}

function Foundation() {
  return (
    <section id="foundation" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
        <SectionHeading eyebrow="Our Values" title="Our Foundation" />
        <div className="grid gap-6 md:grid-cols-2">
          <article id="vision" className="scroll-mt-24 rounded-2xl bg-[#faf8f3] p-6 sm:p-8">
            <h3 className="font-serif text-2xl font-bold text-[#0f2044]">Vision</h3>
            <div className="mt-5">
              <Placeholder title={schoolVision.content} detail={schoolVision.detail} />
            </div>
          </article>
          <article id="mission" className="scroll-mt-24 rounded-2xl bg-[#faf8f3] p-6 sm:p-8">
            <h3 className="font-serif text-2xl font-bold text-[#0f2044]">Mission</h3>
            <div className="mt-5">
              <Placeholder title={schoolMission.content} detail={schoolMission.detail} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function ManagementMembers() {
  return (
    <div id="management-members" className="scroll-mt-24">
      <h3 className="mb-5 font-serif text-2xl font-bold text-[#0f2044]">Management Members</h3>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {managementMembers.map((member) => (
          <article
            key={`${member.name}-${member.designation}`}
            className="flex items-center gap-4 rounded-2xl border border-[#0f2044]/10 bg-[#faf8f3] p-5 sm:p-6"
          >
            {member.photo ? (
              <img
                className="h-20 w-20 shrink-0 rounded-full object-cover"
                src={member.photo}
                alt={`${member.name}, ${member.designation}`}
              />
            ) : (
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0f2044]/10 px-2 text-center text-xs font-medium text-[#526078]"
                role="img"
                aria-label={`Photo placeholder for ${member.name}`}
              >
                Photo placeholder
              </div>
            )}
            <div>
              <h4 className="font-semibold text-[#0f2044]">{member.name}</h4>
              <p className="mt-1 text-sm text-[#526078]">{member.designation}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ManagementMessages() {
  return (
    <div id="management-messages" className="mt-10 scroll-mt-24">
      <h3 className="mb-5 font-serif text-2xl font-bold text-[#0f2044]">
        Management Members&apos; Messages
      </h3>
      <div className="grid gap-5 md:grid-cols-2">
        {managementMessages.map((message, index) => (
          <article
            key={`${message.name}-${index}`}
            className="rounded-2xl bg-[#0f2044] p-6 text-white sm:p-8"
          >
            <div className="flex items-center gap-3">
              {message.photo && (
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={message.photo}
                  alt=""
                />
              )}
              <div>
                <p className="text-sm font-semibold">{message.name}</p>
                <p className="mt-1 text-xs text-white/65">{message.designation}</p>
              </div>
            </div>
            <p className="mt-5 font-serif text-xl font-semibold">{message.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Leadership() {
  return (
    <section id="leadership" className="bg-[#faf8f3] py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
        <SectionHeading
          eyebrow="Our People"
          title="Leadership"
          description="Verified management names, designations, photographs, and messages can be added when supplied by the school."
        />
        <ManagementMembers />
        <ManagementMessages />
      </div>
    </section>
  );
}

function SchoolSections() {
  return (
    <section id="school-sections" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
        <SectionHeading eyebrow="Explore" title="Our School Sections" />
        <div className="grid gap-5 md:grid-cols-3">
          {schoolSections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="group flex min-h-48 flex-col rounded-2xl bg-[#faf8f3] p-6 shadow-sm ring-1 ring-[#0f2044]/10 transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9a781c] sm:p-7"
            >
              <h3 className="font-serif text-2xl font-bold text-[#0f2044]">{section.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#526078]">{section.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#7b6220]">
                Explore section{" "}
                <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="mt-1 block text-xs font-medium text-red-700">
      {message}
    </span>
  );
}

function Enquiry() {
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<"idle" | "invalid" | "demo">("idle");

  const clearError = (field: EnquiryField) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (status === "invalid") setStatus("idle");
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (isChecking) return;

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    const parentName = String(values.parentName ?? "").trim();
    const studentName = String(values.studentName ?? "").trim();
    const contactNumber = String(values.contactNumber ?? "").trim();
    const email = String(values.email ?? "").trim();
    const section = String(values.section ?? "").trim();
    const message = String(values.message ?? "").trim();
    const digits = contactNumber.replace(/\D/g, "");
    const nextErrors: EnquiryErrors = {};

    if (!parentName) nextErrors.parentName = "Enter a parent or guardian name.";
    if (!studentName) nextErrors.studentName = "Enter the student's name.";
    if (
      !contactNumber ||
      !/^\+?[\d\s().-]+$/.test(contactNumber) ||
      digits.length < 7 ||
      digits.length > 15
    ) {
      nextErrors.contactNumber = "Enter a valid contact number with 7 to 15 digits.";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address or leave this field blank.";
    }
    if (!section) nextErrors.section = "Select the school section of interest.";
    if (!message) nextErrors.message = "Enter a message.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("invalid");
      return;
    }

    setStatus("idle");
    setIsChecking(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
    setIsChecking(false);
    setStatus("demo");
  };

  return (
    <section id="enquiry" className="bg-[#faf8f3] py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-6 lg:px-12">
        <SectionHeading
          eyebrow="Get in touch"
          title="Enquiry"
          description="This form is a demo only. It does not send or save enquiry information."
        />
        <form
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#0f2044]/10 sm:p-9"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#0f2044]">
              Parent/Guardian Name *
              <input
                className="form-field mt-2"
                type="text"
                name="parentName"
                autoComplete="name"
                required
                aria-invalid={Boolean(errors.parentName)}
                aria-describedby={errors.parentName ? "parent-name-error" : undefined}
                onChange={() => clearError("parentName")}
              />
              <FieldError id="parent-name-error" message={errors.parentName} />
            </label>
            <label className="block text-sm font-semibold text-[#0f2044]">
              Student Name *
              <input
                className="form-field mt-2"
                type="text"
                name="studentName"
                required
                aria-invalid={Boolean(errors.studentName)}
                aria-describedby={errors.studentName ? "student-name-error" : undefined}
                onChange={() => clearError("studentName")}
              />
              <FieldError id="student-name-error" message={errors.studentName} />
            </label>
            <label className="block text-sm font-semibold text-[#0f2044]">
              Contact Number *
              <input
                className="form-field mt-2"
                type="tel"
                name="contactNumber"
                autoComplete="tel"
                required
                aria-invalid={Boolean(errors.contactNumber)}
                aria-describedby={errors.contactNumber ? "contact-number-error" : undefined}
                onChange={() => clearError("contactNumber")}
              />
              <FieldError id="contact-number-error" message={errors.contactNumber} />
            </label>
            <label className="block text-sm font-semibold text-[#0f2044]">
              Email Address (optional)
              <input
                className="form-field mt-2"
                type="email"
                name="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                onChange={() => clearError("email")}
              />
              <FieldError id="email-error" message={errors.email} />
            </label>
            <label className="block text-sm font-semibold text-[#0f2044]">
              Interested Section *
              <select
                className="form-field mt-2"
                name="section"
                defaultValue=""
                required
                aria-invalid={Boolean(errors.section)}
                aria-describedby={errors.section ? "section-error" : undefined}
                onChange={() => clearError("section")}
              >
                <option value="" disabled>
                  Select a school section
                </option>
                {schoolSections.map((schoolSection) => (
                  <option key={schoolSection.key} value={schoolSection.title}>
                    {schoolSection.title}
                  </option>
                ))}
              </select>
              <FieldError id="section-error" message={errors.section} />
            </label>
            <label className="block text-sm font-semibold text-[#0f2044]">
              Current Class (optional)
              <input className="form-field mt-2" type="text" name="currentClass" />
            </label>
          </div>
          <label className="block text-sm font-semibold text-[#0f2044]">
            Message *
            <textarea
              className="form-field mt-2 min-h-32 resize-y"
              name="message"
              required
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "message-error" : undefined}
              onChange={() => clearError("message")}
            />
            <FieldError id="message-error" message={errors.message} />
          </label>
          {status === "invalid" && (
            <p className="text-sm font-medium text-red-700" role="alert">
              Please review the highlighted fields.
            </p>
          )}
          {status === "demo" && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              This is a demo form. Your enquiry was not sent or saved.
            </p>
          )}
          {isChecking && (
            <p className="text-sm text-[#526078]" role="status">
              Checking your details…
            </p>
          )}
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c9a84c] py-3 text-sm font-bold text-[#0f2044] transition-colors hover:bg-[#ddc16c] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isChecking}
          >
            {isChecking ? "Checking details…" : "Submit enquiry"}
            {!isChecking && <Icon name="arrow" className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <main>
      <Hero />
      <AboutUs />
      <Foundation />
      <Leadership />
      <SchoolSections />
      <Enquiry />
    </main>
  );
}

function PageIntro({ title }: { title: string }) {
  return (
    <section className="bg-[#0f2044] px-6 py-12 text-white sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e2c76f]">
          {schoolName}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
          Explore the {title} section of {schoolName}.
        </p>
      </div>
    </section>
  );
}

function PageSection({
  id,
  title,
  detail,
  children,
}: {
  id: string;
  title: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-10 even:bg-[#faf8f3] sm:py-14">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
        <h2 className="font-serif text-2xl font-bold text-[#0f2044] sm:text-3xl">{title}</h2>
        {detail && <p className="mt-3 text-sm leading-6 text-[#526078]">{detail}</p>}
        {children && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>}
      </div>
    </section>
  );
}

function SchoolPage({ page }: { page: Exclude<PageKey, "home"> }) {
  const content = schoolPageContent[page];

  return (
    <main className="school-page">
      <PageIntro title={content.title} />
      {content.sections.map((section) => (
        <PageSection key={section.id} id={section.id} title={section.title}>
          {"achievements" in section ? (
            section.achievements.map((achievement) => (
              <ResultPlaceholder
                key={achievement.title}
                title={achievement.title}
                fields={achievement.fields}
              />
            ))
          ) : (
            <Placeholder title={section.content} detail={section.detail} />
          )}
        </PageSection>
      ))}
    </main>
  );
}

function ResultPlaceholder({
  title,
  fields,
}: {
  title: string;
  fields: readonly string[];
}) {
  return (
    <article className="rounded-xl border border-dashed border-[#9a781c]/50 bg-[#fffdf7] p-5">
      <h3 className="font-semibold text-[#0f2044]">{title}</h3>
      <dl className="mt-3 space-y-2 text-sm text-[#526078]">
        {fields.map((field) => (
          <div key={field} className="flex flex-wrap gap-1">
            <dt className="font-medium">{field}:</dt>
            <dd>To be supplied</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function Footer() {
  return (
    <footer className="bg-[#080f22] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between lg:px-12">
        <p className="text-sm font-semibold">{schoolName}</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
          {homeNavigation.map((item) => (
            <a
              key={item.id}
              href={`/${item.id === "home" ? "" : `#${item.id}`}`}
              className="text-xs text-white/70 hover:text-[#e2c76f]"
            >
              {item.title}
            </a>
          ))}
          {schoolSections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="text-xs text-white/70 hover:text-[#e2c76f]"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

function App() {
  const page = currentPage();
  const pageTitle =
    page === "home" ? schoolName : `${schoolPageContent[page].title} | ${schoolName}`;

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <>
      <Header page={page} />
      {page === "home" ? <HomePage /> : <SchoolPage page={page} />}
      <Footer />
    </>
  );
}

export default App;
