export default function Home() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-copy">
          <h1>People&apos;s First Movement<br />for Hon. Oladipupo Adebutu</h1>
          <p className="landing-subtitle">
            Building a people-first future for our communities through grassroots leadership, accountability, and practical action for families, young people, and neighborhoods.
          </p>

          <div className="landing-actions">
            <a className="primary-button" href="/register">
              Join the movement
            </a>
            <a className="secondary-button" href="/login">
              Member login
            </a>
          </div>

          <ul className="landing-points">
            <li>Grassroots mobilization</li>
            <li>Community organizing</li>
            <li>Inclusive civic leadership</li>
          </ul>
        </div>

        <div className="landing-visual">
          <div className="hero-frame">
            <img src="/img/img6.jpeg" alt="Campaign portrait for People's First Movement" />
          </div>
        </div>
      </section>

      <section className="landing-metrics">
        <article>
          <strong>People</strong>
          <span>Driven by the communities we serve</span>
        </article>
        <article>
          <strong>Progress</strong>
          <span>Focused on local action and visible impact</span>
        </article>
        <article>
          <strong>Purpose</strong>
          <span>Leadership that listens and delivers</span>
        </article>
      </section>
    </main>
  );
}
