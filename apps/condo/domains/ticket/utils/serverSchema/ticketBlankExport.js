const { Readable } = require('stream')
const { isArray, isEmpty, isBoolean, get } = require('lodash')
const dayjs = require('dayjs')
const PDFDocument = require('pdf-lib').PDFDocument

const { i18n } = require('@open-condo/locales/loader')

const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')
const { COMPLETED } = require('@condo/domains/common/constants/export')
const { render } = require('@condo/domains/common/utils/createExportFile')

const { TicketExportTask, loadTicketsForPdfExport, loadTicketCommentsForPdfExport } = require('./index')


const MAX_TICKET_BLANKS = 50
const PDF_FILE_META = {
    mimetype: 'application/pdf',
    encoding: 'UTF-8',
}
const PDF_RENDER_OPTIONS = {
    convertTo: 'pdf',
}
const PATH_TO_TEMPLATE = './domains/ticket/templates/TicketBlankExportTemplate.docx'


const getTranslateWithLocale = ({ locale }) => (key = '', meta = {}) => {
    return i18n(key, { locale, meta })
}

const getAddressDetails = (propertyAddressMeta) => {
    const addressMeta = get(propertyAddressMeta, 'data')

    const streetWithType = get(addressMeta, 'street_with_type')

    const houseType = get(addressMeta, 'house_type')
    const houseName = get(addressMeta, 'house')

    const blockType = get(addressMeta, 'block_type')
    const blockName = get(addressMeta, 'block')

    const regionType = get(addressMeta, 'region_type')
    const regionName = get(addressMeta, 'region')
    const regionWithType = get(addressMeta, 'region_with_type')
    const regionNamePosition = regionWithType && regionWithType.split(' ')[0] === regionName ? 0 : 1
    const regionWithFullType = regionNamePosition === 0 ? `${regionName} ${regionType}` : `${regionType} ${regionName}`

    const cityWithType = get(addressMeta, 'city_with_type')
    const cityName = get(addressMeta, 'city')

    const settlementPart = get(addressMeta, 'settlement_with_type')

    const block = blockType ? ` ${blockType} ${blockName}` : ''
    const settlement = streetWithType ? streetWithType : settlementPart
    const streetPart = settlement && `${settlement}, ${houseType} ${houseName}${block}`
    const regionPart = regionName && regionName !== cityName && regionWithFullType
    const cityPart = cityWithType && cityWithType

    const areaWithType = get(addressMeta, 'area_with_type')
    const areaPart = areaWithType && areaWithType !== cityPart && areaWithType

    const regionLine = regionPart ? `${regionPart}` : ''
    const areaLine = areaPart ? `${regionLine ? ',' : ''} ${areaPart}` : ''
    const cityLine = cityPart ? `${regionLine ? ',' : ''} ${cityPart}` : ''
    const settlementLine = settlementPart ? `, ${settlementPart}` : ''
    const renderData = regionLine + areaLine + settlementLine + cityLine + streetPart

    return { streetPart, areaPart, settlementPart, regionPart, cityPart, renderData }
}

const getUnitDetails = ({ ticket, locale }) => {
    const getTranslate = getTranslateWithLocale({ locale })

    const unitName = ticket.unitName
    const unitType = ticket.unitType ?? 'flat'

    const sectionType = ticket.sectionType ?? 'section'
    const sectionName = ticket.sectionName

    const floorName = ticket.floorName

    const unitPart = unitName ? `${getTranslate(`ticketBlankExport.address.unitType.${unitType}`)} ${unitName}` : ''
    const sectionPart = sectionName ? `${getTranslate(`ticketBlankExport.address.sectionType.${sectionType}`)} ${sectionName}` : ''
    const floorPart = floorName ? `${getTranslate('ticketBlankExport.address.floor')} ${floorName}` : ''

    let sectionAndFloor = `${sectionPart}, ${floorPart}`
    if (!isEmpty(unitPart) && !isEmpty(sectionPart) && !isEmpty(floorPart)) {
        sectionAndFloor = `(${sectionAndFloor})`
    } else if (isEmpty(unitPart) && !isEmpty(sectionPart)) {
        if (isEmpty(floorPart)) {
            sectionAndFloor = sectionPart
        }
    } else {
        sectionAndFloor = ''
    }

    let renderData = ''
    if (unitPart) {
        renderData += ` ${unitPart}`
    }
    if (sectionAndFloor) {
        renderData += ` ${sectionAndFloor}`
    }

    return { renderData, unitPart, sectionPart, floorPart }
}

