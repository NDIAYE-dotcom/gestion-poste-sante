import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { Navbar } from './layout/Navbar'
import { Sidebar } from './layout/Sidebar'
import { AuthScreen } from './pages/AuthScreen'
import { Accounting } from './pages/Accounting'
import { Dashboard } from './pages/Dashboard'
import { Patients } from './pages/Patients'
import { Pharmacy } from './pages/Pharmacy'
import { Prescriptions } from './pages/Prescriptions'
import { Settings } from './pages/Settings'
import { Staff } from './pages/Staff'
import { Tickets } from './pages/Tickets'
import {
  initialPatients,
  initialPrescriptions,
  initialStaff,
  initialStock,
  initialTickets,
  initialTransactions,
} from './data/seedData'
import { isSupabaseEnabled, supabase } from './lib/supabaseClient'
import { deleteRecord, insertRecord, loadAppSetting, loadInitialData, updateRecord } from './services/database'

const pageTitles = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  prescriptions: 'Ordonnances',
  pharmacy: 'Pharmacie',
  tickets: 'Tickets',
  accounting: 'Comptabilite',
  staff: 'Personnel',
  settings: 'Parametres',
}

const DEFAULT_ACCOUNTING_ACCESS_PASSWORD = import.meta.env.VITE_ACCOUNTING_ACCESS_PASSWORD || 'compta123'
const DEFAULT_SETTINGS_ACCESS_PASSWORD = import.meta.env.VITE_SETTINGS_ACCESS_PASSWORD || 'param123'
const DEFAULT_TICKET_SERVICE = 'Ticket de consultation'

