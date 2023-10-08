const { Readable } = require('stream')

const dayjs = require('dayjs')
const { isArray, isEmpty, isBoolean, get } = require('lodash')
const { isNumber, isString } = require('lodash')
const pdfLib = require('pdf-lib')
const PDFMake = require('pdfmake')

const { i18n } = require('@open-condo/locales/loader')

const { COMPLETED } = require('@condo/domains/common/constants/export')
const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { MAX_TICKET_BLANKS_EXPORT } = require('@condo/domains/ticket/constants/export')

const { TicketExportTask, loadTicketsForPdfExport, loadTicketCommentsForPdfExport } = require('./index')


const PDFDocument = pdfLib.PDFDocument

const PDF_FILE_META = {
    mimetype: 'application/pdf',
    encoding: 'UTF-8',
}

// NOTE "padmake" can only use two properties per font: "normal" and "bold".
//      Therefore, two fonts are used to use different font weights.
const PDF_FONTS = {
    OpenSans: {
        normal: './public/fonts/open-sans/OpenSans-Regular.ttf',  // 400
        bold: './public/fonts/open-sans/OpenSans-Bold.ttf',  // 700
        italics: './public/fonts/open-sans/OpenSans-Italic.ttf',  // 400
        bolditalics: './public/fonts/open-sans/OpenSans-BoldItalic.ttf',  // 700
    },
    BoldOpenSans: {
        normal: './public/fonts/open-sans/OpenSans-SemiBold.ttf',  // 600
        bold: './public/fonts/open-sans/OpenSans-ExtraBold.ttf',
        italics: './public/fonts/open-sans/OpenSans-SemiBoldItalic.ttf',  // 600
        bolditalics: './public/fonts/open-sans/OpenSans-ExtraBoldBoldItalic.ttf',
    },
}

const PHONE_FORMAT_REGEXP = /(\d)(\d{3})(\d{3})(\d{2})(\d{2})/
const DEFAULT_DATE_FORMAT = 'DD.MM.YYYY'

const printer = new PDFMake(PDF_FONTS)

const getTranslateWithLocale = ({ locale }) => (key = '', meta = {}) => {
    return i18n(key, { locale, meta })
}

/**
 * Formats a phone, convert it from number string to string with dividers
 * for example: 01234567890 -> 0 123 456 78 90
 */
const formatPhone = (phone) =>
    phone ? phone.replace(PHONE_FORMAT_REGEXP, '$1 $2 $3 $4 $5') : phone

