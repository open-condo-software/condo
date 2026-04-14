/**
 * Script to create the Excel template for the debt claims (dosudebki) debtors list.
 * Run with: node apps/condo/bin/createDebtClaimsTemplate.js
 */
const fs = require('fs')
const path = require('path')

const XLSX = require('xlsx')

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'billing', 'debtClaims')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'debtors-template.xlsx')

const HEADERS = [
    'Лицевой счёт',
    'Адрес',
    'ФИО должника',
    'Сумма долга (руб.)',
    'Период/дата задолженности',
]

const EXAMPLE_ROW = [
    '123456789',
    'г. Москва, ул. Примерная, д. 1, кв. 10',
    'Иванов Иван Иванович',
    '5000',
    'январь – декабрь 2024',
]

function createTemplate () {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE_ROW])

    ws['!cols'] = HEADERS.map((h) => ({ wch: Math.max(h.length + 5, 20) }))

    XLSX.utils.book_append_sheet(wb, ws, 'Должники')
    XLSX.writeFile(wb, OUTPUT_FILE)

    console.log(`Template created: ${OUTPUT_FILE}`)
}

createTemplate()