const getFullAddressByTicket = ({ ticket, locale }) => {
    const {
        streetPart,
        areaPart,
        settlementPart,
        regionPart,
        cityPart,
        renderData: renderAddress,
    } = getAddressDetails(ticket.propertyAddressMeta)

    const { renderData: renderUnit, unitPart, sectionPart, floorPart } = getUnitDetails({ ticket, locale })

    let fullAddress = renderAddress
    if (renderUnit) {
        fullAddress += renderUnit
    }

    console.debug('getFullAddressByPropertyMeta', { ticket, streetPart, areaPart, settlementPart, regionPart, cityPart, renderAddress, unitPart, sectionPart, floorPart, renderUnit, fullAddress })
    return fullAddress
}

const convertCommentsToTicketBlank = (comments) => {
    return comments.map(comment => ({
        ...comment,
        createdAt: dayjs(comment.createdAt).format('DD.MM.YYYY, HH:mm'),
    }))
}

const convertTicketToTicketBlank = ({ ticket, comments, blankParameters, locale }) => {
    return {
        number: ticket.number,
        printDate: dayjs().format('DD.MM.YYYY'),
        createdAt: dayjs(ticket.createdAt).format('DD.MM.YYYY'),
        organization: ticket.organization,
        address: getFullAddressByTicket({ ticket, locale }),
        clientName: ticket.clientName || ticket.createdBy,
        clientPhone: ticket.clientPhone,
        details: ticket.details,
        comments: convertCommentsToTicketBlank(comments),
        parameters: {
            haveComments: !isEmpty(comments),
            haveListCompletedWorks: blankParameters.haveListCompletedWorks,
            haveConsumedMaterials: blankParameters.haveConsumedMaterials,
            haveTotalCostWork: blankParameters.haveTotalCostWork,
            locale: locale,
        },
    }
}

const mergePdfBuffers = async (ticketPdfBuffers) => {
    if (!isArray(ticketPdfBuffers) || isEmpty(ticketPdfBuffers)) throw new Error('At least 1 pdf file is required for merging!')

    if (ticketPdfBuffers.length === 1) return ticketPdfBuffers[0]

    const mergedPdf = await PDFDocument.create()
    for (const buffer of ticketPdfBuffers) {
        const pdf = await PDFDocument.load(buffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page)
        })
    }
    const buffer = await mergedPdf.save()
    return [buffer]
}

const getComments = async ({ ticket, blankParameters }) => {
    if (!blankParameters.haveAllComments && isEmpty(blankParameters.commentIds)) {
        return []
    }

    const commentsWhere = {
        ticket: { id_in: [ticket.id] },
    }
    if (!isEmpty(blankParameters.commentIds)) {
        commentsWhere.id_in = blankParameters.commentIds
    }

    return await loadTicketCommentsForPdfExport({ where: commentsWhere })
}

