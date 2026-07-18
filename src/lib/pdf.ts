import type { CaseDocument, Client, Payment } from '../types'
import { CASE_STAGES } from '../data/mockData'
import { formatCurrency, formatDate } from './format'

// Brand colors (RGB)
const NAVY: [number, number, number] = [26, 54, 93]
const GOLD: [number, number, number] = [212, 175, 55]
const INK: [number, number, number] = [45, 55, 72]
const MUTE: [number, number, number] = [120, 132, 150]

const DOC_TYPE_LABEL: Record<string, string> = {
  contract: 'Договор',
  court: 'Судебный документ',
  payment: 'Платёжный документ',
  notice: 'Уведомление',
}

// Lazily load jsPDF + the (heavy) embedded fonts only when a PDF is requested.
async function createDoc() {
  const [{ jsPDF }, fonts] = await Promise.all([
    import('jspdf'),
    import('./robotoFont'),
  ])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.addFileToVFS('Roboto-Regular.ttf', fonts.ROBOTO_REGULAR_BASE64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', fonts.ROBOTO_BOLD_BASE64)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
  doc.setFont('Roboto', 'normal')
  return doc
}

type Doc = Awaited<ReturnType<typeof createDoc>>

const PW = 210 // page width mm
const MARGIN = 18

function drawHeader(doc: Doc, subtitle: string) {
  // Navy band
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, PW, 34, 'F')
  // Gold accent line
  doc.setFillColor(...GOLD)
  doc.rect(0, 34, PW, 1.5, 'F')

  // Logo mark
  doc.setFillColor(...GOLD)
  doc.roundedRect(MARGIN, 10, 12, 12, 2.5, 2.5, 'F')
  doc.setTextColor(...NAVY)
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(11)
  doc.text('НМ', MARGIN + 6, 17.8, { align: 'center' })

  // Brand text
  doc.setTextColor(255, 255, 255)
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(15)
  doc.text('НАШ МИР', MARGIN + 16, 16)
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(212, 175, 55)
  doc.text('Личный кабинет · ' + subtitle, MARGIN + 16, 22)

  // Date top-right
  doc.setTextColor(210, 220, 235)
  doc.setFontSize(8.5)
  doc.text(
    'Сформировано: ' + formatDate(new Date().toISOString()),
    PW - MARGIN,
    16,
    { align: 'right' },
  )
}

function drawFooter(doc: Doc) {
  const y = 285
  doc.setDrawColor(220, 226, 236)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, PW - MARGIN, y)
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTE)
  doc.text(
    '© 2026 НАШ МИР · Юридическое сопровождение банкротства',
    MARGIN,
    y + 5,
  )
  doc.text('Демонстрационный документ', PW - MARGIN, y + 5, {
    align: 'right',
  })
}

function title(doc: Doc, text: string, y: number) {
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(...NAVY)
  doc.text(text, MARGIN, y)
}

// Draws a label/value row, returns next y
function field(doc: Doc, label: string, value: string, y: number): number {
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTE)
  doc.text(label.toUpperCase(), MARGIN, y)
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  const lines = doc.splitTextToSize(value, PW - MARGIN * 2)
  doc.text(lines, MARGIN, y + 5.5)
  return y + 5.5 + lines.length * 5.5 + 4
}

function save(doc: Doc, filename: string) {
  doc.save(filename)
}

