import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Language } from "../types";

// Terms & Conditions — legal text is written in English only (see the "Language"
// clause: the English version prevails), so it is shown as-is in every site language.

interface Section {
  heading: string;
  paragraphs: Array<string | { lead: string; text: string }>;
  listIntro?: string;
  list?: string[];
}

const SECTIONS: Section[] = [
  {
    heading: "Parties to this Agreement",
    paragraphs: [
      "This Service is intended for private individuals, institutions, and companies located in the UAE and GCC countries listed on our website. Atelier Austinn Trading LLC will not trade with or provide any services to OFAC sanctioned countries in accordance with the laws of the UAE.",
      "Return policy does not apply to orders made by institutions or companies under a commercial arrangement.",
      "You must be 18 or older to place an order through this Service.",
      "All content on this website — including images, artwork, drawings, graphics, and text — is protected by worldwide copyright and proprietary laws. Atelier Austinn Trading LLC grants you a limited, non-transferable license to access and make personal use of this site. You may not download, duplicate, sell, or modify any portion of this site without express written authorization.",
    ],
  },
  {
    heading: "User Responsibilities",
    paragraphs: [
      "The User must be 18 or older to transact on this website. Minors are not permitted to register or place orders.",
    ],
  },
  {
    heading: "Privacy Policy",
    paragraphs: [
      "Atelier Austinn Trading LLC is committed to protecting your privacy. We are the sole owners of information collected on studioaustinn.com. Information is used exclusively for order processing and fulfillment. We do not sell, share, or rent your personal information to any third party.",
      "We may share information with trusted third-party service providers (such as payment processors and delivery partners) solely to fulfill your order. We may also disclose information to authorities where required by law.",
      "You have the right to access, amend, or request deletion of your personal data at any time by contacting us.",
      "If you make a payment on our website, your payment details are submitted directly to our payment provider via a secured connection. We do not store card details.",
    ],
  },
  {
    heading: "Ordering & Payment",
    paragraphs: [
      "A binding sales agreement between the User and Atelier Austinn Trading LLC is formed when the User receives an order confirmation email confirming availability and estimated delivery time.",
      "For made-to-order and custom pieces, payment must be received in full before production begins. Atelier Austinn Trading LLC reserves the right to refuse to process an order at its sole discretion.",
      "All prices are displayed in AED and are inclusive of UAE VAT. Delivery charges are calculated at checkout based on destination and order size. We accept payment by Visa and MasterCard credit/debit cards. The cardholder must retain a copy of transaction records and merchant policies.",
    ],
  },
  {
    heading: "Delivery & Storage",
    paragraphs: [
      "Delivery charges vary by destination and are stated at checkout. Delivery times vary by product and availability — please refer to each product's page for estimated timelines.",
      "In-stock items are dispatched within 24–72 hours of order approval. Made-to-order pieces carry a standard lead time of 2–4 weeks, subject to current production load. We will keep you informed of any delays.",
      "Atelier Austinn Trading LLC reserves the right to deliver items from the same order separately.",
      "Any closure, blockage, or disruption affecting maritime routes, ports, or shipping corridors due to geopolitical events, conflict, security incidents, or circumstances beyond our reasonable control may result in unforeseeable delays. In such circumstances, Atelier Austinn Trading LLC shall not be liable for resulting delays and delivery timelines shall be extended accordingly.",
      {
        lead: "Damage at Delivery:",
        text: "Atelier Austinn Trading LLC accepts responsibility for loss or damage occurring during delivery, provided the User or recipient alerts the driver immediately upon delivery. Damage claims will be denied if the driver is not informed at the time of delivery. The User must notify us of any refusal so we may arrange a replacement. Atelier Austinn Trading LLC reserves the right to repair or replace the damaged item at its sole discretion.",
      },
    ],
  },
  {
    heading: "Cancellations & Returns",
    paragraphs: [
      "As all pieces are made to order or carefully curated, we are unable to offer standard returns or exchanges. Please refer to our full Delivery & Returns Policy for details.",
      "Cancellations are accepted only before production has begun. Once a piece enters production, the order is final.",
      "For damaged or incorrect items, please contact us within 48 hours of receiving your order with photos of the item and packaging. Each case is reviewed individually.",
    ],
    listIntro: "No returns, exchanges, or refunds are offered on:",
    list: [
      "Made-to-order and custom pieces",
      "Pre-orders",
      "Items that have been used or are not in their original condition",
    ],
  },
  {
    heading: "Force Majeure",
    paragraphs: [
      "Atelier Austinn Trading LLC shall not be held liable for any delays or non-performance caused by circumstances beyond our reasonable control, including but not limited to: natural disasters, war or armed conflict, government actions, maritime disruptions, supply chain interruptions, or any other force majeure event. In such cases, delivery timelines will be extended for the duration reasonably required, with no liability to Atelier Austinn Trading LLC for resulting losses, penalties, or claims.",
    ],
  },
  {
    heading: "Changes to this Agreement",
    paragraphs: [
      "Atelier Austinn Trading LLC reserves the right to modify these Terms & Conditions, policies, and the Service at any time. Continued use of the website constitutes acceptance of the updated terms.",
    ],
  },
  {
    heading: "Jurisdiction",
    paragraphs: [
      "The United Arab Emirates is our country of domicile. These Terms & Conditions shall be interpreted and enforced in accordance with the laws of the UAE. Any dispute arising in connection with this website shall be governed by UAE law.",
    ],
  },
  {
    heading: "Language",
    paragraphs: [
      "This Agreement is written in English. In the event of any conflict between the English version and any translation, the English version shall prevail.",
    ],
  },
];

