import { ArrowRight, CheckCircle2, MapPinned, ShieldCheck, UsersRound } from "lucide-react";

export default function Home() {
  return (
    <main className="landing-page">
      <nav className="public-nav">
        <a className="public-brand" href="/"><span className="brand-mark">PF</span><span><strong>People&apos;s First</strong><small>Movement workspace</small></span></a>
        <div className="public-nav-actions"><span className="public-nav-status"><span />Ogun State workspace</span><a className="public-nav-link" href="/login">Sign in</a><a className="public-nav-cta" href="/register">Join the movement <ArrowRight size={15} /></a></div>
      </nav>
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">People-powered operations</p>
          <h1><span className="headline-main">Organize locally.</span><span className="headline-lead">Move together.</span></h1>
          <p className="landing-subtitle">A trusted operating workspace for the People&apos;s First Movement: connect communities, coordinate field teams, and turn local insight into practical progress.</p>
          <div className="landing-actions"><a className="primary-button" href="/register">Create your member account <ArrowRight size={17} /></a><a className="secondary-button" href="/login">Member sign in</a></div>
          <div className="landing-proof"><span><CheckCircle2 size={16} /> Built for every community</span><span><ShieldCheck size={16} /> Role-based access</span></div>
        </div>

        <div className="landing-visual">
          <div className="hero-frame">
            <img src="/img/img6.jpeg" alt="People's First Movement community leadership" /><div className="hero-overlay"><span className="hero-overlay-label">National workspace</span><strong>People first, place aware.</strong><small>One connected view from state teams to polling units.</small></div>
          </div>
        </div>
      </section>

      <section className="landing-metrics">
        <article><div className="metric-icon"><MapPinned size={18} /></div><strong>Every place has a voice</strong><span>Organize by state, LGA, ward, and polling unit.</span></article>
        <article><div className="metric-icon"><UsersRound size={18} /></div><strong>Every team stays connected</strong><span>Coordinate members, communities, events, and messages.</span></article>
        <article><div className="metric-icon"><ShieldCheck size={18} /></div><strong>Every action is accountable</strong><span>Clear roles, permissions, consent, and activity records.</span></article>
      </section>
      <footer className="landing-footer"><span>People&apos;s First Movement</span><span>Grassroots leadership for Ogun State</span><a href="/login">Access workspace <ArrowRight size={14} /></a></footer>
    </main>
  );
}
