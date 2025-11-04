import { TicketCreateInput } from '@app/condo/schema'
import dayjs from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'
import { useEffect, useRef } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import {
    Columns,
    ISO_DATE_FORMAT,
    ObjectCreator,
    RowNormalizer,
    RowValidator,
} from '@condo/domains/common/utils/importer'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import {
    APARTMENT_UNIT_TYPE,
    COMMERCIAL_UNIT_TYPE,
    FLAT_UNIT_TYPE,
    PARKING_UNIT_TYPE,
    WAREHOUSE_UNIT_TYPE,
} from '@condo/domains/property/constants/common'
import { STATUS_IDS } from '@condo/domains/ticket/constants/statusTransitions'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { searchProperty } from '@condo/domains/ticket/utils/clientSchema/search'


const normalizeIsResidentTicket = (value: string, yes: string, no: string) => {
    const VALID_VALUES = [yes, no, '']
    const valueInLowerCase = value.toLowerCase()
    if (!VALID_VALUES.includes(valueInLowerCase)) return null
    return valueInLowerCase === yes
}

const getFullDetails = (intl, details: string, oldTicketNumber: string, createdAt: string) => {
    const OldTicketNumberMessage = intl.formatMessage({ id: 'ticket.import.value.details.oldTicketNumber' })
    const CreatedAtMessage = intl.formatMessage({ id: 'ticket.import.value.details.createdAt' })

    const additionalInformation: string[] = []
    if (oldTicketNumber) {
        additionalInformation.push(`${OldTicketNumberMessage} — ${oldTicketNumber}.`)
    }
    if (createdAt) {
        const formattedDate = dayjs(createdAt).format('DD.MM.YYYY')
        additionalInformation.push(`${CreatedAtMessage} — ${formattedDate}.`)
    }

    return `${details}\n${additionalInformation.join(' ')}`
}

const isValidDate = (value) => {
    return dayjs(value, ISO_DATE_FORMAT).isValid()
}

const SOURCE_IMPORT_ID = '92cfa7b1-b793-4c22-ae03-ea2aae1e1315'

