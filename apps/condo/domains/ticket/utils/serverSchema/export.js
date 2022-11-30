const dayjs = require('dayjs')
const { EXCEL_FILE_META } = require('../../../common/utils/createExportFile')
const { TicketExportTask } = require('./index')
const { COMPLETED } = require('../../../common/constants/export')
const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')

async function renderTicketInPdf (ticket) {

}


async function mergePdfs (fileNames) {
    return
}

async function createPdfForTickets (tickets, statuses) {
    //
    const ticketPdfFileNames = []
    for (let ticket in tickets) {
        // render to PDF

        const pdfFileName = renderTicketInPdf(ticket)
        ticketPdfFileNames.push(pdfFileName)
    }

    // Merge PDF files
    const resultPdfFileStream = mergePdfs(ticketPdfFileNames)

    return resultPdfFileStream
}

async function exportTicketsToPdf ({ context, task, tickets, statuses }) {
    // 1. Get all Ticket records using TicketExportTask.where
    // 2. Get other records…
    // 3. Get PDF rendering params from TicketExportTask.meta


    // 4. Render PDF
    const stream = createPdfForTickets(tickets, statuses)
    const fileInput = {
        stream,
        filename: `tickets_${dayjs().format('DD_MM')}.pdf`,
        mimetype: EXCEL_FILE_META.mimetype,
        encoding: EXCEL_FILE_META.encoding,
        meta: {
            listkey: 'TicketExportTask',
            // Id of first record will be used by `OBSFilesMiddleware` to determine permission to access exported file
            // NOTE: Permissions check on access to exported file will be replaced to checking access on `ExportTicketsTask`
            id: task.id,
        },
    }
    const fileUploadInput = buildUploadInputFrom(fileInput)

    await TicketExportTask.update(context, task.id, {
        status: COMPLETED,
        file: fileUploadInput,
    })
}

module.exports = {
    exportTicketsToPdf,
}