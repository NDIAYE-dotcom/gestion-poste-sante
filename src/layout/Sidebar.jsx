import { useEffect, useState } from 'react'
import './Sidebar.css'

const items = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'patients', label: 'Patients' },
  { id: 'prescriptions', label: 'Ordonnances' },
  { id: 'pharmacy', label: 'Pharmacie' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'accounting', label: 'Comptabilite' },
  { id: 'staff', label: 'Personnel' },
  { id: 'settings', label: 'Parametres' },
]

export function Sidebar({ activePage, onNavigate }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [activePage])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 980) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNavigate = (pageId) => {
    onNavigate(pageId)
    if (window.innerWidth <= 980) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <aside className={`sidebar ${isMobileMenuOpen ? 'is-mobile-open' : ''}`}>
      <div className="sidebar__topbar">
        <div className="sidebar__brand">
          <img className="sidebar__logo" src="/logosante-02.png" alt="Logo Poste de Santé" />
          <div>
            <h1>Poste Sante</h1>
            <p>Gestion interne</p>
          </div>
        </div>

        <button
          type="button"
          className={`sidebar__toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
          aria-label="Ouvrir le menu"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <span className="sidebar__toggle-lines" aria-hidden="true" />
          Menu
        </button>
      </div>

      <nav className={`sidebar__menu ${isMobileMenuOpen ? 'is-open' : ''}`}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar__item ${activePage === item.id ? 'is-active' : ''}`}
            onClick={() => handleNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
