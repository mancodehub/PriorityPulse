import { useEffect, useState } from 'react';
import { Link, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BrainCircuit,
  Check,
  Clock3,
  Mail,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import Footer from './components/Footer.jsx';
import Navbar from './components/Navbar.jsx';
import PulseMark from './components/PulseMark.jsx';
import Login from './pages/Login.jsx';
import Dashboard, { Analytics, Inbox, Notifications, Settings } from './pages/Dashboard.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

function Layout({ children }) {
  return <div className="site-shell"><Navbar /><main>{children || <Outlet />}</main><Footer /></div>;
}

function Eyebrow({ children }) {
  return <p className="eyebrow"><span />{children}</p>;
}

function Home() {
  return (
    <>
      <section className="hero section-wrap">
        <div className="hero-glow hero-glow--one" />
        <div className="hero-glow hero-glow--two" />
        <div className="hero-copy">
          <Eyebrow>Intelligence for the inbox</Eyebrow>
          <h1>Your inbox<br /><em>has a pulse.</em></h1>
          <p className="hero-copy__lead">PriorityPulse spots the emails that demand attention, classifies their urgency, and gives your team a decisive next move.</p>
          <div className="hero-actions">
            <Link className="button button--primary" to="/login">See PriorityPulse in action <ArrowRight size={17} /></Link>
            <Link className="text-link" to="/about">Explore how it works <span>↗</span></Link>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true"><i>J</i><i>A</i><i>M</i><i>S</i></div>
            <p><strong>Built for high-velocity teams</strong><br />No more critical requests lost in the noise.</p>
          </div>
        </div>
        <MailPreview />
      </section>

      <section className="logo-strip">
        <p>Trusted by teams who value their time</p>
        <div className="logo-row"><span>arc<sup>•</sup></span><span>VANTA</span><span>BUILD<span className="logo-dot">/</span>LAB</span><span className="serif-logo">northstar</span><span>THREAD</span></div>
      </section>

      <section className="section-wrap signal-section">
        <div className="section-heading">
          <Eyebrow>Less inbox. More impact.</Eyebrow>
          <h2>The signal is already<br />in your <em>inbox.</em></h2>
        </div>
        <p className="section-intro">PriorityPulse uses machine learning to understand what matters — not just what is loud.</p>
        <div className="feature-grid">
          <FeatureCard number="01" icon={<BrainCircuit />} title="Understands context" copy="Intent, sender history, language and timing become a clear priority score." />
          <FeatureCard number="02" icon={<Target />} title="Surfaces the essential" copy="Your important email arrives at the top, with exactly why it needs a response." />
          <FeatureCard number="03" icon={<BellRing />} title="Keeps momentum" copy="Smart nudges make sure the conversations that move work forward never stall." />
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-wrap workflow-layout">
          <div className="workflow-copy">
            <Eyebrow>Always one step ahead</Eyebrow>
            <h2>A calmer way to stay <em>on top.</em></h2>
            <p>Focus on the work only you can do. Let PriorityPulse manage the message traffic behind the scenes.</p>
            <ul className="check-list">
              <li><Check size={15} /> Priority ranking that learns your team's signals</li>
              <li><Check size={15} /> Calm, timely alerts when action is needed</li>
              <li><Check size={15} /> An audit trail of every important decision</li>
            </ul>
            <Link className="text-link text-link--dark" to="/about">Meet the intelligence behind it <ArrowRight size={16} /></Link>
          </div>
          <div className="workflow-visual">
            <div className="orbit orbit--outer" /><div className="orbit orbit--inner" />
            <div className="workflow-center"><PulseMark /><span>priority<br />signal</span></div>
            <div className="orbit-card orbit-card--alert"><BellRing size={16} /><p><b>Urgent request</b><span>Notify product team</span></p><i className="status-dot" /></div>
            <div className="orbit-card orbit-card--classify"><Sparkles size={15} /><p><b>Classified</b><span>98% confidence</span></p></div>
            <div className="orbit-card orbit-card--time"><Clock3 size={15} /><p><b>Saved today</b><span>2h 18m of triage</span></p></div>
          </div>
        </div>
      </section>

      <section className="section-wrap stats-section">
        <div className="stat"><strong>3.6<span>×</span></strong><p>faster response to high-priority messages</p></div>
        <div className="stat"><strong>92<span>%</span></strong><p>less manual inbox triage each week</p></div>
        <div className="stat"><strong>0</strong><p>critical messages left unseen</p></div>
      </section>

      <CtaPanel />
    </>
  );
}

function MailPreview() {
  return (
    <div className="mail-preview" aria-label="PriorityPulse email classification preview">
      <div className="preview-topbar"><div className="window-dots"><i /><i /><i /></div><span>prioritypulse / active inbox</span><div className="topbar-live"><b />live</div></div>
      <div className="preview-body">
        <aside className="preview-sidebar"><PulseMark compact /><div className="sidebar-lines"><i className="active" /><i /><i /><i /></div><div className="sidebar-user"><span>NA</span><i /></div></aside>
        <div className="mail-list">
          <div className="list-header"><span>Priority inbox</span><b>12</b></div>
          <div className="mail-row selected"><span className="mail-initial coral">AP</span><p><b>Apex Financial</b><small>Q3 contract renewal — action required</small></p><em>now</em></div>
          <div className="mail-row"><span className="mail-initial blue">M</span><p><b>Maya Chen</b><small>Re: Product launch assets</small></p><em>8m</em></div>
          <div className="mail-row"><span className="mail-initial lime">TB</span><p><b>The Bison Co.</b><small>Invoice 08319</small></p><em>21m</em></div>
          <div className="mail-row faded"><span className="mail-initial violet">V</span><p><b>Vercel</b><small>New project activity</small></p><em>1h</em></div>
        </div>
        <div className="mail-detail">
          <div className="detail-head"><div><span className="priority-tag"><Zap size={12} /> high priority</span><h3>Q3 contract renewal — action required</h3><p>Apex Financial · to you</p></div><span className="detail-more">•••</span></div>
          <div className="ai-insight"><div className="ai-icon"><Sparkles size={15} /></div><p><b>PriorityPulse insight</b><span>Renewal deadline is tomorrow. Deal value and sender activity make this time-sensitive.</span></p><strong>98<span>%</span></strong></div>
          <div className="mail-copy"><p>Hi Naomi,</p><p>We’re ready to move ahead with the renewal, but need the signed agreement returned before tomorrow’s board meeting.</p><p>Could you confirm it’s on track?</p><p>— Ana</p></div>
          <div className="reply-bar"><span>Reply to Apex Financial...</span><kbd>⌘ ↵</kbd></div>
        </div>
      </div>
      <div className="floating-notification"><span><BellRing size={14} /></span><p><b>Worth your attention</b><small>Apex Financial needs a reply</small></p><i /></div>
    </div>
  );
}

function FeatureCard({ number, icon, title, copy }) {
  return <article className="feature-card"><div className="feature-card__top"><span>{number}</span><i>{icon}</i></div><h3>{title}</h3><p>{copy}</p><div className="feature-card__line" /></article>;
}

function About() {
  return (
    <>
      <section className="page-hero section-wrap about-hero">
        <div><Eyebrow>Our point of view</Eyebrow><h1>Work should move<br /><em>with intention.</em></h1></div>
        <p>We’re building a world where attention is protected, decisions are clear, and important work never waits beneath an overflowing inbox.</p>
      </section>
      <section className="section-wrap manifesto-section">
        <div className="manifesto-number">01</div>
        <div className="manifesto-copy"><p className="overline">THE PRIORITYPULSE PRINCIPLE</p><h2>Attention is your team’s<br /><em>most precious resource.</em></h2><p className="body-large">Every day, capable people spend hours sorting through email to find the one thread that changes everything. We believe intelligent software should give that time back.</p><p>PriorityPulse began with a simple observation: email has all the context a team needs to act — it just needs to be understood. Our machine learning models turn that untapped context into an unmissable signal.</p></div>
      </section>
      <section className="values-section"><div className="section-wrap"><div className="values-heading"><Eyebrow>What guides us</Eyebrow><h2>Designed for better<br /><em>days at work.</em></h2></div><div className="value-list"><Value index="01" title="Calm over chaos" copy="We make space for focus by making the urgent unmistakable." /><Value index="02" title="Signal over noise" copy="Every feature earns its place by helping people make a better decision." /><Value index="03" title="People before process" copy="The system adapts to the way your team works — never the other way around." /></div></div></section>
      <section className="section-wrap about-quote"><span className="quote-mark">“</span><blockquote>The best technology doesn’t demand your attention. It gives it back.</blockquote><div><PulseMark compact /><p>PriorityPulse team<br /><span>Building a more focused future</span></p></div></section>
      <CtaPanel />
    </>
  );
}

function Value({ index, title, copy }) { return <article className="value"><span>{index}</span><div><h3>{title}</h3><p>{copy}</p></div><ArrowUpRight size={19} /></article>; }

function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const submit = (event) => { event.preventDefault(); setSubmitted(true); };
  return (
    <section className="contact-page section-wrap">
      <div className="contact-intro"><Eyebrow>Let’s make room for what matters</Eyebrow><h1>Start the<br /><em>conversation.</em></h1><p>Tell us a little about your team. We’ll show you how PriorityPulse can turn your inbox into a calmer, smarter place to work.</p><div className="contact-direct"><a href="mailto:hello@prioritypulse.ai"><Mail size={17} /> hello@prioritypulse.ai</a><p>Usually replies within one business day.</p></div><div className="contact-orbits"><i /><i /></div></div>
      <div className="contact-card">
        {submitted ? <SuccessMessage reset={() => setSubmitted(false)} /> : <form onSubmit={submit}><div className="form-heading"><span>01 / 01</span><h2>Tell us about you.</h2><p>We’ll only use this to get in touch about PriorityPulse.</p></div><div className="form-grid"><FormField label="Your name" name="name" placeholder="Jane Smith" required /><FormField label="Work email" name="email" type="email" placeholder="jane@company.com" required /><label className="form-field form-field--full"><span>What would you like to improve?</span><textarea name="message" rows="4" placeholder="My team spends too much time..." required /></label></div><label className="consent"><input type="checkbox" required /><span>I agree to receive a thoughtful follow-up from PriorityPulse.</span></label><button className="button button--primary submit-button" type="submit">Send my message <ArrowRight size={17} /></button></form>}
      </div>
    </section>
  );
}

