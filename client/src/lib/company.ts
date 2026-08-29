/** Canonical company, legal, and venture facts for the marketing site. */

export const LEGAL_NAME = "AI Tech Pros, Inc.";

export const SITE_URL = "https://aitechpros-website.pages.dev";

export const PHONE = "+1-404-333-2968";
export const PHONE_HREF = "tel:+14043332968";
export const EMAIL_LEGAL = "info@medstoreinc.com";
export const EMAIL_ADMIN = "admin@aitechpros.ai";
export const CALENDLY_URL = "https://calendly.com/aitechpros/15min";
export const CONVERSATION_PATH = "/conversation";
export const CALENDLY_EMBED_URL = `${CALENDLY_URL}?hide_gdpr_banner=1&background_color=fbfcfb&text_color=12263a&primary_color=1266d6&embed_type=Inline`;
export const SKOOL_URL = "https://www.skool.com/henry-jenkins-5224";
export const LINKEDIN_URL = "https://www.linkedin.com/company/ai-tech-pros";
export const GITHUB_URL = "https://github.com/AI-Tech-Pros";

export const ADDRESS_OPERATING = {
  line1: "217 Davis Road",
  city: "Augusta",
  region: "GA",
  postal: "30907",
  country: "United States",
};

export const ADDRESS_MAILING = {
  line1: "17910 Van Dyke Street STE 1396",
  city: "Detroit",
  region: "MI",
  postal: "48234",
  country: "United States",
};

export function formatAddress(address: typeof ADDRESS_OPERATING): string {
  return `${address.line1}, ${address.city}, ${address.region} ${address.postal}`;
}

export const CEO = {
  name: "Nehemiah Harvard",
  title: "Chief Executive Officer",
  service: "US Air Force Veteran",
  photo: "/assets/portraits/nehemiah-harvard.png",
};

export const CTO = {
  name: "Henry Jenkins",
  title: "Chief Technology Officer",
  service: "US Army Veteran",
  photo: "/assets/portraits/henry-jenkins.png",
};

export const ADVISORS = [
  { name: "Dr. Bruce Lapine", title: "Advisor", photo: "/assets/portraits/bruce-lapine.png" },
  { name: "Dr. Kimberely N. West", title: "Artificial Intelligence Advisor", photo: "/assets/portraits/kimberely-west.png" },
  { name: "Abhishek Jain, MD", title: "IT Healthcare Advisor", photo: "/assets/portraits/abhishek-jain.png" },
];

/** Same public ventures as henryljenkins.com/#projects, in that order. */
export const VENTURES = [
  {
    name: "AI Tech Pros",
    href: SITE_URL,
    summary:
      "The parent company. We connect strategy, secure infrastructure, and human expertise so intelligent systems stay dependable in the real world.",
    tags: ["Artificial intelligence", "Enterprise systems", "Governance"],
    image: "/assets/creative/ai-tech-pros-hero-focus.webp",
    alt: "Abstract connected system representing useful intelligence, secure infrastructure, and human expertise.",
  },
  {
    name: "Negotiate Medical Bill",
    href: "https://negotiatemedicalbill.ai/",
    summary:
      "An AI-powered platform that helps patients review medical charges, identify billing errors, and advocate for fairer pricing.",
    tags: ["Healthcare AI", "Medical billing", "Patient advocacy"],
    image: "/assets/creative/capability-enablement.webp",
    alt: "Connected pathway representing review, identification, and advocacy across a medical bill.",
  },
  {
    name: "MedStore Inc.",
    href: "https://medstoreinc.com/",
    summary:
      "A healthcare technology company now part of AI Tech Pros, Inc. HIPAA-aware telehealth, health systems, and secure patient-data infrastructure.",
    tags: ["Healthcare IT", "Telehealth", "HIPAA"],
    image: "/assets/creative/venture-medstore.webp",
    alt: "Healthcare operations floor with clinicians, diagnostics, and secure digital infrastructure.",
  },
] as const;

export const ORCHESTRATEOS_URL = "https://orchestrateos.pages.dev";
export const HENRY_SITE_URL = "https://henryljenkins.com/";
export const MEDSTORE_ABOUT_URL = "https://medstoreinc.com/about.html";
