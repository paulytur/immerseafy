import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Immerseafy Freediving for courses and enquiries.",
};

const contactDetails = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@immerseafy.com",
    href: "mailto:hello@immerseafy.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+63 917 136 4555",
    href: "tel:+639171364555",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Mabini, Batangas, Philippines",
    href: undefined,
  },
];

export default function ContactPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="page-container">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="section-heading">Contact Us</h1>
          <p className="mt-4 text-sand-muted">
            Have a question about courses or want to book a session? Send us a
            message or reach out directly.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ContactForm />

          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl font-semibold text-sand">
                Get in touch
              </h2>
              <ul className="mt-6 space-y-5">
                {contactDetails.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="eyebrow">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          className="mt-0.5 text-sm text-sand-muted transition-colors hover:text-sand"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm text-sand-muted">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-semibold text-sand">
                Follow us
              </h2>
              <div className="mt-4 flex gap-4">
                <a
                  href="https://www.instagram.com/immerseafy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-teal/25 px-4 py-2.5 text-sm text-sand-muted transition-colors hover:border-teal/50 hover:text-teal"
                >
                  <Instagram size={18} />
                  Instagram
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=100093683319927"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-teal/25 px-4 py-2.5 text-sm text-sand-muted transition-colors hover:border-teal/50 hover:text-teal"
                >
                  <Facebook size={18} />
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
