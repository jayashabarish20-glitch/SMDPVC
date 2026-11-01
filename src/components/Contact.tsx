import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { schoolContact } from "../homepageContent";
import { Icon } from "./Icon";

export function Contact() {
  const shouldReduceMotion = useReducedMotion();
  const hasContactDetails =
    Boolean(schoolContact.address) ||
    schoolContact.phoneNumbers.length > 0 ||
    schoolContact.emailAddresses.length > 0 ||
    Boolean(schoolContact.website) ||
    Boolean(schoolContact.workingHours);

  return (
    <section
      id="enquiry"
      className="relative scroll-mt-20 overflow-hidden bg-school-navy py-24 text-white lg:py-36"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-school-gold">
            Contact Information &amp; Location
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Visit Our School
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Connect with SMDPVC for school information, admissions enquiries,
            and assistance.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 shadow-[0_20px_55px_rgba(0,0,0,0.2)] sm:p-9"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-school-gold">
              School Contact Information
            </p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-white">
              {schoolContact.schoolName}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Contact details will be added after they are confirmed by the school.
            </p>

            <div className="mt-7 space-y-5">
              <ContactRow icon="pin" label="Postal address">
                {schoolContact.address ? (
                  schoolContact.mapsUrl ? (
                    <a
                      href={schoolContact.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm leading-relaxed text-white/85 transition-colors hover:text-school-gold-light"
                    >
                      {schoolContact.address}
                    </a>
                  ) : (
                    <p className="text-sm leading-relaxed text-white/85">
                      {schoolContact.address}
                    </p>
                  )
                ) : (
                  <p className="text-sm leading-relaxed text-white/55">
                    Address to be confirmed
                  </p>
                )}
              </ContactRow>

              <ContactRow icon="phone" label="Phone">
                {schoolContact.phoneNumbers.length ? (
                  <div className="space-y-1">
                    {schoolContact.phoneNumbers.map((contact) => (
                      <a
                        key={`${contact.label}-${contact.number}`}
                        href={`tel:${contact.number.replace(/[^\d+]/g, "")}`}
                        className="block text-sm text-white/85 transition-colors hover:text-school-gold-light"
                      >
                        {contact.label}: {contact.number}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/55">Phone number to be confirmed</p>
                )}
              </ContactRow>

              <ContactRow icon="mail" label="Email">
                {schoolContact.emailAddresses.length ? (
                  <div className="space-y-1 break-all">
                    {schoolContact.emailAddresses.map((contact) => (
                      <a
                        key={`${contact.label}-${contact.address}`}
                        href={`mailto:${contact.address}`}
                        className="block text-sm text-white/85 transition-colors hover:text-school-gold-light"
                      >
                        {contact.label}: {contact.address}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/55">Email address to be confirmed</p>
                )}
              </ContactRow>

              {(schoolContact.website || schoolContact.workingHours) && (
                <ContactRow icon="compass" label="More information">
                  <div className="space-y-1 text-sm text-white/85">
                    {schoolContact.website && (
                      <a
                        href={schoolContact.website}
                        target="_blank"
                        rel="noreferrer"
                        className="block hover:text-school-gold-light"
                      >
                        {schoolContact.website}
                      </a>
                    )}
                    {schoolContact.workingHours && <p>{schoolContact.workingHours}</p>}
                  </div>
                </ContactRow>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative min-h-80 overflow-hidden rounded-3xl border border-white/15 bg-school-deep shadow-[0_20px_55px_rgba(0,0,0,0.25)] sm:min-h-[440px]"
          >
            {schoolContact.mapEmbedUrl ? (
              <iframe
                title={`${schoolContact.schoolName} location map`}
                src={schoolContact.mapEmbedUrl}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--color-school-navy-light),_var(--color-school-deep)_70%)] px-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-school-gold/30 bg-white/5 text-school-gold">
                  <Icon name="pin" className="h-8 w-8" />
                </span>
                <h3 className="mt-5 font-serif text-xl font-bold text-white">
                  School Location
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
                  A map preview and directions will appear here when the school's
                  address and map location are verified.
                </p>
              </div>
            )}

            {schoolContact.mapsUrl && (
              <motion.a
                href={schoolContact.mapsUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-school-gold-light to-school-gold px-5 py-3 text-xs font-bold text-school-navy shadow-lg sm:bottom-7 sm:px-7 sm:text-sm"
              >
                <Icon name="pin" className="h-4 w-4" />
                Open in Maps
                <Icon name="arrow" className="h-4 w-4" />
              </motion.a>
            )}
          </motion.div>
        </div>

        {!hasContactDetails && (
          <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
            Contact fields are editable in the homepage content data and are intentionally unfilled until verified.
          </p>
        )}
      </div>
    </section>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: "pin" | "phone" | "mail" | "compass";
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 border-t border-white/10 pt-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-school-gold/10 text-school-gold">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h4 className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-school-gold-light">
          {label}
        </h4>
        {children}
      </div>
    </div>
  );
}