export const useImporterFunctions = (): [Columns, RowNormalizer, RowValidator, ObjectCreator] => {
    const intl = useIntl()
    const IsResidentTicketValueYesMessage = intl.formatMessage({ id: 'ticket.import.value.isResidentTicket.yes' })
    const IsResidentTicketValueNoMessage = intl.formatMessage({ id: 'ticket.import.value.isResidentTicket.no' })

    const IncorrectRowFormatMessage = intl.formatMessage({ id: 'errors.import.IncorrectRowFormat' })
    const IncorrectPhoneNumberFormatMessage = intl.formatMessage({ id: 'errors.import.IncorrectPhoneNumberFormat' })
    const AddressNotFoundMessage = intl.formatMessage({ id: 'errors.import.AddressNotFound' })
    const IncorrectIsResidentTicketFormatMessage = intl.formatMessage({ id: 'errors.import.IncorrectIsResidentTicketFormat' })
    const IncorrectUnitTypeMessage = intl.formatMessage({ id: 'errors.import.EmptyUnitType' })
    const PropertyNotFoundMessage = intl.formatMessage({ id: 'errors.import.PropertyNotFound' })
    const IncorrectPhoneAndFullNameForResidentTicketMessage = intl.formatMessage({ id: 'errors.import.IncorrectPhoneAndFullNameForResidentTicket' })
    const IsEmptyDetailsMessage = intl.formatMessage({ id: 'errors.import.isEmptyDetails' })

    const AddressLabel = intl.formatMessage({ id: 'ticket.import.column.address' })
    const UnitNameLabel = intl.formatMessage({ id: 'ticket.import.column.unitName' })
    const UnitTypeLabel = intl.formatMessage({ id: 'ticket.import.column.unitType' })
    const IsResidentTicketLabel = intl.formatMessage({ id: 'ticket.import.column.isResidentTicket' })
    const PhoneLabel = intl.formatMessage({ id: 'ticket.import.column.phone' })
    const FullNameLabel = intl.formatMessage({ id: 'ticket.import.column.fullName' })
    const DetailsLabel = intl.formatMessage({ id: 'ticket.import.column.details' })
    const OldTicketNumberLabel = intl.formatMessage({ id: 'ticket.import.column.oldTicketNumber' })
    const CreatedAtLabel = intl.formatMessage({ id: 'ticket.import.column.createdAt' })
    const FlatUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.flat' })
    const ParkingUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.parking' })
    const ApartmentUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.apartment' })
    const WarehouseUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.warehouse' })
    const CommercialUnitTypeValue = intl.formatMessage({ id: 'pages.condo.ticket.field.unitType.commercial' })

    const { organization: { id: userOrganizationId } } = useOrganization()
    const client = useApolloClient()
    const { addressApi } = useAddressApi()

    const userOrganizationIdRef = useRef(userOrganizationId)
    useEffect(() => {
        userOrganizationIdRef.current = userOrganizationId
    }, [userOrganizationId])

    const ticketCreateAction = Ticket.useCreate({})

    const columns: Columns = [
        { name: AddressLabel, type: 'string', required: true },
        { name: UnitNameLabel, type: 'string', required: false },
        { name: UnitTypeLabel, type: 'string', required: false },
        { name: IsResidentTicketLabel, type: 'string', required: false },
        { name: PhoneLabel, type: 'string', required: false },
        { name: FullNameLabel, type: 'string', required: false },
        { name: DetailsLabel, type: 'string', required: true },
        { name: OldTicketNumberLabel, type: 'string', required: false },
        { name: CreatedAtLabel, type: 'custom', required: false },
    ]

    const UNIT_TYPE_TRANSLATION_TO_TYPE = {
        [FlatUnitTypeValue.toLowerCase()]: FLAT_UNIT_TYPE,
        [ParkingUnitTypeValue.toLowerCase()]: PARKING_UNIT_TYPE,
        [ApartmentUnitTypeValue.toLowerCase()]: APARTMENT_UNIT_TYPE,
        [WarehouseUnitTypeValue.toLowerCase()]: WAREHOUSE_UNIT_TYPE,
        [CommercialUnitTypeValue.toLowerCase()]: COMMERCIAL_UNIT_TYPE,
    }

    const ticketNormalizer: RowNormalizer = async (row) => {
        const [address, unitName, unitType, isResidentTicket, phone, fullName, details, oldTicketNumber, createdAt] = row
        const addons = {
            address: null,
            propertyId: null,
            phone: null,
            isValidPhone: null,
            fullName: null,
            details: null,
            isResidentTicket: null,
            unitName: null,
            unitType: null,
            createdAt: null,
            isEmptyDetails: null,
            oldTicketNumber: null,
        }

        const suggestionOptions = await addressApi.getSuggestions(String(address.value))
        const suggestion = suggestionOptions?.suggestions?.[0]
        if (suggestion) {
            addons.address = suggestion.value

            const properties = await searchProperty(client, {
                address: suggestion.value,
                organization: { id: userOrganizationIdRef.current },
            }, undefined)

            addons.propertyId = !isEmpty(properties) ? properties[0].value : null
        }

        const trimmedPhoneNumber = String(phone?.value || '').trim()
        const normalizedPhone = normalizePhone(trimmedPhoneNumber, true)
        const trimmedIsResidentTicket = String(isResidentTicket?.value || '').trim()
        const normalizedIsResidentTicket = normalizeIsResidentTicket(trimmedIsResidentTicket, IsResidentTicketValueYesMessage, IsResidentTicketValueNoMessage)
        const trimmedUnitName = String(unitName?.value || '').trim()
        const trimmedUnitType = String(unitType?.value || '').trim().toLowerCase()
        const normalizedUnitType = UNIT_TYPE_TRANSLATION_TO_TYPE[trimmedUnitType]

        addons.phone = normalizedPhone || null
        addons.isValidPhone = Boolean(normalizedPhone)
        addons.createdAt = String(createdAt.value || '')
        addons.fullName = String(fullName?.value || '').trim()
        addons.details = String(details?.value || '').trim()
        addons.oldTicketNumber = String(oldTicketNumber?.value || '').trim()
        addons.isResidentTicket = normalizedIsResidentTicket
        addons.unitName = trimmedUnitName || null
        addons.unitType = normalizedUnitType || null
        addons.isEmptyDetails = Boolean(String(details?.value || '').trim())

        return { row, addons }
    }

    const ticketValidator: RowValidator = async (row) => {
        if (!row) return false
        const errors = []
        if (!row.addons) errors.push(IncorrectRowFormatMessage)
        if (!row?.addons?.address) errors.push(AddressNotFoundMessage)
        if (!row?.addons?.propertyId) errors.push(PropertyNotFoundMessage)
        if (!row?.addons?.isEmptyDetails) errors.push(IsEmptyDetailsMessage)
        if (!row?.addons?.unitType) errors.push(IncorrectUnitTypeMessage)

        const phone = row?.addons?.phone
        const isValidPhone = row?.addons?.isValidPhone
        const fullName = row?.addons?.fullName
        const isResidentTicket = row?.addons?.isResidentTicket
        if (isNull(isResidentTicket)) errors.push(IncorrectIsResidentTicketFormatMessage)
        if (phone && !isValidPhone) errors.push(IncorrectPhoneNumberFormatMessage)
        if (isResidentTicket && (!phone || !fullName)) errors.push(IncorrectPhoneAndFullNameForResidentTicketMessage)

        const createdAt = row?.addons?.createdAt
        if (createdAt && !isValidDate(createdAt)) errors.push(intl.formatMessage({ id: 'errors.import.date' }, { columnName: CreatedAtLabel, format: ISO_DATE_FORMAT }))

        if (errors.length) {
            row.errors = errors
            return false
        }

        return true
    }

    const ticketCreator: ObjectCreator = async (row) => {
        if (!row) return
        const phone = row?.addons?.phone
        const fullName = row?.addons?.fullName
        const details = row?.addons?.details
        const propertyId = row?.addons?.propertyId
        const isResidentTicket = row?.addons?.isResidentTicket
        const unitName = row?.addons?.unitName
        const unitType = row?.addons?.unitType
        const oldTicketNumber = row?.addons?.oldTicketNumber
        const createdAt = row?.addons?.createdAt

        const ticketPayload: Partial<TicketCreateInput> = {
            canReadByResident: true,
            clientName: fullName,
            clientPhone: phone,
            details: getFullDetails(intl, details, oldTicketNumber, createdAt),
            isResidentTicket,
            organization: { connect: { id: String(userOrganizationIdRef.current) } },
            property: { connect: { id: propertyId } },
            status: { connect: { id: STATUS_IDS.OPEN } },
            source: { connect: { id: SOURCE_IMPORT_ID } },
            unitName,
            unitType,
        }

        return await ticketCreateAction(ticketPayload)
    }

    return [columns, ticketNormalizer, ticketValidator, ticketCreator]
}
