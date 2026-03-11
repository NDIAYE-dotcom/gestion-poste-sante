import { useState } from 'react'
import { isSupabaseEnabled, supabase } from '../lib/supabaseClient'
import './AuthScreen.css'

export function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isSupabaseEnabled || !supabase) {
      setErrorMessage('Supabase Auth n est pas configure. Ajoutez les variables d environnement pour activer la connexion.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')
      setFeedback('')

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      const detail = error?.message || 'Erreur inconnue'
      setErrorMessage(detail)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-screen__hero">
        <div className="auth-screen__card">
          <div className="auth-screen__brand">
            <img src="/logosante-02.png" alt="Logo Poste de Santé" className="auth-screen__logo" />
            <p className="auth-screen__title">Poste de Santé Jaxaay Parcelle</p>
          </div>

          <form className="auth-screen__form" onSubmit={handleSubmit}>
            <label className="auth-screen__field">
              <span>Email professionnel</span>
              <input
                type="email"
                placeholder="poste.sante@jaxaay.sn"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </label>

            <label className="auth-screen__field">
              <span>Mot de passe</span>
              <input
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
            </label>

            {feedback ? <p className="auth-screen__feedback auth-screen__feedback--success">{feedback}</p> : null}
            {errorMessage ? <p className="auth-screen__feedback auth-screen__feedback--error">{errorMessage}</p> : null}
            {!isSupabaseEnabled ? (
              <p className="auth-screen__feedback auth-screen__feedback--warning">
                Auth indisponible: configurez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env`.
              </p>
            ) : null}

            <button type="submit" disabled={isSubmitting || !isSupabaseEnabled}>
              {isSubmitting ? 'Veuillez patienter...' : 'Connexion'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}