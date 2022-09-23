import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'

import { useIntl } from '@condo/next/intl'
import { useApolloClient } from '@condo/next/apollo'
import { useOrganization } from '@condo/next/organization'

import { TicketCreateInput } from '@app/condo/schema'

import {
    Columns,
    DATE_PARSING_FORMAT,
    ObjectCreator,
    RowNormalizer,
    RowValidator,
} from '@condo/domains/common/utils/importer'
import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { searchContacts, searchProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { STATUS_IDS } from '@condo/domains/ticket/constants/statusTransitions'

const normalizeIsResidentTicket = (value: string) => {
    const VALID_VALUES = ['да', 'нет', '']
    const valueInLoverCase = value.toLowerCase()
    if (!VALID_VALUES.includes(valueInLoverCase)) return null
    return valueInLoverCase === 'да'
}

const getFullDetails = (details: string, oldTicketNumber: string, createdAt: string) => {
    let result = details
    if (oldTicketNumber) {
        result += '\n' + oldTicketNumber
    }
    if (createdAt) {
        result += '\n' + createdAt
    }
    return result
}

const isValidDate = (value) => {
    return dayjs(value, DATE_PARSING_FORMAT).isValid()
}

const SOURCE_IMPORT_ID = '92cfa7b1-b793-4c22-ae03-ea2aae1e1315'

export const useImporterFunctions = (): [Columns, RowNormalizer, RowValidator, ObjectCreator] => {
    const intl = useIntl()
    const IncorrectRowFormatMessage = intl.formatMessage({ id: 'errors.import.IncorrectRowFormat' })
    const IncorrectPhoneNumberFormatMessage = intl.formatMessage({ id: 'errors.import.IncorrectPhoneNumberFormat' })
    const AddressNotFoundMessage = intl.formatMessage({ id: 'errors.import.AddressNotFound' })
    const IncorrectIsResidentTicketFormatMessage = intl.formatMessage({ id: 'errors.import.IncorrectIsResidentTicketFormat' })
    const PropertyNotFoundMessage = intl.formatMessage({ id: 'errors.import.PropertyNotFound' })
    const IncorrectPhoneAndFullNameForResidentTicketMessage = intl.formatMessage({ id: 'errors.import.IncorrectPhoneAndFullNameForResidentTicket' })
    const IsEmptyDetailsMessage = intl.formatMessage({ id: 'errors.import.isEmptyDetails' })

    const AddressLabel = intl.formatMessage({ id: 'ticket.import.column.address' })
    const UnitNameLabel = intl.formatMessage({ id: 'ticket.import.column.unitName' })
    const IsResidentTicketLabel = intl.formatMessage({ id: 'ticket.import.column.isResidentTicket' })
    const PhoneLabel = intl.formatMessage({ id: 'ticket.import.column.phone' })
    const FullNameLabel = intl.formatMessage({ id: 'ticket.import.column.fullName' })
    const DetailsLabel = intl.formatMessage({ id: 'ticket.import.column.details' })
    const OldTicketNumberLabel = intl.formatMessage({ id: 'ticket.import.column.oldTicketNumber' })
    const CreatedAtLabel = intl.formatMessage({ id: 'ticket.import.column.createdAt' })

    const userOrganization = useOrganization()
    const client = useApolloClient()
    const { addressApi } = useAddressApi()

    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const contactCreateAction = Contact.useCreate({})
    const ticketCreateAction = Ticket.useCreate({})

    const columns: Columns = [
        { name: AddressLabel, type: 'string', required: true, label: AddressLabel },
        { name: UnitNameLabel, type: 'string', required: false, label: UnitNameLabel },
        { name: IsResidentTicketLabel, type: 'string', required: false, label: IsResidentTicketLabel },
        { name: PhoneLabel, type: 'string', required: false, label: PhoneLabel },
        { name: FullNameLabel, type: 'string', required: false, label: FullNameLabel },
        { name: DetailsLabel, type: 'string', required: true, label: DetailsLabel },
        { name: OldTicketNumberLabel, type: 'string', required: false, label: OldTicketNumberLabel },
        { name: CreatedAtLabel, type: 'custom', required: false, label: CreatedAtLabel },
    ]

    const ticketNormalizer: RowNormalizer = async (row) => {
        const [address, unitName, isResidentTicket, phone, fullName, details, oldTicketNumber, createdAt] = row
        const addons = {
            address: null,
            propertyId: null,
            phone: null,
            isValidPhone: null,
            fullName: null,
            details: null,
            isResidentTicket: null,
            contacts: null,
            unitName: null,
            unitType: null,
            createdAt: null,
            isEmptyDetails: null,
            oldTicketNumber: null,
        }

        const suggestionOptions = await addressApi.getSuggestions(String(address.value))
        const suggestion = get(suggestionOptions, ['suggestions', 0])
        if (suggestion) {
            addons.address = suggestion.value

            const properties = await searchProperty(client, {
                address: suggestion.value,
                organization: { id: userOrganizationId },
            }, undefined)

            addons.propertyId = !isEmpty(properties) ? properties[0].value : null
        }

        const phoneNumber = String(get(phone, 'value', '')).trim()
        addons.phone = phoneNumber || null
        addons.isValidPhone = Boolean(normalizePhone(phoneNumber, true))
        addons.createdAt = createdAt.value ? String(createdAt.value) : ''
        addons.fullName = String(get(fullName, 'value', '')).trim()
        addons.details = String(get(details, 'value', '')).trim()
        addons.oldTicketNumber = String(get(oldTicketNumber, 'value', '')).trim()
        addons.isResidentTicket = normalizeIsResidentTicket(String(get(isResidentTicket, 'value', '')).trim())
        addons.unitName = unitName.value ? String(unitName.value).trim() : null
        addons.unitType = addons.unitName ? 'flat' : null
        addons.isEmptyDetails = Boolean(String(get(details, 'value', '')).trim())

        const { data: { objs } } = await searchContacts(client, {
            organizationId: userOrganizationId,
            propertyId: addons.propertyId,
            unitName: addons.unitName,
            unitType: addons.unitType,
        })
        addons.contacts = objs

        return Promise.resolve({ row, addons })
    }

    const ticketValidator: RowValidator = (row) => {
        if (!row) return Promise.resolve(false)
        const errors = []
        if (!row.addons) errors.push(IncorrectRowFormatMessage)
        if (!get(row, ['addons', 'address'])) errors.push(AddressNotFoundMessage)
        if (!get(row, ['addons', 'propertyId'])) errors.push(PropertyNotFoundMessage)
        if (!get(row, ['addons', 'isEmptyDetails'])) errors.push(IsEmptyDetailsMessage)

        const phone = get(row, ['addons', 'phone'])
        const isValidPhone = get(row, ['addons', 'isValidPhone'])
        const fullName = get(row, ['addons', 'fullName'])
        const isResidentTicket = get(row, ['addons', 'isResidentTicket'])
        if (isNull(isResidentTicket)) errors.push(IncorrectIsResidentTicketFormatMessage)
        if (phone && !isValidPhone) errors.push(IncorrectPhoneNumberFormatMessage)
        if (isResidentTicket && (!phone || !fullName)) errors.push(IncorrectPhoneAndFullNameForResidentTicketMessage)

        const createAt = get(row, ['addons', 'createdAt'])
        if (createAt && !isValidDate(createAt)) errors.push(intl.formatMessage({ id: 'errors.import.date' }, { columnName: CreatedAtLabel, format: DATE_PARSING_FORMAT }))

        if (errors.length) {
            row.errors = errors
            return Promise.resolve(false)
        }

        return Promise.resolve(true)
    }

    const ticketCreator: ObjectCreator = async (row) => {
        if (!row) return Promise.resolve()
        const phone = get(row, ['addons', 'phone'])
        const contacts = get(row, ['addons', 'contacts'], [])
        const fullName = get(row, ['addons', 'fullName'])
        const details = get(row, ['addons', 'details'])
        const propertyId = get(row, ['addons', 'propertyId'])
        const isResidentTicket = get(row, ['addons', 'isResidentTicket'])
        const unitName = get(row, ['addons', 'unitName'])
        const unitType = get(row, ['addons', 'unitType'])
        const oldTicketNumber = get(row, ['addons', 'oldTicketNumber'])
        const createdAt = get(row, ['addons', 'createdAt'])

        const ticketPayload: Partial<TicketCreateInput> = {
            canReadByResident: true,
            clientName: fullName,
            clientPhone: phone,
            details: getFullDetails(details, oldTicketNumber, createdAt),
            isResidentTicket,
            organization: { connect: { id: String(userOrganizationId) } },
            property: { connect: { id: propertyId } },
            // floorName:
            // sectionName:
            // sectionType:
            // executor:
            // assignee:
            // classifier:
            // deadline:
            status: { connect: { id: STATUS_IDS.OPEN } },
            source: { connect: { id: SOURCE_IMPORT_ID } },
            unitName,
            unitType,
        }

        if (isResidentTicket) {
            const existingContact = contacts.find(contact => contact.phone === phone && contact.name === fullName)
            if (existingContact) {
                ticketPayload.contact = { connect: { id: get(existingContact, 'id') } }
            } else {
                const newContact = await contactCreateAction({
                    organization: { connect: { id: String(userOrganizationId) } },
                    property: { connect: { id: String(row.addons.property) } },
                    unitName: String(unitName.value),
                    phone,
                    name: row.addons.fullName,
                })
                ticketPayload.contact = { connect: { id: get(newContact, 'id') } }
            }
        }

        return ticketCreateAction(ticketPayload)
    }

    return [columns, ticketNormalizer, ticketValidator, ticketCreator]
}
