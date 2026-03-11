import { useEffect, useRef, useState } from 'react'
import './Navbar.css'

export function Navbar({ healthPostName, pageTitle, notifications = [], onNavigate, currentUserEmail, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false)
  const [readIds, setReadIds] = useState(new Set())
  const notifyRef = useRef(null)
  const unreadCount = notifications.filter((item) => !readIds.has(item.id)).length
  const avatarLabel = (currentUserEmail || 'AD').slice(0, 2).toUpperCase()

  const handleItemClick = (item) => {
    setReadIds((prev) => new Set([...prev, item.id]))
    if (item.page && onNavigate) {
      onNavigate(item.page)
      setIsOpen(false)
    }
  }

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((item) => item.id)))
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <header className="navbar">
      <div>
        <p className="navbar__label">{healthPostName}</p>
        <h2>{pageTitle}</h2>
      </div>

      <div className="navbar__actions">
        <div className="navbar__notify-wrap" ref={notifyRef}>
          <button
            type="button"
            className="navbar__notify"
            aria-label="notifications"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            Notifications
            {unreadCount > 0 ? <span className="navbar__notify-count">{unreadCount}</span> : null}
          </button>

          {isOpen ? (
            <section className="navbar__notify-panel" aria-label="Centre de notifications">
              <div className="navbar__notify-panel-header">
                <h4>Alertes en cours</h4>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="navbar__notify-mark-all"
                    onClick={markAllRead}
                  >
                    Tout marquer lu
                  </button>
                )}
              </div>

              {notifications.length ? (
                <ul className="navbar__notify-list">
                  {notifications.map((item) => {
                    const isRead = readIds.has(item.id)
                    return (
                      <li
                        key={item.id}
                        className={[
                          'navbar__notify-item',
                          `navbar__notify-item--${item.level}`,
                          isRead ? 'navbar__notify-item--read' : '',
                          item.page ? 'navbar__notify-item--clickable' : '',
                        ].join(' ').trim()}
                        role={item.page ? 'button' : undefined}
                        tabIndex={item.page ? 0 : undefined}
                        onClick={() => handleItemClick(item)}
                        onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item)}
                      >
                        <div className="navbar__notify-item-top">
                          <p>{item.title}</p>
                          {!isRead && <span className="navbar__notify-dot" aria-label="non lu" />}
                        </div>
                        <span>{item.message}</span>
                        {item.page && (
                          <span className="navbar__notify-link">
                            {item.page === 'pharmacy' ? 'Voir Pharmacie →' : 'Voir Personnel →'}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="navbar__notify-empty">Aucune alerte pour le moment.</p>
              )}
            </section>
          ) : null}
        </div>

        <div className="navbar__profile">
          <span className="navbar__avatar">{avatarLabel}</span>
          <div>
            <strong>{currentUserEmail || 'Admin'}</strong>
            <p>Acces securise</p>
          </div>
          <button type="button" className="navbar__logout" onClick={onSignOut}>
            Deconnexion
          </button>
        </div>
      </div>
    </header>
  )
}
