import '../style/NavBar.css'
type LinkItem = { label: string; to: string }

type Props = {
  links: LinkItem[]
}

export default function NavBar({ links }: Props) {
  return (
    <header className="navbar" role="banner">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <a href="/" className="navbar__logo">
            Utleiometer
          </a>
        </div>

        <nav className="navbar__nav" aria-label="Hovednavigasjon">
          <ul className="navbar__links">
            {links.map((l) => (
              <li key={l.to}>
                <a href={l.to}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar__actions">
          <button
            type="button"
            data-action="login"
            aria-label="Logg inn (placeholder)"
            onClick={() => { /* Tomt, kan legge til funksjon senere */ }}
          >
            Logg inn
          </button>
        </div>
      </div>
    </header>
  )
}