const formatDate = ({ date, timeZone, format }) => {
    return dayjs(date).tz(timeZone).format(format || DEFAULT_DATE_FORMAT)
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
    const cityPart = cityWithType ? cityWithType : null

    const areaWithType = get(addressMeta, 'area_with_type')
    const areaPart = areaWithType && areaWithType !== cityPart && areaWithType

    const regionLine = regionPart ? `${regionPart}` : ''
    const areaLine = areaPart ? `${regionLine ? ',' : ''} ${areaPart}` : ''
    const cityLine = cityPart ? `${regionLine ? ',' : ''} ${cityPart}` : ''
    const settlementLine = settlementPart ? `, ${settlementPart}` : ''
    const renderData = regionLine + areaLine + settlementLine + cityLine

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

const getAddressPartsByTicket = ({ ticket, locale }) => {
    const { renderData: renderAddress, streetPart } = getAddressDetails(ticket.propertyAddressMeta)
    const { renderData: renderUnit } = getUnitDetails({ ticket, locale })

    return {
        addressPart: renderAddress,
        streetAndUnitPart: `${streetPart}${renderUnit}`,
    }
}

const convertCommentsToTicketBlank = ({ comments, timeZone }) => {
    return comments.map(comment => ({
        ...comment,
        createdAt: formatDate({ date: comment.createdAt, timeZone, format: 'DD.MM.YYYY, HH:mm' }),
    }))
}

const convertTicketToTicketBlank = ({ ticket, comments, blankOptions, locale, timeZone }) => {
    return {
        number: ticket.number,
        printDate: formatDate({ timeZone }),
        createdAt: formatDate({ date: ticket.createdAt, timeZone }),
        organization: ticket.organization,
        address: getAddressPartsByTicket({ ticket, locale }),
        clientName: ticket.clientName || ticket.createdBy,
        clientPhone: formatPhone(ticket.clientPhone),
        details: ticket.details,
        comments: convertCommentsToTicketBlank({ comments, timeZone }),
        options: {
            haveComments: !isEmpty(comments),
            haveListCompletedWorks: blankOptions.haveListCompletedWorks,
            haveConsumedMaterials: blankOptions.haveConsumedMaterials,
            haveTotalCostWork: blankOptions.haveTotalCostWork,
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

const getComments = async ({ ticket, blankOptions }) => {
    if (!blankOptions.haveAllComments && isEmpty(blankOptions.commentIds)) {
        return []
    }

    const commentsWhere = {
        ticket: { id_in: [ticket.id] },
    }
    if (!isEmpty(blankOptions.commentIds)) {
        commentsWhere.id_in = blankOptions.commentIds
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

const COMMON_PDF_SIZES = {
    marginLeft: 45,
    marginRight: 31,
    printWidth: 344,
}

const generatePdf = (replaces) => {
    const { i18n, blank } = replaces

    const renderComments = (comments) => {
        if (!comments || comments.length < 1) return null

        return {
            marginBottom: 6,
            stack: [
                {
                    style: 'subtitle',
                    text: i18n.comments,
                },
                {
                    stack: blank.comments.map((comment) => ({
                        text: `${comment.createdAt} ${comment.content}`,
                        fontSize: 8,
                        marginBottom: 6,
                    })),
                },
            ],
        }
    }

    const addLines = (count, startPosition) => {
        if (!count || !isNumber(count)) return null

        return new Array(count).fill(1).map((_, index) => `<rect x="0" y="${startPosition + 14 + 15 * index}" width="${COMMON_PDF_SIZES.printWidth}" height="1" fill="#707695"/>`)
    }

    const renderBlockWithLines = (title, count) => {
        if (!title || !isString(title) || !count || !isNumber(count)) return null

        return {
            marginBottom: 12,
            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${COMMON_PDF_SIZES.printWidth}" height="${10 + count * 15}" viewBox="0 0 ${COMMON_PDF_SIZES.printWidth} ${10 + count * 15}">
                      <style>
                        .subtitile {
                          fill: #707695;
                          font-size: 7px;
                        }
                      </style>
                    <text x="0" y="7" class="subtitile">${title}</text>
                    ${addLines(count, 10).join('\n')}
                  </svg>`,
        }
    }

    const renderOptionBlockWithLine = (isShow, title, countLines) => {
        if (!isShow || !isBoolean(isShow) || !title || !isString(title) || !countLines || !isNumber(countLines)) return null

        return renderBlockWithLines(title, countLines)
    }

    const renderSignatures = () => {
        return {
            marginTop: 8,
            svg: `<svg viewBox="0 0 ${COMMON_PDF_SIZES.printWidth} 75" xmlns="http://www.w3.org/2000/svg">
                      <style>
                          .big {
                            width: ${COMMON_PDF_SIZES.printWidth}px;
                            font-size: 9px;
                          }
                          .small {
                            font-size: 7px;
                            font-weight: 500;
                          }
                      </style>
                      
                      <!-- NOTE This text does not wrap, only one line -->
                      <text x="0" y="10" class="big">${i18n.workCompleted}</text>
                    
                      <rect x="0" y="30" width="118" height="1" fill="#222222"/>
                      <text x="0" y="40" class="small">${i18n.executorFullName}</text>
                      
                      <rect x="131" y="30" width="118" height="1" fill="#222222"/>
                      <text x="131" y="40" class="small">${i18n.executorSignature}</text>
                      
                      <rect x="0" y="60" width="118" height="1" fill="#222222"/>
                      <text x="0" y="70" class="small">${i18n.clientFullName}</text>
                      
                      <rect x="131" y="60" width="118" height="1" fill="#222222"/>
                      <text x="131" y="70" class="small">${i18n.clientSignature}</text>
                      
                      <rect x="262" y="60" width="82" height="1" fill="#222222"/>
                      <text x="262" y="70" class="small">${i18n.completionDate}</text>
                  </svg>`,
        }
    }

    const renderDividingLine = (currentPage) => {
        if (currentPage % 2 === 0) {
            return null
        }

        return {
            absolutePosition: { x: 419, y: 0 },
            svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="594" viewBox="0 0 1 594" fill="none">\n' +
                '<path d="M0 -1H1V594H0V-1Z" fill="#E1E5ED"/>\n' +
                '</svg>',
        }
    }

    return printer.createPdfKitDocument({
        pageSize: 'a5',
        pageMargins: [COMMON_PDF_SIZES.marginLeft, 51, COMMON_PDF_SIZES.marginRight, 51],
        pageOrientation: 'portrait',
        defaultStyle: {
            font: 'OpenSans',
        },
        header: (currentPage) => [
            {
                fontSize: 7,
                margin: [COMMON_PDF_SIZES.marginLeft, 18, COMMON_PDF_SIZES.marginRight, 6.8],
                alignment: 'justify',
                columns: [
                    {
                        fit: [39, 12.2],
                        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="63" height="20" viewBox="0 0 63 20" fill="none">
                                  <path d="M34.8757 13.2672V16.9695H32.8536V15.0315H26.1944V16.9695H24.1724L24.1858 13.2672H24.5633C25.1295 13.2494 25.5294 12.8395 25.763 12.0375C25.9967 11.2356 26.1405 10.0906 26.1944 8.60254L26.3022 5.67543H33.5546V13.2672H34.8757ZM28.1221 8.80302C28.0771 9.91686 27.9828 10.8525 27.839 11.6098C27.6952 12.3583 27.475 12.9108 27.1785 13.2672H31.3978V7.43971H28.1625L28.1221 8.80302ZM39.4889 15.1384C38.725 15.1384 38.0375 14.9825 37.4264 14.6706C36.8243 14.3498 36.3525 13.9088 36.011 13.3474C35.6694 12.786 35.4987 12.1489 35.4987 11.4361C35.4987 10.7232 35.6694 10.0861 36.011 9.52478C36.3525 8.96341 36.8243 8.52682 37.4264 8.21493C38.0375 7.89415 38.725 7.73376 39.4889 7.73376C40.2527 7.73376 40.9358 7.89415 41.5379 8.21493C42.1399 8.52682 42.6118 8.96341 42.9533 9.52478C43.2948 10.0861 43.4655 10.7232 43.4655 11.4361C43.4655 12.1489 43.2948 12.786 42.9533 13.3474C42.6118 13.9088 42.1399 14.3498 41.5379 14.6706C40.9358 14.9825 40.2527 15.1384 39.4889 15.1384ZM39.4889 13.4276C40.0281 13.4276 40.4684 13.2494 40.8099 12.893C41.1604 12.5276 41.3356 12.042 41.3356 11.4361C41.3356 10.8302 41.1604 10.349 40.8099 9.99258C40.4684 9.62723 40.0281 9.44458 39.4889 9.44458C38.9496 9.44458 38.5048 9.62723 38.1543 9.99258C37.8038 10.349 37.6286 10.8302 37.6286 11.4361C37.6286 12.042 37.8038 12.5276 38.1543 12.893C38.5048 13.2494 38.9496 13.4276 39.4889 13.4276ZM51.989 15.0315V10.7277L49.8187 14.3365H48.929L46.8126 10.7143V15.0315H44.9119V7.84069H47.1092L49.4278 11.9974L51.8947 7.84069H53.8628L53.8897 15.0315H51.989ZM58.789 7.73376C59.912 7.73376 60.7747 8.00108 61.3773 8.53571C61.9792 9.06145 62.2804 9.85892 62.2804 10.9282V15.0315H60.3123V14.136C59.9167 14.8043 59.18 15.1384 58.1016 15.1384C57.5442 15.1384 57.0589 15.0448 56.6455 14.8577C56.2411 14.6706 55.9311 14.4122 55.7154 14.0825C55.4997 13.7528 55.3918 13.3786 55.3918 12.9598C55.3918 12.2915 55.6435 11.7658 56.1467 11.3826C56.659 10.9995 57.4454 10.8079 58.506 10.8079H60.1775C60.1775 10.3535 60.038 10.0059 59.7596 9.76536C59.4806 9.51589 59.0628 9.39112 58.506 9.39112C58.1191 9.39112 57.7374 9.45347 57.36 9.57824C56.9915 9.69406 56.677 9.85445 56.4163 10.0594L55.6615 8.60254C56.0569 8.32633 56.5287 8.11248 57.0769 7.96098C57.6341 7.80948 58.2047 7.73376 58.789 7.73376ZM58.6273 13.735C58.9866 13.735 59.3054 13.6548 59.5844 13.4944C59.8628 13.3251 60.0603 13.0801 60.1775 12.7593V12.0242H58.7351C57.8722 12.0242 57.4408 12.3049 57.4408 12.8662C57.4408 13.1335 57.5442 13.3474 57.7509 13.5078C57.9668 13.6593 58.2586 13.735 58.6273 13.735ZM59.5979 4.99377H61.8625L59.4226 6.91845H57.7779L59.5979 4.99377Z" fill="#222222"/>
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M7.98154 4.29605C7.52966 3.93142 6.88067 3.93325 6.4309 4.3004L0.444981 9.18659C0.163206 9.4166 0 9.75923 0 10.1208V18.2785C0 18.9472 0.547558 19.4894 1.223 19.4894H13.2696C13.945 19.4894 14.4926 18.9472 14.4926 18.2785V10.125C14.4926 9.76103 14.3272 9.41643 14.0423 9.18648L7.98154 4.29605ZM12.0466 17.0677V10.7002L7.2134 6.80028L2.44601 10.6918V17.0677H12.0466Z" fill="url(#paint0_linear_508_3035)"/>
                                  <path d="M15.317 5.11458C16.7414 5.11458 17.8962 3.96964 17.8962 2.55729C17.8962 1.14494 16.7414 0 15.317 0C13.8925 0 12.7378 1.14494 12.7378 2.55729C12.7378 3.96964 13.8925 5.11458 15.317 5.11458Z" fill="#FF9500"/>
                                  <defs>
                                  <linearGradient id="paint0_linear_508_3035" x1="0" y1="11.7566" x2="11.6239" y2="17.5312" gradientUnits="userSpaceOnUse">
                                  <stop stop-color="#2ABB56"/>
                                  <stop offset="1" stop-color="#3996DD"/>
                                  </linearGradient>
                                  </defs>
                              </svg>`,
                    },
                    {
                        text: i18n.printDate,
                        font: 'BoldOpenSans',
                        alignment: 'right',
                        fontSize: 7,
                    },
                ],
            },
            {
                margin: [COMMON_PDF_SIZES.marginLeft, 0, COMMON_PDF_SIZES.marginRight, 0],
                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${COMMON_PDF_SIZES.printWidth}" height="1" viewBox="0 0 ${COMMON_PDF_SIZES.printWidth} 1" fill="none">
                          <rect width="${COMMON_PDF_SIZES.printWidth}" height="1" fill="#E1E5ED"/>
                      </svg>`,
            },
            renderDividingLine(currentPage),
        ],
        footer: (currentPage) => {
            return [
                {
                    margin: [COMMON_PDF_SIZES.marginLeft, 13, COMMON_PDF_SIZES.marginRight, 0],
                    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${COMMON_PDF_SIZES.printWidth}" height="1" viewBox="0 0 ${COMMON_PDF_SIZES.printWidth} 1" fill="none">
                              <rect width="${COMMON_PDF_SIZES.printWidth}" height="1" fill="#E1E5ED"/>
                          </svg>`,
                },
                {
                    color: '#222222',
                    font: 'BoldOpenSans',
                    fontSize: 7,
                    margin: [COMMON_PDF_SIZES.marginLeft, 7, COMMON_PDF_SIZES.marginRight, 18],
                    alignment: 'justify',
                    columns: [
                        {
                            text: i18n.ticketWithNumberAndDated,
                        },
                        {
                            text: `${i18n.page} ${currentPage}`,
                            alignment: 'right',
                        },
                    ],
                },
            ]
        },
        content: [
            // ticket number & organization name
            {
                marginBottom: 12,
                columns: [
                    {
                        text: `${i18n.ticket} №${blank.number}`,
                        color: '#222222',
                        fontSize: 15,
                        bold: true,
                    },
                    {
                        text: blank.organization,
                        font: 'BoldOpenSans',
                        fontSize: 10,
                        alignment: 'right',
                        marginTop: 5,
                        color: '#707695',
                    },
                ],
            },

            // address
            {
                marginBottom: 12,
                stack: [
                    {
                        style: 'subtitle',
                        text: i18n.address,
                    },
                    {
                        style: 'accentedText',
                        stack: [
                            {
                                text: blank.address.addressPart,
                            },
                            {
                                text: blank.address.streetAndUnitPart,
                            },
                        ],
                    },
                ],
            },

            // client
            {
                marginBottom: 12,
                stack: [
                    {
                        style: 'subtitle',
                        text: i18n.clientName,
                    },
                    {
                        style: 'accentedText',
                        stack: [
                            {
                                text: blank.clientName,
                            },
                            {
                                marginTop: 5,
                                text: blank.clientPhone,
                            },
                        ],
                    },
                ],
            },

            // details
            {
                marginBottom: 12,
                stack: [
                    {
                        style: 'subtitle',
                        text: i18n.details,
                    },
                    {
                        text: blank.details,
                        style: 'accentedText',
                    },
                ],
            },

            // comments
            renderComments(blank.comments),

            // notes
            renderBlockWithLines(i18n.notes, 3),

            // listCompletedWorks
            renderOptionBlockWithLine(blank.options.haveListCompletedWorks, i18n.listCompletedWorks, 3),

            // consumedMaterials
            renderOptionBlockWithLine(blank.options.haveConsumedMaterials, i18n.consumedMaterials, 3),

            // totalCostWork
            renderOptionBlockWithLine(blank.options.haveTotalCostWork, i18n.totalCostWork, 1),

            // work done & signature
            renderSignatures(),
        ],
        styles: {
            subtitle: {
                color: '#707695',
                fontSize: 7,
                marginBottom: 4,
            },
            accentedText: {
                font: 'BoldOpenSans',
                fontSize: 9,
            },
        },
    }, {})
}

const pdfToBuffer = (pdfDoc) => new Promise((resolve, reject) => {
    try {
        const chunks = []
        pdfDoc.on('data', (chunk) => {
            chunks.push(chunk)
        })
        pdfDoc.on('end', () => {
            resolve(Buffer.concat(chunks))
        })
        pdfDoc.end()
    } catch (e) {
        reject(e)
    }
})

const createPdfForTicketBlanks = async ({ tickets, blankOptions, locale, timeZone }) => {
    const ticketPdfBuffers = []

    for (const ticket of tickets) {
        const comments = await getComments({ ticket, blankOptions })
        const ticketBlankData = convertTicketToTicketBlank({ ticket, comments, blankOptions, locale, timeZone })
        const translations = getTranslations({ locale, ticketBlankData })
        const replaces = {
            blank: ticketBlankData,
            i18n: translations,
        }
        const pdf = generatePdf(replaces)
        const buffer = await pdfToBuffer(pdf)
        ticketPdfBuffers.push(buffer)
    }

    const mergedPdf = await mergePdfBuffers(ticketPdfBuffers)

    const stream = Readable.from(mergedPdf)

    return { stream }
}

const getTicketBlankOptions = (options) => {
    const commentIds = get(options, 'commentIds')
    const haveAllComments = get(options, 'haveAllComments')
    const haveListCompletedWorks = get(options, 'haveListCompletedWorks')
    const haveConsumedMaterials = get(options, 'haveConsumedMaterials')
    const haveTotalCostWork = get(options, 'haveTotalCostWork')

    return {
        commentIds: isArray(commentIds) ? commentIds : [],
        haveAllComments: isBoolean(haveAllComments) ? haveAllComments : false,
        haveListCompletedWorks: isBoolean(haveListCompletedWorks) ? haveListCompletedWorks : false,
        haveConsumedMaterials: isBoolean(haveConsumedMaterials) ? haveConsumedMaterials : false,
        haveTotalCostWork: isBoolean(haveTotalCostWork) ? haveTotalCostWork : false,
    }
}

const exportTicketBlanksToPdf = async ({ context, task, baseAttrs, where, sortBy }) => {
    const { id: taskId, options, locale, timeZone: timeZoneFromUser } = task

    const timeZone = normalizeTimeZone(timeZoneFromUser) || DEFAULT_ORGANIZATION_TIMEZONE

    const blankOptions = getTicketBlankOptions(options)

    const tickets = await loadTicketsForPdfExport({ where, sortBy, limit: MAX_TICKET_BLANKS_EXPORT })

    const { stream } = await createPdfForTicketBlanks({ tickets, blankOptions, locale, timeZone })

    const fileInput = {
        stream,
        filename: `ticket_blanks_${formatDate({ timeZone, format: 'DD_MM_YYYY__HH_mm_ss' })}.pdf`,
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
