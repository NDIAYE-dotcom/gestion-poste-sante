import './Dashboard.css'

export function Dashboard({ metrics, transactions }) {
  const cashBalance = transactions.reduce((sum, item) => {
    const amount = Number(item.amount) || 0
    return item.type === 'income' ? sum + amount : sum - amount
  }, 0)

  const incomeTransactions = transactions
    .filter((t) => t.type === 'income')
    .slice(0, 7)
    .reverse()

  const maxAmount = Math.max(...incomeTransactions.map((t) => t.amount), 1)
  const totalRecentIncome = incomeTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const averageIncome = incomeTransactions.length ? Math.round(totalRecentIncome / incomeTransactions.length) : 0
  const latestIncome = incomeTransactions[incomeTransactions.length - 1] ?? null

  const cards = [
    { label: 'Caisse actuelle', value: `${cashBalance.toLocaleString()} FCFA`, tone: 'mint' },
    { label: 'Patients du jour', value: metrics.patientsToday, tone: 'sky' },
    { label: 'Recettes journalieres', value: `${metrics.dailyRevenue.toLocaleString()} FCFA`, tone: 'teal' },
    { label: 'Ordonnances', value: metrics.prescriptionsToday, tone: 'sand' },
    { label: 'Medicaments en rupture', value: metrics.outOfStock, tone: 'rose' },
    { label: 'Personnel en service', value: metrics.onDuty, tone: 'sky' },
  ]

  return (
    <section className="dashboard">
      <div className="dashboard__cards">
        {cards.map((card) => (
          <article key={card.label} className={`dashboard__stat-card dashboard__stat-card--${card.tone}`}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <article className="dashboard__finance panel">
        <div className="dashboard__finance-header">
          <div>
            <p className="dashboard__eyebrow">Comptabilite recente</p>
            <h3>Entrees financieres recentes</h3>
          </div>
          <div className="dashboard__finance-total">
            <span>Total recent</span>
            <strong>{totalRecentIncome.toLocaleString()} FCFA</strong>
          </div>
        </div>

        <div className="dashboard__finance-grid">
          <div className="dashboard__finance-chart">
            <div className="dashboard__finance-insights">
              <article>
                <span>Moyenne</span>
                <strong>{averageIncome.toLocaleString()} FCFA</strong>
              </article>
              <article>
                <span>Derniere entree</span>
                <strong>{latestIncome ? `${Number(latestIncome.amount).toLocaleString()} FCFA` : 'Aucune'}</strong>
              </article>
            </div>

            {incomeTransactions.length ? (
              <div className="finance-chart__bars">
                {incomeTransactions.map((item) => (
                  <div key={item.id} className="finance-chart__item">
                    <span className="finance-chart__amount">{Number(item.amount).toLocaleString()}</span>
                    <div className="finance-chart__track">
                      <div
                        className="finance-chart__bar"
                        style={{ height: `${Math.max((item.amount / maxAmount) * 140, 18)}px` }}
                      />
                    </div>
                    <span>{item.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <strong>Aucune entree financiere recente</strong>
                <p>Les paiements et transactions apparaitront ici des qu'ils seront enregistres.</p>
              </div>
            )}
          </div>

          <div className="dashboard__finance-list">
            <h4>Dernieres recettes</h4>
            {incomeTransactions.length ? (
              <div className="dashboard__finance-rows">
                {incomeTransactions.slice().reverse().map((item) => (
                  <article key={item.id} className="dashboard__finance-row">
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.date}</span>
                    </div>
                    <b>{Number(item.amount).toLocaleString()} FCFA</b>
                  </article>
                ))}
              </div>
            ) : (
              <p className="dashboard__finance-placeholder">Aucune transaction disponible pour le moment.</p>
            )}
          </div>
        </div>
      </article>
    </section>
  )
}
