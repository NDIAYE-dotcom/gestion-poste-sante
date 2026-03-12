import { useState } from 'react'
import { exportTicketPdf, exportTicketListPdf } from '../utils/exportPdf'
import './Tickets.css'

const emptyTicket = {
  patientName: '',
  totalAmount: '',
  date: new Date().toISOString().slice(0, 10),
}

export function Tickets({ tickets, patients, onAddTicket, onUpdateTicket }) {
  const [formData, setFormData] = useState(emptyTicket)
  const [lastTicket, setLastTicket] = useState(null)
  const [editingTicketId, setEditingTicketId] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const ticketPayload = { ...formData, totalAmount: Number(formData.totalAmount) }
    const currentTicket = tickets.find((ticket) => ticket.id === editingTicketId)
    const savedTicket = editingTicketId
      ? await onUpdateTicket({ ...ticketPayload, id: editingTicketId, ticketNumber: currentTicket?.ticketNumber })
      : await onAddTicket(ticketPayload)

    if (!savedTicket) {
      return
    }

    setLastTicket(savedTicket)
    setFormData(emptyTicket)
    setEditingTicketId(null)
  }

  const startEdit = (ticket) => {
    setEditingTicketId(ticket.id)
    setFormData({
      patientName: ticket.patientName,
      totalAmount: ticket.totalAmount,
      date: ticket.date,
    })
    setLastTicket(ticket)
  }

  const cancelEdit = () => {
    setEditingTicketId(null)
    setFormData(emptyTicket)
  }

  return (
    <section className="tickets">
      <div className="panel">
        <h3>{editingTicketId ? 'Modifier un ticket de caisse' : 'Creation de ticket de caisse'}</h3>
        <form className="tickets__form" onSubmit={handleSubmit}>
          <select
            value={formData.patientName}
            onChange={(event) => setFormData((prev) => ({ ...prev, patientName: event.target.value }))}
            required
          >
            <option value="">Selectionner patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={`${patient.firstName} ${patient.lastName}`}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Montant du ticket"
            value={formData.totalAmount}
            onChange={(event) => setFormData((prev) => ({ ...prev, totalAmount: event.target.value }))}
            required
          />
          <input
            type="date"
            value={formData.date}
            onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
          <div className="tickets__actions">
            <button type="submit">{editingTicketId ? 'Mettre a jour' : 'Generer ticket'}</button>
            {editingTicketId ? (
              <button type="button" className="tickets__cancel" onClick={cancelEdit}>
                Annuler
              </button>
            ) : null}
            <button
              type="button"
              disabled={!lastTicket}
              onClick={() => lastTicket && exportTicketPdf(lastTicket)}
            >
              Imprimer ticket
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Historique des tickets</h3>
          {tickets.length > 0 && (
            <button type="button" className="btn-export" onClick={() => exportTicketListPdf(tickets)}>
              Exporter liste PDF
            </button>
          )}
        </div>
        <p className="tickets__hint">Le ticket de caisse est delivre avant la consultation et reste separe de l'ordonnance.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>N ticket</th>
                <th>Patient</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td data-label="N ticket">{ticket.ticketNumber}</td>
                  <td data-label="Patient">{ticket.patientName}</td>
                  <td data-label="Montant">{ticket.totalAmount} FCFA</td>
                  <td data-label="Date">{ticket.date}</td>
                  <td data-label="Actions">
                    <div className="tickets__row-actions">
                      <button
                        type="button"
                        className="tickets__edit-row"
                        title="Modifier le ticket"
                        onClick={() => startEdit(ticket)}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn-pdf-row"
                        title="Imprimer le ticket"
                        onClick={() => exportTicketPdf(ticket)}
                      >
                        Imprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
