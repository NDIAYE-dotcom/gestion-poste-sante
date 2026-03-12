// jsPDF and autoTable are loaded dynamically the first time an export is triggered.

const POST_NAME = 'Poste de Santé'
const ACCENT = [33, 150, 243] // bleu

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function addHeader(doc, title) {
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(POST_NAME, 14, 10)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 14, 17)
  doc.setTextColor(0, 0, 0)
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')}  —  Page ${i} / ${pageCount}`,
      14,
      doc.internal.pageSize.height - 8,
    )
  }
}

// ─── Ticket unique ────────────────────────────────────────────────────────────
export async function exportTicketPdf(ticket) {
  const printWindow = window.open('', '_blank', 'width=420,height=720')

  if (!printWindow) {
    return
  }

  const ticketNumber = escapeHtml(ticket.ticketNumber ?? ticket.id ?? '—')
  const ticketDate = escapeHtml(ticket.date ?? '—')
  const patientName = escapeHtml(ticket.patientName ?? '—')
  const ticketLabel = escapeHtml(ticket.consultation ?? 'Ticket de consultation')
  const totalAmount = escapeHtml(`${ticket.totalAmount ?? 0} FCFA`)
  const printedAt = escapeHtml(new Date().toLocaleDateString('fr-FR'))

  printWindow.document.write(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ticket ${ticketNumber}</title>
        <style>
          :root {
            color-scheme: light;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #f3f6f6;
            color: #163e47;
          }

          .sheet {
            width: 80mm;
            margin: 0 auto;
            padding: 10mm 8mm;
            background: #ffffff;
          }

          .header {
            text-align: center;
            border-bottom: 2px dashed #9ab8bd;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }

          .header h1 {
            margin: 0;
            font-size: 18px;
          }

          .header p {
            margin: 4px 0 0;
            font-size: 12px;
          }

          .title {
            margin: 0 0 10px;
            text-align: center;
            font-size: 15px;
            font-weight: 700;
          }

          .row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 5px 0;
            border-bottom: 1px dashed #d4e2e0;
            font-size: 13px;
          }

          .row strong {
            color: #295863;
          }

          .total {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #167787;
            display: flex;
            justify-content: space-between;
            font-size: 17px;
            font-weight: 700;
            color: #167787;
          }

          .footer {
            margin-top: 14px;
            text-align: center;
            font-size: 11px;
            color: #648287;
          }

          @page {
            size: 80mm auto;
            margin: 6mm;
          }

          @media print {
            body {
              background: #ffffff;
            }

            .sheet {
              width: auto;
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <header class="header">
            <h1>${escapeHtml(POST_NAME)}</h1>
            <p>Gestion interne</p>
          </header>

          <h2 class="title">Ticket de caisse</h2>

          <div class="row"><strong>N ticket</strong><span>${ticketNumber}</span></div>
          <div class="row"><strong>Date</strong><span>${ticketDate}</span></div>
          <div class="row"><strong>Patient</strong><span>${patientName}</span></div>
          <div class="row"><strong>Objet</strong><span>${ticketLabel}</span></div>

          <div class="total"><span>Total</span><span>${totalAmount}</span></div>

          <footer class="footer">
            <div>Merci de conserver ce ticket</div>
            <div>Imprime le ${printedAt}</div>
          </footer>
        </main>
        <script>
          window.addEventListener('load', () => {
            setTimeout(() => {
              window.print()
              window.onafterprint = () => window.close()
            }, 150)
          })
        </script>
      </body>
    </html>
  `)

  printWindow.document.close()
}

// ─── Liste tickets ────────────────────────────────────────────────────────────
export async function exportTicketListPdf(tickets) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  addHeader(doc, 'Historique des tickets de caisse')

  autoTable(doc, {
    startY: 28,
    head: [['N° Ticket', 'Patient', 'Objet', 'Montant (FCFA)', 'Date']],
    body: tickets.map((t) => [
      t.ticketNumber ?? t.id,
      t.patientName ?? '—',
      t.consultation ?? 'Ticket de consultation',
      `${t.totalAmount ?? 0}`,
      t.date ?? '—',
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: ACCENT, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [235, 245, 255] },
    columnStyles: { 2: { cellWidth: 45 } },
  })

  const total = tickets.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0)
  const finalY = doc.lastAutoTable.finalY + 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...ACCENT)
  doc.text(`Total général: ${total} FCFA`, 14, finalY)
  doc.setTextColor(0, 0, 0)

  addFooter(doc)
  doc.save(`tickets-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ─── Ordonnance unique ────────────────────────────────────────────────────────
export async function exportPrescriptionPdf(prescription) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  addHeader(doc, 'Ordonnance médicale')

  doc.setFontSize(10)

  doc.setFont('helvetica', 'bold')
  doc.text(`Date:`, 14, 34)
  doc.setFont('helvetica', 'normal')
  doc.text(String(prescription.date ?? '—'), 48, 34)

  doc.setFont('helvetica', 'bold')
  doc.text(`Patient:`, 14, 41)
  doc.setFont('helvetica', 'normal')
  doc.text(String(prescription.patientName ?? '—'), 48, 41)

  doc.setFont('helvetica', 'bold')
  doc.text(`Médecin:`, 14, 48)
  doc.setFont('helvetica', 'normal')
  doc.text(String(prescription.doctor ?? '—'), 48, 48)

  doc.setFont('helvetica', 'bold')
  doc.text(`Médicaments:`, 14, 55)
  doc.setFont('helvetica', 'normal')
  const medicLines = doc.splitTextToSize(String(prescription.medicines ?? '—'), 90)
  doc.text(medicLines, 48, 55)

  const afterMedic = 55 + medicLines.length * 6

  doc.setFont('helvetica', 'bold')
  doc.text(`Posologie:`, 14, afterMedic + 4)
  doc.setFont('helvetica', 'normal')
  const dosageLines = doc.splitTextToSize(String(prescription.dosage ?? '—'), 90)
  doc.text(dosageLines, 48, afterMedic + 4)

  const afterDosage = afterMedic + 4 + dosageLines.length * 6

  doc.setDrawColor(...ACCENT)
  doc.setLineWidth(0.5)
  doc.line(14, afterDosage + 6, 134, afterDosage + 6)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Signature du médecin', 80, afterDosage + 20)

  addFooter(doc)
  const patientSlug = (prescription.patientName ?? 'patient').replace(/\s+/g, '-').toLowerCase()
  doc.save(`ordonnance-${patientSlug}-${prescription.date ?? 'date'}.pdf`)
}

// ─── Liste ordonnances ────────────────────────────────────────────────────────
export async function exportPrescriptionListPdf(prescriptions) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  addHeader(doc, 'Historique des ordonnances')

  autoTable(doc, {
    startY: 28,
    head: [['Patient', 'Médecin', 'Médicaments', 'Posologie', 'Date']],
    body: prescriptions.map((p) => [
      p.patientName ?? '—',
      p.doctor ?? '—',
      p.medicines ?? '—',
      p.dosage ?? '—',
      p.date ?? '—',
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: ACCENT, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [235, 245, 255] },
    columnStyles: { 2: { cellWidth: 50 }, 3: { cellWidth: 50 } },
  })

  addFooter(doc)
  doc.save(`ordonnances-${new Date().toISOString().slice(0, 10)}.pdf`)
}
