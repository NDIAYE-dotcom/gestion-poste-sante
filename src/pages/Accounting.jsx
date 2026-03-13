import { useMemo, useState } from 'react'
import './Accounting.css'

const emptyTransaction = {
  type: 'income',
  label: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
}

export function Accounting({ transactions, onAddTransaction }) {
  const [formData, setFormData] = useState(emptyTransaction)

  const cashBalance = useMemo(() => {
    return transactions.reduce((sum, item) => {
      const amount = Number(item.amount) || 0
      return item.type === 'income' ? sum + amount : sum - amount
    }, 0)
  }, [transactions])

  const periodStats = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const currentMonth = now.toISOString().slice(0, 7)
    const currentYear = now.toISOString().slice(0, 4)

    const compute = (predicate) => {
      const inPeriod = transactions.filter(predicate)
      const income = inPeriod
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount), 0)
      const expense = inPeriod
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0)

      return {
        income,
        expense,
        net: income - expense,
      }
    }

    return {
      daily: compute((item) => item.date === today),
      monthly: compute((item) => item.date.startsWith(currentMonth)),
      yearly: compute((item) => item.date.startsWith(currentYear)),
    }
  }, [transactions])

  const handleSubmit = (event) => {
    event.preventDefault()
    onAddTransaction({ ...formData, amount: Number(formData.amount) })
    setFormData(emptyTransaction)
  }

  return (
    <section className="accounting">
      <div className="panel">
        <h3>Caisse actuelle</h3>
        <p className={`accounting__cash-balance ${cashBalance >= 0 ? 'is-positive' : 'is-negative'}`}>
          {cashBalance.toLocaleString()} FCFA
        </p>
      </div>

      <div className="accounting__stats">
        <article className="stat-card stat-card--daily">
          <p>Journalier</p>
          <div className="stat-card__grid">
            <span>Entrees</span>
            <strong className="stat-value stat-value--income">{periodStats.daily.income.toLocaleString()} FCFA</strong>
            <span>Sorties</span>
            <strong className="stat-value stat-value--expense">{periodStats.daily.expense.toLocaleString()} FCFA</strong>
            <span>Solde net</span>
            <strong className={`stat-value ${periodStats.daily.net >= 0 ? 'stat-value--income' : 'stat-value--expense'}`}>
              {periodStats.daily.net.toLocaleString()} FCFA
            </strong>
          </div>
        </article>
        <article className="stat-card stat-card--monthly">
          <p>Mensuel</p>
          <div className="stat-card__grid">
            <span>Entrees</span>
            <strong className="stat-value stat-value--income">{periodStats.monthly.income.toLocaleString()} FCFA</strong>
            <span>Sorties</span>
            <strong className="stat-value stat-value--expense">{periodStats.monthly.expense.toLocaleString()} FCFA</strong>
            <span>Solde net</span>
            <strong className={`stat-value ${periodStats.monthly.net >= 0 ? 'stat-value--income' : 'stat-value--expense'}`}>
              {periodStats.monthly.net.toLocaleString()} FCFA
            </strong>
          </div>
        </article>
        <article className="stat-card stat-card--yearly">
          <p>Annuel</p>
          <div className="stat-card__grid">
            <span>Entrees</span>
            <strong className="stat-value stat-value--income">{periodStats.yearly.income.toLocaleString()} FCFA</strong>
            <span>Sorties</span>
            <strong className="stat-value stat-value--expense">{periodStats.yearly.expense.toLocaleString()} FCFA</strong>
            <span>Solde net</span>
            <strong className={`stat-value ${periodStats.yearly.net >= 0 ? 'stat-value--income' : 'stat-value--expense'}`}>
              {periodStats.yearly.net.toLocaleString()} FCFA
            </strong>
          </div>
        </article>
      </div>

      <div className="panel">
        <h3>Saisie comptable simplifiee</h3>
        <form className="accounting__form" onSubmit={handleSubmit}>
          <select value={formData.type} onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}>
            <option value="income">Entree financiere</option>
            <option value="expense">Depense</option>
          </select>
          <input
            placeholder="Libelle"
            value={formData.label}
            onChange={(event) => setFormData((prev) => ({ ...prev, label: event.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Montant"
            value={formData.amount}
            onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))}
            required
          />
          <input
            type="date"
            value={formData.date}
            onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
          <button type="submit">Ajouter transaction</button>
        </form>
      </div>

      <div className="panel">
        <h3>Historique des transactions</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Libelle</th>
                <th>Montant</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td data-label="Type">{transaction.type === 'income' ? 'Entree' : 'Depense'}</td>
                  <td data-label="Libelle">{transaction.label}</td>
                  <td data-label="Montant">{transaction.amount.toLocaleString()} FCFA</td>
                  <td data-label="Date">{transaction.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