function safeName(s: string, max = 48): string {
  return s.replace(/[\\/:*?"<>|]/g, '').slice(0, max).trim()
}

/** Single document / act as a PDF. */
export async function downloadDocumentPdf(item: CaseDocument, client: Client) {
  const doc = await createDoc()
  drawHeader(doc, 'Документ дела')

  let y = 52
  // Type chip
  doc.setFillColor(240, 244, 250)
  const chip = DOC_TYPE_LABEL[item.type] ?? 'Документ'
  const chipW = doc.getTextWidth(chip) + 10
  doc.roundedRect(MARGIN, y - 5, chipW, 8, 4, 4, 'F')
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...NAVY)
  doc.text(chip, MARGIN + 5, y)

  y += 8
  title(doc, item.title, y)
  y += 12

  doc.setDrawColor(230, 235, 243)
  doc.line(MARGIN, y, PW - MARGIN, y)
  y += 10

  y = field(doc, 'Номер дела', client.caseNumber, y)
  y = field(doc, 'Должник', client.name, y)
  y = field(doc, 'Суд', client.court, y)
  y = field(doc, 'Дата документа', formatDate(item.date), y)
  y = field(doc, 'Размер', `${item.sizeKb} КБ`, y)
  y = field(
    doc,
    'Статус просмотра',
    item.viewedAt ? 'Просмотрен' : 'Не просмотрен',
    y,
  )

  // Note box
  y += 4
  doc.setFillColor(250, 246, 233)
  doc.roundedRect(MARGIN, y, PW - MARGIN * 2, 22, 3, 3, 'F')
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  const note = doc.splitTextToSize(
    'Настоящий файл сформирован автоматически в личном кабинете клиента и носит демонстрационный характер. Официальные документы предоставляются вашим куратором.',
    PW - MARGIN * 2 - 10,
  )
  doc.text(note, MARGIN + 5, y + 7)

  drawFooter(doc)
  save(doc, `${safeName(item.title)}.pdf`)
}

/** Payment statement (schedule + history) as a PDF. */
export async function downloadPaymentsPdf(client: Client, payments: Payment[]) {
  const doc = await createDoc()
  drawHeader(doc, 'Выписка по платежам')

  let y = 52
  title(doc, 'График и история платежей', y)
  y += 8
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTE)
  doc.text(
    `${client.name} · Дело ${client.caseNumber}`,
    MARGIN,
    y,
  )
  y += 10

  // Summary tiles
  const paid = payments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0)
  const summary: [string, string][] = [
    ['Сумма договора', formatCurrency(client.contractTotal)],
    ['Оплачено', formatCurrency(paid)],
    ['Остаток', formatCurrency(client.remainingPayment)],
  ]
  const tileW = (PW - MARGIN * 2 - 8) / 3
  summary.forEach(([label, value], i) => {
    const x = MARGIN + i * (tileW + 4)
    doc.setFillColor(245, 248, 252)
    doc.roundedRect(x, y, tileW, 20, 3, 3, 'F')
    doc.setFont('Roboto', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTE)
    doc.text(label.toUpperCase(), x + 5, y + 7)
    doc.setFont('Roboto', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...NAVY)
    doc.text(value, x + 5, y + 14.5)
  })
  y += 30

  // Progress
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text(`Прогресс погашения: ${client.paymentProgress}%`, MARGIN, y)
  y += 3
  const barW = PW - MARGIN * 2
  doc.setFillColor(226, 232, 240)
  doc.roundedRect(MARGIN, y, barW, 4, 2, 2, 'F')
  doc.setFillColor(...GOLD)
  doc.roundedRect(MARGIN, y, (barW * client.paymentProgress) / 100, 4, 2, 2, 'F')
  y += 14

  // Table header
  const cols = [MARGIN, MARGIN + 30, MARGIN + 105, PW - MARGIN]
  doc.setFillColor(...NAVY)
  doc.rect(MARGIN, y - 5, barW, 8, 'F')
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text('ДАТА', cols[0] + 2, y)
  doc.text('НАЗНАЧЕНИЕ', cols[1] + 2, y)
  doc.text('СУММА', cols[2] + 2, y)
  doc.text('СТАТУС', cols[3] - 2, y, { align: 'right' })
  y += 6

  const statusLabel: Record<string, string> = {
    paid: 'Оплачен',
    upcoming: 'Ожидается',
    overdue: 'Просрочен',
  }

  payments.forEach((p, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(247, 249, 252)
      doc.rect(MARGIN, y - 4.5, barW, 8.5, 'F')
    }
    doc.setFont('Roboto', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    doc.text(formatDate(p.date), cols[0] + 2, y)
    const desc = doc.splitTextToSize(p.description, 70)
    doc.text(desc[0], cols[1] + 2, y)
    doc.setFont('Roboto', 'bold')
    doc.text(formatCurrency(p.amount), cols[2] + 2, y)
    doc.setFont('Roboto', 'normal')
    const sc: [number, number, number] =
      p.status === 'paid' ? [22, 145, 90] : GOLD
    doc.setTextColor(...sc)
    doc.text(statusLabel[p.status] ?? p.status, cols[3] - 2, y, {
      align: 'right',
    })
    y += 8.5
  })

  drawFooter(doc)
  save(doc, `Выписка_по_платежам_${safeName(client.caseNumber)}.pdf`)
}

/** Full case summary as a PDF. */
export async function downloadCaseSummaryPdf(client: Client) {
  const doc = await createDoc()
  drawHeader(doc, 'Справка по делу')

  let y = 52
  title(doc, 'Справка о состоянии дела', y)
  y += 12
  doc.setDrawColor(230, 235, 243)
  doc.line(MARGIN, y, PW - MARGIN, y)
  y += 10

  const stage = CASE_STAGES.find((s) => s.key === client.caseStatus)
  y = field(doc, 'Текущий этап', stage?.label ?? '—', y)
  y = field(doc, 'Должник', client.name, y)
  y = field(doc, 'ИНН', client.inn, y)
  y = field(doc, 'Номер дела', client.caseNumber, y)
  y = field(doc, 'Суд', client.court, y)
  y = field(doc, 'Дата открытия', formatDate(client.openDate), y)
  y = field(doc, 'Следующее заседание', formatDate(client.nextHearing), y)
  y = field(doc, 'Общая задолженность', formatCurrency(client.totalDebt), y)
  y = field(doc, 'Остаток к оплате', formatCurrency(client.remainingPayment), y)

  drawFooter(doc)
  save(doc, `Справка_по_делу_${safeName(client.caseNumber)}.pdf`)
}