function FormField({ label, name, type = 'text', placeholder, required }) { return <label className="form-field"><span>{label}</span><input name={name} type={type} placeholder={placeholder} required={required} /></label>; }

function SuccessMessage({ reset }) { return <div className="form-success"><span className="success-icon"><Check size={26} /></span><p className="overline">Message received</p><h2>We’ve got it.</h2><p>Thank you for reaching out. One of our team will be in touch shortly.</p><button className="text-link text-link--dark" onClick={reset}>Send another message <ArrowRight size={16} /></button></div>; }

function CtaPanel() { return <section className="section-wrap"><div className="cta-panel"><div className="cta-orbit cta-orbit--one" /><div className="cta-orbit cta-orbit--two" /><Eyebrow>Make your move</Eyebrow><h2>Stop sorting.<br />Start <em>moving.</em></h2><p>Give your team the signal it needs to do its best work.</p><Link className="button button--light" to="/contact">Talk to our team <ArrowRight size={17} /></Link><div className="cta-pulse"><PulseMark /><span>priority<br />pulse</span></div></div></section>; }

export default function App() {
  return <><ScrollToTop /><Routes><Route path="/login" element={<Login />} /><Route path="/dashboard" element={<Inbox />} /><Route path="/dashboard/overview" element={<Dashboard />} /><Route path="/dashboard/inbox" element={<Inbox />} /><Route path="/dashboard/important" element={<Inbox importantOnly />} /><Route path="/dashboard/medium" element={<Inbox initialFilter="MEDIUM" />} /><Route path="/dashboard/low" element={<Inbox initialFilter="LOW" />} /><Route path="/dashboard/analytics" element={<Analytics />} /><Route path="/dashboard/notifications" element={<Notifications />} /><Route path="/dashboard/settings" element={<Settings />} /><Route element={<Layout />}><Route path="/" element={<Home />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} /><Route path="*" element={<Home />} /></Route></Routes></>;
}
