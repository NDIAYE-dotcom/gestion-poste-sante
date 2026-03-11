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

  const dailyTotal = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return transactions
      .filter((t) => t.type === 'income' && t.date === today)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }, [transactions])

  const monthlyIncome = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7)
    return transactions
      .filter((t) => t.type === 'income' && t.date.startsWith(month))
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }, [transactions])

  const handleSubmit = (event) => {
    event.preventDefault()
    onAddTransaction({ ...formData, amount: Number(formData.amount) })
    setFormData(emptyTransaction)
  }

  return (
    <section className="accounting">
      <div className="accounting__stats">
        <article className="stat-card">
          <p>Recettes journalieres</p>
          <strong>{dailyTotal.toLocaleString()} FCFA</strong>
        </article>
        <article className="stat-card">
          <p>Revenus mensuels</p>
          <strong>{monthlyIncome.toLocaleString()} FCFA</strong>
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
