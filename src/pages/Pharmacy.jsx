import { useEffect, useMemo, useState } from 'react'
import './Pharmacy.css'

const emptyMedicine = {
  name: '',
  purchasePrice: '',
  salePrice: '',
  quantity: '',
  expirationDate: '',
  alertThreshold: 10,
}

const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const matchStockFromToken = (token, stock) => {
  const normalizedToken = normalizeText(token)
  if (!normalizedToken) {
    return null
  }

  return (
    stock.find((medicine) => {
      const medicineName = normalizeText(medicine.name)
      return medicineName.includes(normalizedToken) || normalizedToken.includes(medicineName)
    }) ?? null
  )
}

export function Pharmacy({ stock, prescriptions, onAddMedicine, onUpdateMedicine, onDeleteMedicine, onSellFromPrescription }) {
  const [formData, setFormData] = useState(emptyMedicine)
  const [editingId, setEditingId] = useState(null)
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10))
  const [saleQuantities, setSaleQuantities] = useState({})
  const [saleFeedback, setSaleFeedback] = useState('')
  const [saleError, setSaleError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      ...formData,
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice),
      quantity: Number(formData.quantity),
      alertThreshold: Number(formData.alertThreshold),
    }

    if (editingId) {
      onUpdateMedicine({ ...payload, id: editingId })
      setEditingId(null)
    } else {
      onAddMedicine(payload)
    }

    setFormData(emptyMedicine)
  }

  const startEdit = (medicine) => {
    setEditingId(medicine.id)
    setFormData({ ...medicine })
  }

  const selectedPrescription = useMemo(
    () => prescriptions.find((item) => String(item.id) === selectedPrescriptionId) ?? null,
    [prescriptions, selectedPrescriptionId],
  )

  const pendingPrescriptions = useMemo(
    () => prescriptions.filter((prescription) => !prescription.isSold),
    [prescriptions],
  )

  const matchedSaleItems = useMemo(() => {
    if (!selectedPrescription) {
      return []
    }

    const rawTokens = String(selectedPrescription.medicines ?? '')
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean)

    const grouped = []

    rawTokens.forEach((token) => {
      const matchedStock = matchStockFromToken(token, stock)
      if (!matchedStock) {
        grouped.push({
          key: `missing-${token}`,
          token,
          stockId: null,
          stockName: null,
          stockQuantity: 0,
          salePrice: 0,
          isMissing: true,
          isUnavailable: false,
          quantity: 1,
        })
        return
      }

      if (Number(matchedStock.quantity) <= 0) {
        grouped.push({
          key: `unavailable-${matchedStock.id}-${token}`,
          token,
          stockId: matchedStock.id,
          stockName: matchedStock.name,
          stockQuantity: Number(matchedStock.quantity),
          salePrice: Number(matchedStock.salePrice),
          isMissing: false,
          isUnavailable: true,
          quantity: 1,
        })
        return
      }

      const existing = grouped.find((line) => line.stockId === matchedStock.id)
      if (existing) {
        existing.quantity += 1
        return
      }

      grouped.push({
        key: `stock-${matchedStock.id}`,
        token,
        stockId: matchedStock.id,
        stockName: matchedStock.name,
        stockQuantity: Number(matchedStock.quantity),
        salePrice: Number(matchedStock.salePrice),
        isMissing: false,
        isUnavailable: false,
        quantity: 1,
      })
    })

    return grouped
  }, [selectedPrescription, stock])

  useEffect(() => {
    const initialQuantities = {}
    matchedSaleItems.forEach((line) => {
      if (!line.isMissing && !line.isUnavailable && line.stockId) {
        initialQuantities[line.stockId] = line.quantity
      }
    })
    setSaleQuantities(initialQuantities)
    setSaleFeedback('')
    setSaleError('')
  }, [matchedSaleItems])

  const saleTotals = useMemo(() => {
    return matchedSaleItems
      .filter((line) => !line.isMissing && !line.isUnavailable && line.stockId)
      .reduce((sum, line) => {
        const selectedQty = Number(saleQuantities[line.stockId] ?? line.quantity)
        return sum + line.salePrice * Math.max(selectedQty, 0)
      }, 0)
  }, [matchedSaleItems, saleQuantities])

  const handleSellFromPrescription = async (event) => {
    event.preventDefault()
    setSaleFeedback('')
    setSaleError('')

    if (!selectedPrescription) {
      setSaleError('Choisis une ordonnance avant de lancer la vente.')
      return
    }

    const excludedItems = matchedSaleItems.filter((line) => line.isMissing || line.isUnavailable)

    const items = matchedSaleItems
      .filter((line) => !line.isMissing && !line.isUnavailable && line.stockId)
      .map((line) => ({
        stockId: line.stockId,
        quantity: Number(saleQuantities[line.stockId] ?? line.quantity),
      }))
      .filter((line) => Number.isFinite(line.quantity) && line.quantity > 0)

    if (items.length === 0) {
      setSaleError('Aucune quantite valide a vendre.')
      return
    }

    const result = await onSellFromPrescription({
      prescriptionId: selectedPrescription.id,
      patientName: selectedPrescription.patientName,
      prescriptionDate: selectedPrescription.date,
      date: saleDate,
      items,
    })

    if (!result?.success) {
      setSaleError(result?.message || 'Vente impossible.')
      return
    }

    const exclusionSuffix =
      excludedItems.length > 0
        ? ` ${excludedItems.length} medicament(s) hors stock/rupture non vendus.`
        : ''
    setSaleFeedback(`${result.message}${exclusionSuffix}`)
    setSelectedPrescriptionId('')
  }

  return (
    <section className="pharmacy">
      <div className="panel">
        <h3>Vente depuis ordonnance</h3>
        <form className="pharmacy__sale" onSubmit={handleSellFromPrescription}>
          <select value={selectedPrescriptionId} onChange={(event) => setSelectedPrescriptionId(event.target.value)} required>
            <option value="">Choisir une ordonnance</option>
            {pendingPrescriptions.map((prescription) => (
              <option key={prescription.id} value={prescription.id}>
                {prescription.patientName} - {prescription.date}
              </option>
            ))}
          </select>
          <input type="date" value={saleDate} onChange={(event) => setSaleDate(event.target.value)} required />
          <button type="submit">Vendre medicaments</button>
        </form>

        {selectedPrescription ? (
          <div className="pharmacy__sale-preview">
            <p>
              Patient: <strong>{selectedPrescription.patientName}</strong>
            </p>
            <div className="pharmacy__sale-lines">
              {matchedSaleItems.map((line) => (
                <div
                  key={line.key}
                  className={`pharmacy__sale-line ${line.isMissing || line.isUnavailable ? 'is-missing' : ''}`}
                >
                  <span>{line.isMissing ? line.token : line.stockName}</span>
                  {line.isMissing || line.isUnavailable ? (
                    <em>{line.isMissing ? 'Introuvable en stock' : 'Rupture de stock'}</em>
                  ) : (
                    <div className="pharmacy__sale-controls">
                      <input
                        type="number"
                        min="1"
                        max={line.stockQuantity}
                        value={saleQuantities[line.stockId] ?? line.quantity}
                        onChange={(event) =>
                          setSaleQuantities((prev) => ({
                            ...prev,
                            [line.stockId]: event.target.value,
                          }))
                        }
                      />
                      <small>
                        Stock: {line.stockQuantity} | Prix: {line.salePrice} FCFA
                      </small>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="pharmacy__sale-total">Total estime: {saleTotals.toLocaleString()} FCFA</p>
          </div>
        ) : null}

        {saleFeedback ? <p className="pharmacy__sale-feedback">{saleFeedback}</p> : null}
        {saleError ? <p className="pharmacy__sale-error">{saleError}</p> : null}
        {pendingPrescriptions.length === 0 ? (
          <p className="pharmacy__sale-feedback">Toutes les ordonnances enregistrees sont deja vendues.</p>
        ) : null}
      </div>

      <div className="panel">
        <h3>{editingId ? 'Modifier un medicament' : 'Ajouter un medicament'}</h3>
        <form className="pharmacy__form" onSubmit={handleSubmit}>
          <input
            placeholder="Nom du medicament"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Prix achat"
            value={formData.purchasePrice}
            onChange={(event) => setFormData((prev) => ({ ...prev, purchasePrice: event.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Prix vente"
            value={formData.salePrice}
            onChange={(event) => setFormData((prev) => ({ ...prev, salePrice: event.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Quantite"
            value={formData.quantity}
            onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
            required
          />
          <input
            type="date"
            value={formData.expirationDate}
            onChange={(event) => setFormData((prev) => ({ ...prev, expirationDate: event.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Seuil d'alerte"
            value={formData.alertThreshold}
            onChange={(event) => setFormData((prev) => ({ ...prev, alertThreshold: event.target.value }))}
            required
          />
          <button type="submit">{editingId ? 'Mettre a jour' : 'Ajouter'}</button>
        </form>
      </div>

      <div className="panel">
        <h3>Stock et alertes rupture</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prix achat</th>
                <th>Prix vente</th>
                <th>Stock</th>
                <th>Expiration</th>
                <th>Alerte</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((medicine) => (
                <tr key={medicine.id}>
                  <td data-label="Nom">{medicine.name}</td>
                  <td data-label="Prix achat">{medicine.purchasePrice} FCFA</td>
                  <td data-label="Prix vente">{medicine.salePrice} FCFA</td>
                  <td data-label="Stock">{medicine.quantity}</td>
                  <td data-label="Expiration">{medicine.expirationDate}</td>
                  <td data-label="Alerte">
                    <span className={medicine.quantity <= medicine.alertThreshold ? 'stock-alert' : 'stock-ok'}>
                      {medicine.quantity <= medicine.alertThreshold ? 'Rupture proche' : 'Stable'}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="pharmacy__actions">
                      <button type="button" onClick={() => startEdit(medicine)}>
                        Modifier
                      </button>
                      <button type="button" onClick={() => onDeleteMedicine(medicine.id)}>
                        Supprimer
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
