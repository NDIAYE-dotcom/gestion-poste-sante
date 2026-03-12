const today = new Date().toISOString().slice(0, 10)

export const initialPatients = [
  {
    id: 1,
    firstName: 'Aissatou',
    lastName: 'Ba',
    age: 31,
    sex: 'Femme',
    phone: '77 123 45 67',
    address: 'Quartier Escale, Kaolack',
    consultationDate: today,
    diagnosis: 'Paludisme simple',
  },
  {
    id: 2,
    firstName: 'Mamadou',
    lastName: 'Sarr',
    age: 44,
    sex: 'Homme',
    phone: '76 987 65 43',
    address: 'Medina, Dakar',
    consultationDate: today,
    diagnosis: 'Hypertension arterielle',
  },
]

export const initialPrescriptions = [
  {
    id: 1,
    patientName: 'Aissatou Ba',
    doctor: 'Dr. Faye',
    medicines: 'Paracetamol, Coartem',
    dosage: '2 prises par jour pendant 3 jours',
    date: today,
    isSold: false,
    soldDate: null,
  },
]

export const initialStock = [
  {
    id: 1,
    name: 'Paracetamol 500mg',
    purchasePrice: 300,
    salePrice: 500,
    quantity: 130,
    expirationDate: '2027-10-01',
    alertThreshold: 20,
  },
  {
    id: 2,
    name: 'Amoxicilline 1g',
    purchasePrice: 500,
    salePrice: 800,
    quantity: 12,
    expirationDate: '2026-09-15',
    alertThreshold: 15,
  },
]

export const initialTickets = [
  {
    id: 1,
    ticketNumber: 'TCK-001120',
    patientName: 'Mamadou Sarr',
    medicines: '',
    consultation: 'Ticket de consultation',
    totalAmount: 4500,
    date: today,
  },
]

export const initialTransactions = [
  { id: 1, type: 'income', label: 'Consultation generale', amount: 5000, date: today },
  { id: 2, type: 'income', label: 'Vente pharmacie', amount: 8500, date: today },
  { id: 3, type: 'expense', label: 'Achat seringues', amount: 3000, date: today },
]

export const initialStaff = [
  {
    id: 1,
    name: 'Ndeye Diop',
    role: 'Infirmiere chef',
    phone: '78 222 19 19',
    schedule: '07:00 - 15:00',
    guardStart: '07:00',
    guardEnd: '15:00',
    onDuty: true,
  },
  {
    id: 2,
    name: 'Cheikh Gueye',
    role: 'Agent pharmacie',
    phone: '70 333 45 45',
    schedule: '15:00 - 22:00',
    guardStart: '15:00',
    guardEnd: '22:00',
    onDuty: false,
  },
]
