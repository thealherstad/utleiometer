import '../style/navbar.css'
import { Link, NavLink } from 'react-router-dom'

type LinkItem = { label: string; to: string }

type Props = {
  links: LinkItem[]
}

export default function NavBar({ links }: Props) {
  return (
    <header className="navbar" role="banner">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <Link to="/" className="navbar__logo" aria-label="Hjem">
            Utleiometer
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
            to="/logg-inn"
            className="navbar__action"
            aria-label="Profil"
          >
            Profil
          </Link>
        </div>
      </div>
    </header>
  )
}