const parseTimeToMinutes = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const parts = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!parts) {
    return null
  }

  const hours = Number(parts[1])
  const minutes = Number(parts[2])

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null
  }

  return hours * 60 + minutes
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [session, setSession] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseEnabled)
  const [patients, setPatients] = useState(initialPatients)
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions)
  const [stock, setStock] = useState(initialStock)
  const [tickets, setTickets] = useState(initialTickets)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [staff, setStaff] = useState(initialStaff)
  const [isLoading, setIsLoading] = useState(isSupabaseEnabled)
  const [syncError, setSyncError] = useState('')
  const [accountingAccessPassword, setAccountingAccessPassword] = useState(DEFAULT_ACCOUNTING_ACCESS_PASSWORD)
  const [isAccountingUnlocked, setIsAccountingUnlocked] = useState(false)
  const [isAccountingPromptOpen, setIsAccountingPromptOpen] = useState(false)
  const [accountingPassword, setAccountingPassword] = useState('')
  const [accountingError, setAccountingError] = useState('')
  const [settingsAccessPassword, setSettingsAccessPassword] = useState(DEFAULT_SETTINGS_ACCESS_PASSWORD)
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false)
  const [isSettingsPromptOpen, setIsSettingsPromptOpen] = useState(false)
  const [settingsPassword, setSettingsPassword] = useState('')
  const [settingsError, setSettingsError] = useState('')

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      setIsAuthLoading(false)
      return
    }

    let isMounted = true

    const bootstrapSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error) {
        const detail = error?.message || 'Erreur inconnue'
        setSyncError(`Echec de verification session: ${detail}`)
      }

      setSession(data.session ?? null)
      setIsAuthLoading(false)
    }

    bootstrapSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setIsAuthLoading(false)
      setSyncError('')
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const syncFromSupabase = async () => {
      if (!isSupabaseEnabled) {
        setIsLoading(false)
        return
      }

      if (!session) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setSyncError('')
        const remoteData = await loadInitialData()
        if (!remoteData) {
          return
        }

        setPatients(remoteData.patients)
        setPrescriptions(remoteData.prescriptions)
        setStock(remoteData.stock)
        setTickets(remoteData.tickets)
        setTransactions(remoteData.transactions)
        setStaff(remoteData.staff)

        const remoteAccountingPassword = await loadAppSetting(
          'accounting_access_password',
          DEFAULT_ACCOUNTING_ACCESS_PASSWORD,
        )
        const remoteSettingsPassword = await loadAppSetting('settings_access_password', DEFAULT_SETTINGS_ACCESS_PASSWORD)
        setAccountingAccessPassword(remoteAccountingPassword)
        setSettingsAccessPassword(remoteSettingsPassword)
      } catch (error) {
        const detail = error?.message || error?.hint || 'Erreur inconnue'
        setSyncError(`Impossible de charger les donnees Supabase: ${detail}`)
      } finally {
        setIsLoading(false)
      }
    }

    syncFromSupabase()
  }, [session])

  const handleSignOut = async () => {
    if (!supabase) {
      return
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      setActivePage('dashboard')
      setIsAccountingUnlocked(false)
      setIsAccountingPromptOpen(false)
      setAccountingPassword('')
      setAccountingError('')
      setIsSettingsUnlocked(false)
      setIsSettingsPromptOpen(false)
      setSettingsPassword('')
      setSettingsError('')
    } catch (error) {
      const detail = error?.message || 'Erreur inconnue'
      setSyncError(`Echec de deconnexion: ${detail}`)
    }
  }

  const handleNavigate = (page) => {
    if (page !== 'accounting' && page !== 'settings') {
      setActivePage(page)
      return
    }

    if (page === 'accounting' && isAccountingUnlocked) {
      setActivePage('accounting')
      return
    }

    if (page === 'settings' && isSettingsUnlocked) {
      setActivePage('settings')
      return
    }

    if (page === 'accounting') {
      setAccountingPassword('')
      setAccountingError('')
      setIsAccountingPromptOpen(true)
      return
    }

    setSettingsPassword('')
    setSettingsError('')
    setIsSettingsPromptOpen(true)
  }

  const handleAccountingUnlock = (event) => {
    event.preventDefault()

    if (accountingPassword === accountingAccessPassword) {
      setIsAccountingUnlocked(true)
      setIsAccountingPromptOpen(false)
      setAccountingPassword('')
      setAccountingError('')
      setActivePage('accounting')
      return
    }

    setAccountingError('Mot de passe incorrect.')
  }

  const handleSettingsUnlock = (event) => {
    event.preventDefault()

    if (settingsPassword === settingsAccessPassword) {
      setIsSettingsUnlocked(true)
      setIsSettingsPromptOpen(false)
      setSettingsPassword('')
      setSettingsError('')
      setActivePage('settings')
      return
    }

    setSettingsError('Mot de passe incorrect.')
  }

  const dashboardMetrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const patientsToday = patients.filter((p) => p.consultationDate === today).length
    const dailyRevenue = transactions
      .filter((t) => t.date === today && t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const prescriptionsToday = prescriptions.filter((p) => p.date === today).length
    const outOfStock = stock.filter((s) => s.quantity <= s.alertThreshold).length
    const onDuty = staff.filter((s) => s.onDuty).length

    return {
      patientsToday,
      dailyRevenue,
      prescriptionsToday,
      outOfStock,
      onDuty,
    }
  }, [patients, prescriptions, stock, staff, transactions])

  const notifications = useMemo(() => {
    const items = []
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const lowStockItems = stock
      .filter((item) => Number(item.quantity) <= Number(item.alertThreshold))
      .sort((a, b) => Number(a.quantity) - Number(b.quantity))

    lowStockItems.slice(0, 5).forEach((item) => {
      items.push({
        id: `stock-${item.id}`,
        level: Number(item.quantity) === 0 ? 'critical' : 'warning',
        title: `Stock faible: ${item.name}`,
        message: `${item.quantity} restant(s), seuil ${item.alertThreshold}.`,
        page: 'pharmacy',
      })
    })

    const guardStartAlerts = staff
      .filter((member) => {
        const start = parseTimeToMinutes(member.guardStart)
        if (start === null || member.onDuty) {
          return false
        }

        return currentMinutes >= start - 30 && currentMinutes <= start + 120
      })
      .map((member) => {
        const start = parseTimeToMinutes(member.guardStart)
        const shouldStartNow = start !== null && currentMinutes >= start

        return {
          id: `guard-start-${member.id}`,
          level: shouldStartNow ? 'critical' : 'warning',
          title: `${member.name} doit monter en garde`,
          message: `Horaire prevu ${member.guardStart} - ${member.guardEnd}.`,
          page: 'staff',
        }
      })

    const guardEndAlerts = staff
      .filter((member) => {
        const end = parseTimeToMinutes(member.guardEnd)
        if (end === null || !member.onDuty) {
          return false
        }

        return currentMinutes > end + 15
      })
      .map((member) => ({
        id: `guard-end-${member.id}`,
        level: 'warning',
        title: `Relais de garde en attente: ${member.name}`,
        message: `Fin de garde depassee depuis ${member.guardEnd}.`,
        page: 'staff',
      }))

    items.push(...guardStartAlerts, ...guardEndAlerts)

    return items
  }, [stock, staff])

  const buildTicketTransaction = (ticket) => ({
    type: 'income',
    label: `Paiement ticket ${ticket.ticketNumber}`,
    amount: Number(ticket.totalAmount),
    date: ticket.date,
  })

  const findLinkedTicketTransaction = (ticketNumber, transactionList = transactions) =>
    transactionList.find((transaction) => transaction.type === 'income' && transaction.label === `Paiement ticket ${ticketNumber}`)

  const addPatient = async (patient) => {
    if (!isSupabaseEnabled) {
      setPatients((prev) => [{ id: Date.now(), ...patient }, ...prev])
      return
    }

    try {
      const saved = await insertRecord('patients', patient)
      setPatients((prev) => [saved, ...prev])
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec d'ajout patient dans Supabase: ${detail}`)
    }
  }

  const updatePatient = async (patient) => {
    if (!isSupabaseEnabled) {
      setPatients((prev) => prev.map((p) => (p.id === patient.id ? patient : p)))
      return
    }

    try {
      const saved = await updateRecord('patients', patient.id, patient)
      setPatients((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec de mise a jour patient: ${detail}`)
    }
  }

  const addPrescription = async (prescription) => {
    const normalizedPrescription = {
      ...prescription,
      isSold: false,
      soldDate: null,
    }

    if (!isSupabaseEnabled) {
      const savedLocal = { id: Date.now(), ...normalizedPrescription }
      setPrescriptions((prev) => [savedLocal, ...prev])
      return savedLocal
    }

    try {
      const saved = await insertRecord('prescriptions', normalizedPrescription)
      setPrescriptions((prev) => [saved, ...prev])
      return saved
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec d'ajout ordonnance: ${detail}`)
      return null
    }
  }

  const addMedicine = async (medicine) => {
    if (!isSupabaseEnabled) {
      setStock((prev) => [{ id: Date.now(), ...medicine }, ...prev])
      return
    }

    try {
      const saved = await insertRecord('stock', medicine)
      setStock((prev) => [saved, ...prev])
    } catch (error) {
      const detail = error?.message || error?.hint || error?.details || 'Erreur inconnue'
      setSyncError(`Echec d'ajout medicament: ${detail}`)
    }
  }

  const updateMedicine = async (medicine) => {
    if (!isSupabaseEnabled) {
      setStock((prev) => prev.map((m) => (m.id === medicine.id ? medicine : m)))
      return
    }

    try {
      const saved = await updateRecord('stock', medicine.id, medicine)
      setStock((prev) => prev.map((m) => (m.id === saved.id ? saved : m)))
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec de mise a jour medicament: ${detail}`)
    }
  }

  const deleteMedicine = async (medicineId) => {
    if (!isSupabaseEnabled) {
      setStock((prev) => prev.filter((m) => m.id !== medicineId))
      return
    }

    try {
      await deleteRecord('stock', medicineId)
      setStock((prev) => prev.filter((m) => m.id !== medicineId))
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec de suppression medicament: ${detail}`)
    }
  }

  const sellFromPrescription = async ({ prescriptionId, patientName, date, items }) => {
    const prescription = prescriptions.find((item) => item.id === Number(prescriptionId))
    if (!prescription) {
      return { success: false, message: 'Ordonnance introuvable.' }
    }

    if (prescription.isSold) {
      return { success: false, message: 'Cette ordonnance a deja ete vendue.' }
    }

    const normalizedItems = items
      .map((item) => ({
        stockId: Number(item.stockId),
        quantity: Number(item.quantity),
      }))
      .filter((item) => Number.isFinite(item.stockId) && Number.isFinite(item.quantity) && item.quantity > 0)

    if (normalizedItems.length === 0) {
      return { success: false, message: 'Aucun medicament valide a vendre.' }
    }

    const mergedItems = normalizedItems.reduce((acc, item) => {
      const existing = acc.find((entry) => entry.stockId === item.stockId)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        acc.push({ ...item })
      }
      return acc
    }, [])

    const updates = []
    let totalAmount = 0

    for (const line of mergedItems) {
      const stockItem = stock.find((medicine) => medicine.id === line.stockId)
      if (!stockItem) {
        return { success: false, message: 'Un medicament de l\'ordonnance est introuvable en stock.' }
      }

      if (Number(stockItem.quantity) < line.quantity) {
        return {
          success: false,
          message: `Stock insuffisant pour ${stockItem.name}. Disponible: ${stockItem.quantity}.`,
        }
      }

      totalAmount += Number(stockItem.salePrice) * line.quantity
      updates.push({
        ...stockItem,
        quantity: Number(stockItem.quantity) - line.quantity,
      })
    }

    const saleTransaction = {
      type: 'income',
      label: `Vente pharmacie - ${patientName} (#${prescriptionId})`,
      amount: totalAmount,
      date,
    }

    const updatedPrescription = {
      ...prescription,
      isSold: true,
      soldDate: date,
    }

    if (!isSupabaseEnabled) {
      setStock((prev) =>
        prev.map((medicine) => {
          const updated = updates.find((item) => item.id === medicine.id)
          return updated ? updated : medicine
        }),
      )
      setTransactions((prev) => [{ id: Date.now(), ...saleTransaction }, ...prev])
      setPrescriptions((prev) =>
        prev.map((item) => (item.id === updatedPrescription.id ? updatedPrescription : item)),
      )
      setSyncError('')
      return {
        success: true,
        message: `Vente enregistree. Total: ${totalAmount.toLocaleString()} FCFA.`,
      }
    }

    try {
      const savedUpdates = await Promise.all(updates.map((item) => updateRecord('stock', item.id, item)))
      const savedTransaction = await insertRecord('transactions', saleTransaction)
      const savedPrescription = await updateRecord('prescriptions', updatedPrescription.id, updatedPrescription)

      setStock((prev) =>
        prev.map((medicine) => {
          const updated = savedUpdates.find((item) => item.id === medicine.id)
          return updated ? updated : medicine
        }),
      )
      setTransactions((prev) => [savedTransaction, ...prev])
      setPrescriptions((prev) =>
        prev.map((item) => (item.id === savedPrescription.id ? savedPrescription : item)),
      )
      setSyncError('')
      return {
        success: true,
        message: `Vente enregistree. Total: ${totalAmount.toLocaleString()} FCFA.`,
      }
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec de vente ordonnance: ${detail}`)
      return { success: false, message: `Echec de la vente: ${detail}` }
    }
  }

  const addTicket = async (ticket) => {
    const newTicket = {
      id: Date.now(),
      ticketNumber: `TCK-${Date.now().toString().slice(-6)}`,
      medicines: '',
      consultation: DEFAULT_TICKET_SERVICE,
      ...ticket,
    }

    const linkedTransaction = buildTicketTransaction(newTicket)

    if (!isSupabaseEnabled) {
      setTickets((prev) => [newTicket, ...prev])
      setTransactions((prev) => [{ id: Date.now() + 1, ...linkedTransaction }, ...prev])
      setSyncError('')
      return newTicket
    }

    try {
      const savedTicket = await insertRecord('tickets', {
        ticketNumber: newTicket.ticketNumber,
        patientName: newTicket.patientName,
        medicines: '',
        consultation: DEFAULT_TICKET_SERVICE,
        totalAmount: newTicket.totalAmount,
        date: newTicket.date,
      })
      const savedTransaction = await insertRecord('transactions', linkedTransaction)
      setTickets((prev) => [savedTicket, ...prev])
      setTransactions((prev) => [savedTransaction, ...prev])
      setSyncError('')
      return savedTicket
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec de generation ticket: ${detail}`)
      return null
    }
  }

  const updateTicket = async (ticket) => {
    const normalizedTicket = {
      ...ticket,
      medicines: '',
      consultation: ticket.consultation || DEFAULT_TICKET_SERVICE,
    }
    const linkedTransactionPayload = buildTicketTransaction(normalizedTicket)

    if (!isSupabaseEnabled) {
      setTickets((prev) => prev.map((item) => (item.id === normalizedTicket.id ? normalizedTicket : item)))
      setTransactions((prev) => {
        const linkedTransaction = findLinkedTicketTransaction(normalizedTicket.ticketNumber, prev)
        if (!linkedTransaction) {
          return [{ id: Date.now() + 2, ...linkedTransactionPayload }, ...prev]
        }

        return prev.map((transaction) =>
          transaction.id === linkedTransaction.id
            ? { ...transaction, ...linkedTransactionPayload }
            : transaction,
        )
      })
      setSyncError('')
      return normalizedTicket
    }

    try {
      const savedTicket = await updateRecord('tickets', normalizedTicket.id, normalizedTicket)
      const linkedTransaction = findLinkedTicketTransaction(normalizedTicket.ticketNumber)
      let savedTransaction = null

      if (linkedTransaction) {
        savedTransaction = await updateRecord('transactions', linkedTransaction.id, {
          ...linkedTransaction,
          ...linkedTransactionPayload,
        })
      } else {
        savedTransaction = await insertRecord('transactions', linkedTransactionPayload)
      }

      setTickets((prev) => prev.map((item) => (item.id === savedTicket.id ? savedTicket : item)))
      setTransactions((prev) => {
        if (!savedTransaction) {
          return prev
        }

        if (!linkedTransaction) {
          return [savedTransaction, ...prev]
        }

        return prev.map((transaction) =>
          transaction.id === savedTransaction.id ? savedTransaction : transaction,
        )
      })
      setSyncError('')
      return savedTicket
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec de mise a jour ticket: ${detail}`)
      return null
    }
  }

  const addTransaction = async (transaction) => {
    if (!isSupabaseEnabled) {
      setTransactions((prev) => [{ id: Date.now(), ...transaction }, ...prev])
      return
    }

    try {
      const saved = await insertRecord('transactions', transaction)
      setTransactions((prev) => [saved, ...prev])
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec de creation transaction: ${detail}`)
    }
  }

  const addStaffMember = async (member) => {
    if (!isSupabaseEnabled) {
      setStaff((prev) => [{ id: Date.now(), ...member }, ...prev])
      return
    }

    try {
      const saved = await insertRecord('staff', member)
      setStaff((prev) => [saved, ...prev])
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec d'ajout personnel: ${detail}`)
    }
  }

  const updateStaffMember = async (member) => {
    if (!isSupabaseEnabled) {
      setStaff((prev) => prev.map((s) => (s.id === member.id ? member : s)))
      return
    }

    try {
      const saved = await updateRecord('staff', member.id, member)
      setStaff((prev) => prev.map((s) => (s.id === saved.id ? saved : s)))
    } catch (error) {
      const detail = error?.message || error?.hint || 'Erreur inconnue'
      setSyncError(`Echec de mise a jour personnel: ${detail}`)
    }
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard metrics={dashboardMetrics} transactions={transactions} />
      case 'patients':
        return <Patients patients={patients} onAddPatient={addPatient} onUpdatePatient={updatePatient} />
      case 'prescriptions':
        return (
          <Prescriptions
            prescriptions={prescriptions}
            patients={patients}
            stock={stock}
            onAddPrescription={addPrescription}
          />
        )
      case 'pharmacy':
        return (
          <Pharmacy
            stock={stock}
            prescriptions={prescriptions}
            onAddMedicine={addMedicine}
            onUpdateMedicine={updateMedicine}
            onDeleteMedicine={deleteMedicine}
            onSellFromPrescription={sellFromPrescription}
          />
        )
      case 'tickets':
        return (
          <Tickets
            tickets={tickets}
            patients={patients}
            onAddTicket={addTicket}
            onUpdateTicket={updateTicket}
          />
        )
      case 'accounting':
        return <Accounting transactions={transactions} onAddTransaction={addTransaction} />
      case 'staff':
        return <Staff staff={staff} onAddStaff={addStaffMember} onUpdateStaff={updateStaffMember} />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard metrics={dashboardMetrics} transactions={transactions} />
    }
  }

  if (isAuthLoading) {
    return <AuthScreen />
  }

  if (!session) {
    return <AuthScreen />
  }

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="app-main">
        <Navbar
          healthPostName="Poste de Santé Jaxaay Parcelles"
          pageTitle={pageTitles[activePage]}
          notifications={notifications}
          onNavigate={handleNavigate}
          currentUserEmail={session.user.email}
          onSignOut={handleSignOut}
        />
        {isLoading ? <p className="sync-info">Chargement des donnees Supabase...</p> : null}
        {syncError ? <p className="sync-error">{syncError}</p> : null}
        {!isSupabaseEnabled ? <p className="sync-info">Mode local actif (Supabase non configure).</p> : null}

        {isAccountingPromptOpen ? (
          <div className="accounting-lock-overlay" role="dialog" aria-modal="true" aria-label="Acces comptabilite">
            <form className="accounting-lock-card" onSubmit={handleAccountingUnlock}>
              <h3>Acces Comptabilite</h3>
              <p>Entrez le mot de passe pour ouvrir la comptabilite.</p>
              <input
                type="password"
                value={accountingPassword}
                onChange={(event) => setAccountingPassword(event.target.value)}
                placeholder="Mot de passe"
                autoFocus
                required
              />
              {accountingError ? <span className="accounting-lock-error">{accountingError}</span> : null}
              <div className="accounting-lock-actions">
                <button type="submit">Valider</button>
                <button
                  type="button"
                  className="accounting-lock-cancel"
                  onClick={() => {
                    setIsAccountingPromptOpen(false)
                    setAccountingPassword('')
                    setAccountingError('')
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {isSettingsPromptOpen ? (
          <div className="accounting-lock-overlay" role="dialog" aria-modal="true" aria-label="Acces parametres">
            <form className="accounting-lock-card" onSubmit={handleSettingsUnlock}>
              <h3>Acces Parametres</h3>
              <p>Entrez le mot de passe pour ouvrir les parametres.</p>
              <input
                type="password"
                value={settingsPassword}
                onChange={(event) => setSettingsPassword(event.target.value)}
                placeholder="Mot de passe"
                autoFocus
                required
              />
              {settingsError ? <span className="accounting-lock-error">{settingsError}</span> : null}
              <div className="accounting-lock-actions">
                <button type="submit">Valider</button>
                <button
                  type="button"
                  className="accounting-lock-cancel"
                  onClick={() => {
                    setIsSettingsPromptOpen(false)
                    setSettingsPassword('')
                    setSettingsError('')
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <main className="app-content">{renderPage()}</main>
      </div>
    </div>
  )
}

export default App
