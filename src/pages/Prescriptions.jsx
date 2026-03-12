import { useState } from 'react'
import './Prescriptions.css'

const emptyPrescription = {
  patientName: '',
  doctor: '',
  medicines: '',
  dosage: '',
  date: new Date().toISOString().slice(0, 10),
  isSold: false,
  soldDate: null,
}

export function Prescriptions({ prescriptions, patients, stock, onAddPrescription }) {
  const [formData, setFormData] = useState(emptyPrescription)
  const [selectedPrescription, setSelectedPrescription] = useState(null)

  const normalizeText = (value) =>
    String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

  const getMedicineStatus = (medicineName) => {
    const token = normalizeText(medicineName)
    const matchedStock = stock.find((item) => {
      const stockName = normalizeText(item.name)
      return stockName.includes(token) || token.includes(stockName)
    })

    if (!matchedStock) {
      return { status: 'missing', label: 'Non disponible', stockName: null, unitPrice: null }
    }

    if (Number(matchedStock.quantity) <= 0) {
      return {
        status: 'missing',
        label: 'Rupture',
        stockName: matchedStock.name,
        unitPrice: Number(matchedStock.salePrice),
      }
    }

    return {
      status: 'available',
      label: 'Disponible',
      stockName: matchedStock.name,
      unitPrice: Number(matchedStock.salePrice),
    }
  }

  const selectedPrescriptionDetails = selectedPrescription
    ? String(selectedPrescription.medicines)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((medicine, index) => {
          const medicineStatus = getMedicineStatus(medicine)
          return {
            key: `${medicine}-${index}`,
            medicine,
            medicineStatus,
          }
        })
    : []

  const selectedPrescriptionTotal = selectedPrescriptionDetails.reduce((sum, entry) => {
    const price = Number(entry.medicineStatus.unitPrice)
    return Number.isFinite(price) ? sum + price : sum
  }, 0)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const saved = await onAddPrescription(formData)
    if (saved) setSelectedPrescription(saved)
    setFormData(emptyPrescription)
  }

  return (
    <section className="prescriptions">
      <div className="panel">
        <h3>Creer une ordonnance</h3>
        <form className="prescriptions__form" onSubmit={handleSubmit}>
          <select
            value={formData.patientName}
            onChange={(event) => setFormData((prev) => ({ ...prev, patientName: event.target.value }))}
            required
          >
            <option value="">Choisir un patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={`${patient.firstName} ${patient.lastName}`}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>
          <input
            placeholder="Medecin"
            value={formData.doctor}
            onChange={(event) => setFormData((prev) => ({ ...prev, doctor: event.target.value }))}
            required
          />
          <input
            placeholder="Medicaments (separes par virgule)"
            value={formData.medicines}
            onChange={(event) => setFormData((prev) => ({ ...prev, medicines: event.target.value }))}
            required
          />
          <input
            placeholder="Posologie"
            value={formData.dosage}
            onChange={(event) => setFormData((prev) => ({ ...prev, dosage: event.target.value }))}
            required
          />
          <input
            type="date"
            value={formData.date}
            onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
          <button type="submit">Enregistrer</button>
        </form>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Historique des ordonnances</h3>
        </div>
        <p className="prescriptions__hint">Medicaments disponibles: {stock.length}</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Medecin</th>
                <th>Medicaments</th>
                <th>Posologie</th>
                <th>Date</th>
                <th>Vente</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((prescription) => (
                <tr key={prescription.id}>
                  <td data-label="Patient">{prescription.patientName}</td>
                  <td data-label="Medecin">{prescription.doctor}</td>
                  <td data-label="Medicaments">{prescription.medicines}</td>
                  <td data-label="Posologie">{prescription.dosage}</td>
                  <td data-label="Date">{prescription.date}</td>
                  <td data-label="Vente">
                    {prescription.isSold ? (
                      <span className="prescriptions__status sold">Vendu {prescription.soldDate ? `(${prescription.soldDate})` : ''}</span>
                    ) : (
                      <span className="prescriptions__status pending">En attente</span>
                    )}
                  </td>
                  <td data-label="Action">
                    <button
                      type="button"
                      className="prescriptions__view-btn"
                      title="Voir ordonnance"
                      onClick={() => setSelectedPrescription(prescription)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 5C6.5 5 2.1 8.3.3 12c1.8 3.7 6.2 7 11.7 7s9.9-3.3 11.7-7c-1.8-3.7-6.2-7-11.7-7zm0 11.2A4.2 4.2 0 1 1 12 7.8a4.2 4.2 0 0 1 0 8.4zm0-6.7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
                      </svg>
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPrescription ? (
        <div className="prescriptions__modal" role="dialog" aria-modal="true" aria-label="Detail ordonnance">
          <article className="prescriptions__modal-card">
            <div className="prescriptions__modal-head">
              <h3>Ordonnance de {selectedPrescription.patientName}</h3>
              <button type="button" className="prescriptions__modal-close" onClick={() => setSelectedPrescription(null)}>
                Fermer
              </button>
            </div>

            <p>
              Medecin: <strong>{selectedPrescription.doctor}</strong>
            </p>
            <p>
              Date: <strong>{selectedPrescription.date}</strong>
            </p>
            <p>
              Statut vente:{' '}
              {selectedPrescription.isSold ? (
                <span className="prescriptions__status sold">Vendu {selectedPrescription.soldDate ? `(${selectedPrescription.soldDate})` : ''}</span>
              ) : (
                <span className="prescriptions__status pending">En attente</span>
              )}
            </p>

            <div className="prescriptions__medicine-list">
              {selectedPrescriptionDetails.map((entry) => (
                <div key={entry.key} className="prescriptions__medicine-row">
                  <span>{entry.medicine}</span>
                  <div className="prescriptions__medicine-meta">
                    {entry.medicineStatus.stockName ? <small>{entry.medicineStatus.stockName}</small> : null}
                    <small className="prescriptions__price">
                      {entry.medicineStatus.unitPrice !== null
                        ? `${entry.medicineStatus.unitPrice.toLocaleString()} FCFA`
                        : '--'}
                    </small>
                    <span className={`prescriptions__stock-pill ${entry.medicineStatus.status}`}>
                      {entry.medicineStatus.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="prescriptions__total">
              Total ordonnance estime: <strong>{selectedPrescriptionTotal.toLocaleString()} FCFA</strong>
            </p>
            <p className="prescriptions__total-note">
              Les medicaments non disponibles ne sont pas inclus dans le total.
            </p>
          </article>
        </div>
      ) : null}
    </section>
  )
}
