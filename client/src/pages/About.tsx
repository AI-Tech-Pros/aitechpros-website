import MarketingChrome from "@/components/MarketingChrome";
import PageMeta from "@/components/PageMeta";
import { ADVISORS, CEO, CTO, LEGAL_NAME, MEDSTORE_ABOUT_URL } from "@/lib/company";

export default function About() {
  return (
    <MarketingChrome>
      <PageMeta
        title="Leadership — AI Tech Pros"
        description="AI Tech Pros, Inc. is led by the same CEO and CTO as MedStore Inc.: Nehemiah Harvard and Henry Jenkins."
        path="/about"
      />
      <main className="subpage">
        <header className="subpage-hero">
          <p className="eyebrow">Leadership</p>
          <h1>Same CEO and CTO as MedStore Inc.</h1>
          <p>
            {LEGAL_NAME} acquired MedStore Inc. Executive leadership did not change. Officers and advisors match{" "}
            <a href={MEDSTORE_ABOUT_URL} target="_blank" rel="noreferrer">
              medstoreinc.com/about.html
            </a>
            .
          </p>
        </header>

        <div className="people-grid people-grid--officers">
          <article className="person-card person-card--portrait">
            <div className="person-portrait">
              <img src={CEO.photo} alt={`${CEO.name}, ${CEO.title}`} width={300} height={300} decoding="async" />
            </div>
            <div className="person-body">
              <p className="person-role">{CEO.title}</p>
              <h2>{CEO.name}</h2>
              <p>{CEO.service}. Leads the company and the MedStore Inc. healthcare technology practice.</p>
            </div>
          </article>
          <article className="person-card person-card--portrait">
            <div className="person-portrait">
              <img src={CTO.photo} alt={`${CTO.name}, ${CTO.title}`} width={300} height={300} decoding="async" />
            </div>
            <div className="person-body">
              <p className="person-role">{CTO.title}</p>
              <h2>{CTO.name}</h2>
              <p>
                {CTO.service}. Architecture, cybersecurity, and Jenkins Cyber Academy instruction. Personal site: henryljenkins.com.
              </p>
            </div>
          </article>
        </div>

        <section className="prose-light" aria-labelledby="advisors-heading">
          <h2 id="advisors-heading">Advisors</h2>
          <div className="people-grid">
            {ADVISORS.map((advisor) => (
              <article className="person-card person-card--portrait" key={advisor.name}>
                <div className="person-portrait">
                  <img src={advisor.photo} alt={`${advisor.name}, ${advisor.title}`} width={300} height={300} decoding="async" loading="lazy" />
                </div>
                <div className="person-body">
                  <p className="person-role">{advisor.title}</p>
                  <h3>{advisor.name}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}
