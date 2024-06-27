const dayjs = require('dayjs')
const { get, isEmpty } = require('lodash')

const { getById, getByCondition } = require('@open-condo/keystone/schema')

const { buildExportFile: buildExportExcelFile, DOCX_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { DEFAULT_INVOICE_CURRENCY_CODE } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { getAddressDetails } = require('@condo/domains/property/utils/serverSchema/helpers')
const { TICKET_DOCUMENT_GENERATION_TASK_FORMAT } = require('@condo/domains/ticket/constants/ticketDocument')


const DATE_FORMAT = 'DD.MM.YYYY'
const formatDate = (date, timeZone, format = DATE_FORMAT) => {
    return dayjs(date).tz(timeZone).format(format)
}

const buildExportWordFile = async ({ task, documentData, locale, timeZone }) => {
    const { id, ticket } = task

    const { stream } = await buildExportExcelFile({
        templatePath: `./domains/ticket/templates/TicketDocumentGenerationTemplates/completionWorks/${locale}.docx`,
        replaces: documentData,
    })

    return {
        stream,
        filename: `completion_works_ticket_${ticket.id}_${formatDate(undefined, timeZone, 'DD_MM_YYYY')}.docx`,
        mimetype: DOCX_FILE_META.mimetype,
        encoding: DOCX_FILE_META.encoding,
        meta: {
            listkey: 'TicketDocumentGenerationTask',
            id,
        },
    }
}

const renderMoney = (amount, currencyCode, locale) => {
    const options = { style: 'currency', currency: currencyCode }
    const numberFormat = new Intl.NumberFormat(locale, options)
    const parts = numberFormat.formatToParts(amount)
    return parts.map((part) => part.value)
        .slice(0, -2) // remove currency symbol
        .join('')
}

const fakeInvoices = [{ 'organization':{ 'id':'1c63bd5e-f57f-42e5-98e2-39059c711310', '__typename':'Organization' }, 'number':8, 'property':{ 'id':'a38bd2ed-bdcf-4260-9c44-79d92d7b8eed', 'address':'Волгоградская обл, Клетский р-н, хутор Новоцарицынский, ул Молодежная, д 7', 'addressKey':'9f64350e-981d-4e19-b9d7-d41506bf23c7', 'addressMeta':{ 'dv':1, 'value':'Волгоградская обл, Клетский р-н, хутор Новоцарицынский, ул Молодежная, д 7', 'unrestricted_value':'403553, Волгоградская обл, Клетский р-н, хутор Новоцарицынский, ул Молодежная, д 7', 'data':{ 'postal_code':'403553', 'country':'Россия', 'country_iso_code':'RU', 'federal_district':'Южный', 'region_fias_id':'da051ec8-da2e-4a66-b542-473b8d221ab4', 'region_kladr_id':'3400000000000', 'region_iso_code':'RU-VGG', 'region_with_type':'Волгоградская обл', 'region_type':'обл', 'region_type_full':'область', 'region':'Волгоградская', 'area_fias_id':'923aaae2-1bb7-4956-b749-9b3e953331e6', 'area_kladr_id':'3401300000000', 'area_with_type':'Клетский р-н', 'area_type':'р-н', 'area_type_full':'район', 'area':'Клетский', 'city_fias_id':null, 'city_kladr_id':null, 'city_with_type':null, 'city_type':null, 'city_type_full':null, 'city':null, 'city_area':null, 'city_district_fias_id':null, 'city_district_kladr_id':null, 'city_district_with_type':null, 'city_district_type':null, 'city_district_type_full':null, 'city_district':null, 'settlement_fias_id':'0fac75b8-a174-4d96-abe8-b5072b49a374', 'settlement_kladr_id':'3401300003200', 'settlement_with_type':'хутор Новоцарицынский', 'settlement_type':'х', 'settlement_type_full':'хутор', 'settlement':'Новоцарицынский', 'street_fias_id':'ad7ee0c0-620b-44d8-8781-425d89ea0dd1', 'street_kladr_id':'34013000032000800', 'street_with_type':'ул Молодежная', 'street_type':'ул', 'street_type_full':'улица', 'street':'Молодежная', 'house_fias_id':'2cc2c5c4-04ca-42d2-ac03-752504055285', 'house_kladr_id':'3401300003200080007', 'house_type':'д', 'house_type_full':'дом', 'house':'7', 'block_type':null, 'block_type_full':null, 'block':null, 'entrance':null, 'floor':null, 'flat_fias_id':null, 'flat_type':null, 'flat_type_full':null, 'flat':null, 'flat_area':null, 'square_meter_price':null, 'flat_price':null, 'postal_box':null, 'fias_id':'2cc2c5c4-04ca-42d2-ac03-752504055285', 'fias_code':null, 'fias_level':'8', 'fias_actuality_state':'0', 'kladr_id':'3401300003200080007', 'geoname_id':null, 'capital_marker':'0', 'okato':'18222808005', 'oktmo':'18622408121', 'tax_office':'3455', 'tax_office_legal':'3455', 'timezone':null, 'geo_lat':'49.187135', 'geo_lon':'42.582354', 'beltway_hit':null, 'beltway_distance':null, 'metro':null, 'qc_geo':'3', 'qc_complete':null, 'qc_house':null, 'history_values':null, 'unparsed_parts':null, 'source':null, 'qc':null, '__typename':'AddressMetaDataField' }, '__typename':'AddressMetaField' }, 'map':{ 'dv':1, 'type':'building', 'sections':[{ 'id':'27', 'type':'section', 'index':1, 'name':'1', 'preview':null, 'floors':[{ 'id':'51', 'type':'floor', 'index':4, 'name':'4', 'units':[{ 'id':'46', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'16', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'47', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'17', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'48', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'18', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'49', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'19', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'50', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'20', 'preview':null, '__typename':'BuildingUnit' }], '__typename':'BuildingFloor' }, { 'id':'45', 'type':'floor', 'index':3, 'name':'3', 'units':[{ 'id':'40', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'11', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'41', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'12', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'42', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'13', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'43', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'14', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'44', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'15', 'preview':null, '__typename':'BuildingUnit' }], '__typename':'BuildingFloor' }, { 'id':'39', 'type':'floor', 'index':2, 'name':'2', 'units':[{ 'id':'34', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'6', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'35', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'7', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'36', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'8', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'37', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'9', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'38', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'10', 'preview':null, '__typename':'BuildingUnit' }], '__typename':'BuildingFloor' }, { 'id':'33', 'type':'floor', 'index':1, 'name':'1', 'units':[{ 'id':'28', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'1', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'29', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'2', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'30', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'3', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'31', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'4', 'preview':null, '__typename':'BuildingUnit' }, { 'id':'32', 'type':'unit', 'unitType':'flat', 'name':null, 'label':'5', 'preview':null, '__typename':'BuildingUnit' }], '__typename':'BuildingFloor' }], '__typename':'BuildingSection' }], 'parking':[], '__typename':'BuildingMap' }, '__typename':'Property' }, 'unitType':'flat', 'unitName':'1', 'accountNumber':null, 'toPay':'35199.36960000', 'rows':[{ 'name':'Клининг возле квартиры', 'toPay':'10', 'count':3, 'vatPercent':'10.0000', 'salesTaxPercent':'', 'sku':'1000102', 'isMin':false, 'currencyCode':'RUB', 'meta':{ 'imageUrl':null, 'categoryBgColor':null, '__typename':'InvoiceRowMetaSchemaField' }, '__typename':'InvoiceRowSchemaField' }, { 'name':'Скалолаз', 'toPay':'4500', 'count':6, 'vatPercent':'10.0000', 'salesTaxPercent':'', 'sku':'1000103', 'isMin':false, 'currencyCode':'RUB', 'meta':{ 'imageUrl':null, 'categoryBgColor':null, '__typename':'InvoiceRowMetaSchemaField' }, '__typename':'InvoiceRowSchemaField' }, { 'name':'Стрижка котика', 'toPay':'1000', 'count':1, 'vatPercent':'10.0000', 'salesTaxPercent':'', 'sku':'1000101', 'isMin':false, 'currencyCode':'RUB', 'meta':{ 'imageUrl':null, 'categoryBgColor':null, '__typename':'InvoiceRowMetaSchemaField' }, '__typename':'InvoiceRowSchemaField' }, { 'name':'Хочу другие лампочки, а то у этих цвет света дурацкий', 'toPay':'6800', 'count':1, 'vatPercent':'10.0000', 'salesTaxPercent':'', 'sku':'1000104', 'isMin':false, 'currencyCode':'RUB', 'meta':{ 'imageUrl':null, 'categoryBgColor':null, '__typename':'InvoiceRowMetaSchemaField' }, '__typename':'InvoiceRowSchemaField' }, { 'name':'adasdasd', 'toPay':'123.1232', 'count':3, 'vatPercent':'10.0000', 'salesTaxPercent':'', 'sku':'123123213', 'isMin':false, 'currencyCode':'RUB', 'meta':{ 'imageUrl':'https://condo.d.doma.ai/api/files/market_category/cltznavs203db0nmk1y8p2d9x.png?original_filename=%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5.png', 'categoryBgColor':'#aaa', '__typename':'InvoiceRowMetaSchemaField' }, '__typename':'InvoiceRowSchemaField' }], 'ticket':{ 'id':'8c2af06f-0b0d-4422-829b-92590f96f464', 'number':699526, 'property':{ 'id':'a38bd2ed-bdcf-4260-9c44-79d92d7b8eed', '__typename':'Property' }, 'unitName':'1', 'unitType':'flat', 'clientName':null, 'clientPhone':null, '__typename':'Ticket' }, 'contact':null, 'clientName':null, 'clientPhone':null, 'client':null, 'status':'draft', 'paymentType':'online', 'publishedAt':null, 'paidAt':null, 'canceledAt':null, 'recipient':{ 'name':null, 'bankName':null, 'tin':'6685107666', 'bic':'044525590', 'bankAccount':'40702810902820001312', '__typename':'RecipientField' }, 'currencyCode':'RUB', 'canGroupReceipts':true, 'acquiringHostUrl':'https://rb.d.doma.ai', 'acquiringIntegrationId':'322b35c8-da44-40c2-a961-3a75f486e9e3', 'id':'a8189eb7-ec33-4cc8-875f-c6e73e0cd523', 'dv':1, 'sender':{ 'dv':1, 'fingerprint':'HVOuoaaSj6Sk', '__typename':'SenderField' }, 'v':5, 'deletedAt':null, 'newId':null, 'createdBy':{ 'id':'ef034804-c64b-4492-88b2-813db3070177', 'name':'Александр Петухов', 'type':'staff', '__typename':'User' }, 'updatedBy':{ 'id':'ef034804-c64b-4492-88b2-813db3070177', 'name':'Александр Петухов', '__typename':'User' }, 'createdAt':'2024-06-27T07:16:41.069Z', 'updatedAt':'2024-06-27T11:17:58.498Z', '__typename':'Invoice' }]

const generateTicketDocumentOfCompletionWorks = async ({ task, baseAttrs, context, locale, ticket, organization }) => {
    const { format, timeZone: timeZoneFromUser } = task

    const timeZone = normalizeTimeZone(timeZoneFromUser) || DEFAULT_ORGANIZATION_TIMEZONE
    const printDate = dayjs().tz(timeZone)

    const property = await getById('Property', ticket.property)
    const { renderData, streetPart, settlement, housePart, cityType, cityName } = getAddressDetails(get(property, 'addressMeta', ticket.propertyAddressMeta))

    const contact = ticket.contact
        ? await getById('Contact', ticket.contact)
        : null

    const employee = organization.id && ticket.executor
        ? await getByCondition('OrganizationEmployee', {
            organization: { id: organization.id },
            user: { id: ticket.executor },
        })
        : null

    let invoices = await Invoice.getAll(context, {
        ticket: { id: ticket.id },
        deletedAt: null,
    }, {
        sortBy: ['createdAt_ASC'],
    })

    if (isEmpty(invoices)) invoices = fakeInvoices
    const currencyCode = get(invoices, '0.currencyCode') || DEFAULT_INVOICE_CURRENCY_CODE

    const listOfWorks = invoices.reduce((acc, invoice) => {
        const rows = Array.isArray(invoice.rows) ? invoice.rows : []
        acc.push(...rows.map(row => {
            const price = parseFloat(row.toPay)

            return {
                name: row.name || '',
                count: String(row.count) || '',
                price: !Number.isNaN(price) ? renderMoney(price, currencyCode, locale) : '',
                sum: !Number.isNaN(price) ? renderMoney(price * row.count, currencyCode, locale) : '',
            }
        }))

        return acc
    }, [])

    const documentData = {
        city: {
            name: cityName || '',
            type: cityType || '',
        },
        printDate: {
            day: printDate.format('DD'),
            month: printDate.format('MMMM'),
            year: printDate.format('YYYY'),
        },
        property: {
            fullAddress: `${renderData} ${streetPart}`,
            address: `${renderData} ${settlement}`,
            number: housePart,
        },
        client: {
            name: get(contact, 'name') || '',
        },
        unit: {
            name: get(ticket, 'unitName') || '',
        },
        company: {
            name: get(organization, 'name') || '',
        },
        executor: {
            name: get(employee, 'name') || '',
            position: get(employee, 'position') || '',
        },
        listOfWorks,
    }

    let fileUploadInput

    switch (format) {
        case TICKET_DOCUMENT_GENERATION_TASK_FORMAT.DOCX: {
            fileUploadInput = buildUploadInputFrom(await buildExportWordFile({ task, documentData, locale, timeZone }))
            break
        }

        default: {
            throw new Error(`unexpected format "${format}" for a document generations`)
        }
    }

    return fileUploadInput
}


module.exports = {
    generateTicketDocumentOfCompletionWorks,
}
