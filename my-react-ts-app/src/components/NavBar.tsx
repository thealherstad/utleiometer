import '../style/navbar.css'
import { Link, NavLink } from 'react-router-dom'
import logo from "../assets/Logo.png";

type LinkItem = { label: string; to: string }

type Props = {
  links: LinkItem[]
  user?: any;
  isAdmin?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function NavBar({ links, user, isAdmin, theme, onToggleTheme }: Props)

 {
  return (
    <header className="navbar" role="banner">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <Link to="/" className="navbar__logo" aria-label="Hjem">
            <img
            src={logo}
            alt="Utleiometer"
            className='logo-img'
            />
          </Link>
        </div>

        <nav className="navbar__nav" aria-label="Hovednavigasjon">
          <ul className="navbar__links">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    `navbar__link ${isActive ? 'is-active' : ''}`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar__actions">
          <Link
            to="/profil"
            className="navbar__action"
            style={
              user
               ? isAdmin
                 ? { backgroundColor: '#0b5ed7', color: 'white' } 
                 : { backgroundColor: '#009999', color: 'white' } 
              : {}
            }

          >
            Profil
          </Link>
          <button
            type="button"
            className="navbar__theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Bytt til ${theme === 'light' ? 'mørk' : 'lys'} modus`}
          >
            {theme === 'light' ? 'Mørk modus' : 'Lys modus'}
          </button>
        </div>
      </div>
    </header>
  )
}
