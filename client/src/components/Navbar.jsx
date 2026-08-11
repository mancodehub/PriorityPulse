import { useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronRight, Menu, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import PulseMark from './PulseMark.jsx';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Contact us', to: '/contact' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="PriorityPulse home" onClick={closeMenu}>
        <PulseMark />
        <span>priority<span>pulse</span></span>
      </Link>

      <nav className="desktop-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Link className="header-cta" to="/login">
        Sign in <ArrowUpRight size={15} />
      </Link>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={21} /> : <Menu size={22} />}
      </button>

      <div className={`mobile-menu${menuOpen ? ' is-open' : ''}`}>
        {navItems.map((item, index) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={closeMenu}>
            <span>0{index + 1}</span>{item.label}<ChevronRight size={18} />
          </NavLink>
        ))}
        <Link className="button button--primary mobile-menu__button" to="/login" onClick={closeMenu}>
          Sign in <ArrowRight size={17} />
        </Link>
      </div>
    </header>
  );
}
