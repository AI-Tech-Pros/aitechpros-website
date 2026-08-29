import MarketingChrome from "@/components/MarketingChrome";
import PageMeta from "@/components/PageMeta";
import {
  CALENDLY_EMBED_URL,
  EMAIL_ADMIN,
  LEGAL_NAME,
  PHONE,
  PHONE_HREF,
} from "@/lib/company";

export default function Conversation() {
  return (
    <MarketingChrome>
      <PageMeta
        title="Start a conversation — AI Tech Pros"
        description="Book a 15-minute conversation with AI Tech Pros, Inc. We will help you turn the hard part into a system people can trust."
        path="/conversation"
      />
      <main className="subpage conversation-page">
        <header className="subpage-hero">
          <p className="eyebrow">The next useful thing</p>
          <h1>Bring us the hard part.</h1>
          <p>We will help you turn it into a system people can trust.</p>
        </header>
        <div className="conversation-frame">
          <iframe
            title={`Schedule a conversation with ${LEGAL_NAME}`}
            src={CALENDLY_EMBED_URL}
            loading="eager"
          />
        </div>
        <p className="conversation-alt">
          Prefer email or phone?{" "}
          <a href={`mailto:${EMAIL_ADMIN}`}>{EMAIL_ADMIN}</a>
          {" · "}
          <a href={PHONE_HREF}>{PHONE}</a>
        </p>
      </main>
    </MarketingChrome>
  );
}
