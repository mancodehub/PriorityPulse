import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PulseMark from './PulseMark.jsx';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Contact us', to: '/contact' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Link className="brand" to="/">
            <PulseMark compact />
            <span>priority<span>pulse</span></span>
          </Link>
          <p>Clear signal for teams moving fast.</p>
        </div>
        <div className="footer-links">
          {navItems.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}
        </div>
        <a className="footer-email" href="mailto:hello@prioritypulse.ai">hello@prioritypulse.ai <ArrowUpRight size={15} /></a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} PriorityPulse</span>
        <span>Made for the work that matters.</span>
      </div>
    </footer>
  );
}