const TermsContent: React.FC = () => (
  <div dir="ltr" className="px-6 md:px-14 pt-14 pb-14">
    <div className="mb-12 border-b border-stone-200 pb-8">
      <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-stone-400 mb-4">Legal</p>
      <h1 className="font-sans font-black text-4xl md:text-5xl uppercase tracking-tighter text-stone-900 leading-[0.85]">
        Terms <span className="text-stone-300">&amp; Conditions</span>
      </h1>
    </div>

    <div className="space-y-10 text-stone-600 text-[15px] leading-relaxed">
      {SECTIONS.map((section) => (
        <div key={section.heading}>
          <h2 className="font-sans font-black text-base uppercase tracking-tighter text-stone-900 mb-3">
            {section.heading}
          </h2>
          <div className="space-y-3">
            {section.paragraphs.map((para, i) =>
              typeof para === "string" ? (
                <p key={i}>{para}</p>
              ) : (
                <p key={i}>
                  <strong className="text-stone-800 font-bold">{para.lead}</strong> {para.text}
                </p>
              ),
            )}
            {section.listIntro && <p>{section.listIntro}</p>}
            {section.list && (
              <ul className="space-y-1.5 list-none">
                {section.list.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-stone-300 font-black">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Modal + open helper ───────────────────────────────────────────────────────
const TermsContext = createContext<() => void>(() => {});
export const useTerms = () => useContext(TermsContext);

export const TermsProvider: React.FC<{ lang: Language; children: React.ReactNode }> = ({ lang, children }) => {
  const [open, setOpen] = useState(false);
  const openTerms = useCallback(() => setOpen(true), []);
  const closeLabel = lang === "ar" ? "إغلاق" : "Close";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <TermsContext.Provider value={openTerms}>
      {children}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Terms & Conditions"
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
        >
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full md:max-w-3xl md:mx-4 bg-stone-50 md:rounded-sm shadow-2xl max-h-[85dvh] overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              aria-label={closeLabel}
              className="sticky top-4 float-right mr-4 z-20 p-2 bg-white hover:bg-stone-900 hover:text-white rounded-full shadow transition-all duration-300"
            >
              <X size={18} />
            </button>
            <TermsContent />
          </div>
        </div>
      )}
    </TermsContext.Provider>
  );
};