const getTranslations = ({ locale, ticketBlankData }) => {
    const getTranslate = getTranslateWithLocale({ locale })

    return {
        printDate: getTranslate('ticketBlankExport.label.printDate', { printDate: ticketBlankData.printDate }),
        ticketWithNumberAndDated: getTranslate('ticketBlankExport.label.ticketWithNumberAndDated', {
            number: ticketBlankData.number,
            createdAt: ticketBlankData.createdAt,
        }),
        page: getTranslate('ticketBlankExport.label.page'),
        ticket: getTranslate('ticketBlankExport.label.ticket'),
        address: getTranslate('ticketBlankExport.heading.address'),
        clientName: getTranslate('ticketBlankExport.heading.clientName'),
        details: getTranslate('ticketBlankExport.heading.details'),
        comments: getTranslate('ticketBlankExport.heading.comments'),
        notes: getTranslate('ticketBlankExport.heading.notes'),
        listCompletedWorks: getTranslate('ticketBlankExport.heading.listCompletedWorks'),
        consumedMaterials: getTranslate('ticketBlankExport.heading.consumedMaterials'),
        totalCostWork: getTranslate('ticketBlankExport.heading.totalCostWork'),
        workCompleted: getTranslate('ticketBlankExport.message.workCompleted'),
        executorFullName: getTranslate('ticketBlankExport.field.executorFullName'),
        clientFullName: getTranslate('ticketBlankExport.field.clientFullName'),
        executorSignature: getTranslate('ticketBlankExport.field.executorSignature'),
        clientSignature: getTranslate('ticketBlankExport.field.clientSignature'),
        completionDate: getTranslate('ticketBlankExport.field.completionDate'),
    }
}

const createPdfForTicketBlanks = async ({ tickets, blankParameters, locale }) => {
    const ticketPdfBuffers = []

    for (const ticket of tickets) {
        const comments = await getComments({ ticket, blankParameters })
        const ticketBlankData = convertTicketToTicketBlank({ ticket, comments, blankParameters, locale })
        const translations = getTranslations({ locale, ticketBlankData })
        const replaces = {
            blank: ticketBlankData,
            i18n: translations,
        }
        const buffer = await render(PATH_TO_TEMPLATE, replaces, PDF_RENDER_OPTIONS)
        ticketPdfBuffers.push(buffer)
    }

    const mergedPdf = await mergePdfBuffers(ticketPdfBuffers)

    const stream = Readable.from(mergedPdf)

    return { stream }
}

const getTicketBlankParameters = (parameters) => {
    const commentIds = get(parameters, 'commentIds')
    const haveAllComments = get(parameters, 'haveAllComments')
    const haveListCompletedWorks = get(parameters, 'haveListCompletedWorks')
    const haveConsumedMaterials = get(parameters, 'haveConsumedMaterials')
    const haveTotalCostWork = get(parameters, 'haveTotalCostWork')

    return {
        commentIds: isArray(commentIds) ? commentIds : [],
        haveAllComments: isBoolean(haveAllComments) ? haveAllComments : false,
        haveListCompletedWorks: isBoolean(haveListCompletedWorks) ? haveListCompletedWorks : false,
        haveConsumedMaterials: isBoolean(haveConsumedMaterials) ? haveConsumedMaterials : false,
        haveTotalCostWork: isBoolean(haveTotalCostWork) ? haveTotalCostWork : false,
    }
}

const exportTicketBlanksToPdf = async ({ context, task, baseAttrs, where, sortBy }) => {
    const { id: taskId, parameters, locale } = task

    const blankParameters = getTicketBlankParameters(parameters)

    const tickets = await loadTicketsForPdfExport({ where, sortBy, limit: MAX_TICKET_BLANKS })

    const { stream } = await createPdfForTicketBlanks({ tickets, blankParameters, locale })
    const fileInput = {
        stream,
        filename: `ticket_blanks_${dayjs().format('DD_MM_YYYY__HH_mm_ss')}.pdf`,
        mimetype: PDF_FILE_META.mimetype,
        encoding: PDF_FILE_META.encoding,
        meta: {
            listkey: 'TicketExportTask',
            // Id of first record will be used by `OBSFilesMiddleware` to determine permission to access exported file
            // NOTE: Permissions check on access to exported file will be replaced to checking access on `ExportTicketsTask`
            id: taskId,
        },
    }

    const fileUploadInput = buildUploadInputFrom(fileInput)

    await TicketExportTask.update(context, taskId, {
        ...baseAttrs,
        status: COMPLETED,
        file: fileUploadInput,
    })
}

module.exports = {
    exportTicketBlanksToPdf,
}
