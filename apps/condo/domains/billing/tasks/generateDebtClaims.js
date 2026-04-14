const { Readable } = require('stream')

const axios = require('axios')
const dayjs = require('dayjs')
const JSZip = require('jszip')
const Upload = require('graphql-upload/Upload.js')
const XLSX = require('xlsx')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')
const { DebtClaimGenerationTask } = require('@condo/domains/billing/utils/serverSchema')

const taskLogger = getLogger()

const BASE_ATTRS = {
    dv: 1,
    sender: { dv: 1, fingerprint: TASK_WORKER_FINGERPRINT },
}

const TASK_STATUS = {
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    ERROR: 'error',
}

const DEBTOR_COLUMNS = {
    accountNumber: 0,
    address: 1,
    debtorName: 2,
    debtAmount: 3,
    debtPeriod: 4,
}

function escapeXml (str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function makeOoxmlParagraph (text, opts = {}) {
    const { bold = false, center = false, size = 24, spacing = 0 } = opts
    const pPr = [
        center ? '<w:jc w:val="center"/>' : '',
        spacing ? `<w:spacing w:after="${spacing}"/>` : '',
    ].filter(Boolean).join('')
    const rPr = [
        bold ? '<w:b/>' : '',
        `<w:sz w:val="${size}"/>`,
        '<w:szCs w:val="24"/>',
    ].filter(Boolean).join('')

    if (!text) {
        return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}</w:p>`
    }
    return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
}

function buildDocumentXml (paragraphs) {
    const ns = [
        'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"',
        'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"',
        'xmlns:o="urn:schemas-microsoft-com:office:office"',
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
        'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"',
        'xmlns:v="urn:schemas-microsoft-com:vml"',
        'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"',
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
        'xmlns:w10="urn:schemas-microsoft-com:office:word"',
        'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
        'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"',
        'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"',
        'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"',
        'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"',
        'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"',
    ].join(' ')

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${ns} mc:Ignorable="w14 wp14">
  <w:body>
    ${paragraphs.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`
}

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const DOCUMENT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
          xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
          xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="w14">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="0" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
</w:styles>`

const SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:compat>
    <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
  </w:compat>
</w:settings>`

async function buildDebtClaimDocx (debtor, orgInfo) {
    const {
        debtorName,
        address,
        accountNumber,
        debtAmount,
        debtPeriod,
    } = debtor
    const {
        organizationName,
        organizationAddress,
        organizationContacts,
    } = orgInfo

    const today = dayjs()
    const deadlineDate = today.add(30, 'day')
    const todayStr = today.format('DD.MM.YYYY')
    const deadlineStr = deadlineDate.format('DD.MM.YYYY')

    const paragraphs = [
        makeOoxmlParagraph(`Кому: ${debtorName}`, { bold: false }),
        makeOoxmlParagraph(address),
        makeOoxmlParagraph(''),
        makeOoxmlParagraph(`От кого: Управляющая компания «${organizationName}»`),
        organizationAddress ? makeOoxmlParagraph(organizationAddress) : '',
        organizationContacts ? makeOoxmlParagraph(organizationContacts) : '',
        makeOoxmlParagraph(''),
        makeOoxmlParagraph('ПРЕТЕНЗИЯ', { bold: true, center: true }),
        makeOoxmlParagraph('о погашении задолженности за жилищно-коммунальные услуги', { center: true }),
        makeOoxmlParagraph(''),
        makeOoxmlParagraph(`Уважаемый(ая) ${debtorName}!`),
        makeOoxmlParagraph(''),
        makeOoxmlParagraph(
            `По состоянию на ${todayStr} за Вами числится задолженность по оплате жилищно-коммунальных услуг по адресу: ${address} в размере ${debtAmount} руб.`
        ),
        makeOoxmlParagraph(''),
        makeOoxmlParagraph(
            `Задолженность образовалась за период: ${debtPeriod} в связи с ненадлежащим исполнением обязательств по оплате услуг, предусмотренных действующим законодательством и договором управления многоквартирным домом.`
        ),
        makeOoxmlParagraph(''),
        makeOoxmlParagraph(
            'В соответствии с требованиями жилищного законодательства (ЖК РФ) Вы обязаны своевременно и в полном объёме вносить плату за жилое помещение и коммунальные услуги.'
        ),
        makeOoxmlParagraph(''),
        makeOoxmlParagraph(
            `Просим Вас в срок до ${deadlineStr} погасить задолженность в полном объёме.`,
            { bold: true }
        ),
        makeOoxmlParagraph(''),
        makeOoxmlParagraph(
            'В случае невыполнения требований в установленный срок управляющая компания будет вынуждена обратиться в суд для взыскания задолженности, а также начисленных пеней и судебных расходов.'
        ),
        makeOoxmlParagraph(''),
        makeOoxmlParagraph(
            'Дополнительно сообщаем, что возможно ограничение или приостановление предоставления коммунальных услуг в установленном законом порядке.'
        ),
        makeOoxmlParagraph(''),
        makeOoxmlParagraph('Приложение: расчёт задолженности'),
        makeOoxmlParagraph(''),
        makeOoxmlParagraph(`Дата: ${todayStr}`),
        makeOoxmlParagraph('Подпись: ____________________________'),
        makeOoxmlParagraph(`Лицевой счёт: ${accountNumber}`),
    ].filter(Boolean)

    const zip = new JSZip()
    zip.file('[Content_Types].xml', CONTENT_TYPES_XML)
    zip.file('_rels/.rels', RELS_XML)
    zip.file('word/document.xml', buildDocumentXml(paragraphs))
    zip.file('word/_rels/document.xml.rels', DOCUMENT_RELS_XML)
    zip.file('word/styles.xml', STYLES_XML)
    zip.file('word/settings.xml', SETTINGS_XML)

    return await zip.generateAsync({ type: 'nodebuffer' })
}

function buildUploadInput ({ buffer, filename, mimetype, encoding, listkey, id }) {
    const uploadData = {
        createReadStream: () => Readable.from(buffer),
        filename,
        mimetype,
        encoding,
        meta: { listkey, id },
    }
    const upload = new Upload()
    upload.promise = Promise.resolve(uploadData)
    return upload
}

function parseDebtors (worksheetData) {
    const rows = []
    const errors = []

    for (let i = 1; i < worksheetData.length; i++) {
        const row = worksheetData[i]
        if (!row || row.every(cell => !cell)) continue

        const accountNumber = row[DEBTOR_COLUMNS.accountNumber]
        const address = row[DEBTOR_COLUMNS.address]
        const debtorName = row[DEBTOR_COLUMNS.debtorName]
        const debtAmount = row[DEBTOR_COLUMNS.debtAmount]
        const debtPeriod = row[DEBTOR_COLUMNS.debtPeriod]

        const rowErrors = []
        if (!accountNumber) rowErrors.push('отсутствует лицевой счёт')
        if (!address) rowErrors.push('отсутствует адрес')
        if (!debtorName) rowErrors.push('отсутствует ФИО должника')
        if (!debtAmount) rowErrors.push('отсутствует сумма долга')
        if (!debtPeriod) rowErrors.push('отсутствует период задолженности')

        const entry = {
            rowIndex: i + 1,
            accountNumber: String(accountNumber || '').trim(),
            address: String(address || '').trim(),
            debtorName: String(debtorName || '').trim(),
            debtAmount: String(debtAmount || '').trim(),
            debtPeriod: String(debtPeriod || '').trim(),
            originalRow: row,
        }

        if (rowErrors.length > 0) {
            errors.push({ ...entry, errors: rowErrors })
        } else {
            rows.push(entry)
        }
    }

    return { rows, errors }
}

const generateDebtClaimsTask = async (taskId) => {
    let task, context
    try {
        taskLogger.info({ msg: 'start generateDebtClaims', entityId: taskId, entity: 'DebtClaimGenerationTask' })

        const { keystone: _context } = getSchemaCtx('DebtClaimGenerationTask')
        context = _context

        task = await DebtClaimGenerationTask.getOne(context, { id: taskId, deletedAt: null },
            'id organization { id name address phone } user { id } debtorsFile { publicUrl originalFilename } meta'
        )
        if (!task) throw new Error('task not found')

        const debtorsFileUrl = task?.debtorsFile?.publicUrl
        if (!debtorsFileUrl) throw new Error('debtorsFile is missing in task')

        await DebtClaimGenerationTask.update(context, taskId, { ...BASE_ATTRS, progress: 5 })

        const fileResponse = await axios.get(debtorsFileUrl, { responseType: 'arraybuffer' })
        const workbook = XLSX.read(fileResponse.data, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })

        if (!rawData || rawData.length < 2) {
            throw new Error('Excel file is empty or has no data rows')
        }

        const { rows: validRows, errors: errorRows } = parseDebtors(rawData)

        const orgInfo = {
            organizationName: task?.organization?.name || '',
            organizationAddress: task?.organization?.address || '',
            organizationContacts: task?.organization?.phone || '',
        }

        const totalRows = validRows.length + errorRows.length
        const resultZip = new JSZip()
        let totalAmount = 0
        let successCount = 0

        for (let i = 0; i < validRows.length; i++) {
            const debtor = validRows[i]
            try {
                const docxBuffer = await buildDebtClaimDocx(debtor, orgInfo)
                const safeFilename = `${debtor.accountNumber || i + 1}_${debtor.debtorName.replace(/[^а-яёА-ЯЁa-zA-Z0-9]/g, '_')}.docx`
                resultZip.file(safeFilename, docxBuffer)

                const amount = parseFloat(String(debtor.debtAmount).replace(/[^0-9.,]/g, '').replace(',', '.'))
                if (!isNaN(amount)) totalAmount += amount

                successCount++
            } catch (docErr) {
                errorRows.push({ ...debtor, errors: [`ошибка генерации: ${docErr.message}`] })
            }

            const progress = 5 + Math.round(((i + 1) / Math.max(validRows.length, 1)) * 85)
            if (i % 10 === 0) {
                await DebtClaimGenerationTask.update(context, taskId, { ...BASE_ATTRS, progress })
            }
        }

        const resultZipBuffer = await resultZip.generateAsync({ type: 'nodebuffer' })
        const zipFilename = `debt_claims_${dayjs().format('YYYY-MM-DD_HH-mm')}.zip`

        const resultFileInput = buildUploadInput({
            buffer: resultZipBuffer,
            filename: zipFilename,
            mimetype: 'application/zip',
            encoding: 'binary',
            listkey: 'DebtClaimGenerationTask',
            id: taskId,
        })

        let errorFileInput = null
        if (errorRows.length > 0) {
            const errorSheetData = [
                ['Лицевой счёт', 'Адрес', 'ФИО должника', 'Сумма долга', 'Период задолженности', 'Ошибки'],
                ...errorRows.map(r => [
                    r.accountNumber,
                    r.address,
                    r.debtorName,
                    r.debtAmount,
                    r.debtPeriod,
                    Array.isArray(r.errors) ? r.errors.join('; ') : '',
                ]),
            ]
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.aoa_to_sheet(errorSheetData)
            XLSX.utils.book_append_sheet(wb, ws, 'Ошибки')
            const errorXlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

            errorFileInput = buildUploadInput({
                buffer: errorXlsxBuffer,
                filename: `debt_claims_errors_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`,
                mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                encoding: 'UTF-8',
                listkey: 'DebtClaimGenerationTask',
                id: taskId,
            })
        }

        await DebtClaimGenerationTask.update(context, taskId, {
            ...BASE_ATTRS,
            status: TASK_STATUS.COMPLETED,
            progress: 100,
            resultFile: resultFileInput,
            ...(errorFileInput ? { errorFile: errorFileInput } : {}),
            meta: {
                successCount,
                failedCount: errorRows.length,
                totalAmount: Math.round(totalAmount),
                totalRows,
            },
        })

        taskLogger.info({
            msg: 'generateDebtClaims completed',
            entityId: taskId,
            entity: 'DebtClaimGenerationTask',
            data: { successCount, failedCount: errorRows.length, totalAmount },
        })
    } catch (err) {
        taskLogger.error({
            msg: 'generateDebtClaims failed',
            entityId: taskId,
            entity: 'DebtClaimGenerationTask',
            err,
        })

        if (task && context) {
            await DebtClaimGenerationTask.update(context, taskId, {
                ...BASE_ATTRS,
                status: TASK_STATUS.ERROR,
                meta: { ...(task.meta || {}), error: err.message },
            })
        }

        throw err
    }
}

module.exports = {
    generateDebtClaims: createTask('generateDebtClaims', generateDebtClaimsTask, 'low'),
}
