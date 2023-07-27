import get from 'lodash/get'
import { useEffect, useRef } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { Columns, ObjectCreator, RowNormalizer, RowValidator } from '@condo/domains/common/utils/importer'
import { Contact, ContactRole } from '@condo/domains/contact/utils/clientSchema'
import {
    APARTMENT_UNIT_TYPE,
    COMMERCIAL_UNIT_TYPE,
    FLAT_UNIT_TYPE,
    PARKING_UNIT_TYPE,
    WAREHOUSE_UNIT_TYPE,
} from '@condo/domains/property/constants/common'
import { searchContacts, searchProperty } from '@condo/domains/ticket/utils/clientSchema/search'


const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')

const SPLIT_PATTERN = /[,;.]+/g

const parsePhones = (phones: string) => {
    const clearedPhones = phones.replace(/[^0-9+,;.]/g, '')
    const splitPhones = clearedPhones.split(SPLIT_PATTERN)
    return splitPhones.map(phone => {
        if (phone.startsWith('8')) {
            phone = '+7' + phone.substring(1)
        }
        return normalizePhone(phone, true)
    })
}

let rolesNameToIdMapping = {}

export const useImporterFunctions = (): [Columns, RowNormalizer, RowValidator, ObjectCreator] => {
    const intl = useIntl()
    const IncorrectRowFormatMessage = intl.formatMessage({ id: 'errors.import.incorrectRowFormat' })
    const AddressNotFoundMessage = intl.formatMessage({ id: 'errors.import.addressNotFound' })
    const PropertyNotFoundMessage = intl.formatMessage({ id: 'errors.import.propertyNotFound' })
    const IncorrectContactNameMessage = intl.formatMessage({ id: 'errors.import.incorrectContactName' })
    const IncorrectUnitNameMessage = intl.formatMessage({ id: 'errors.import.emptyUnitName' })
    const IncorrectUnitTypeMessage = intl.formatMessage({ id: 'errors.import.emptyUnitType' })
    const IncorrectEmailMessage = intl.formatMessage({ id: 'errors.import.incorrectEmailFormat' })
    const IncorrectPhonesMessage = intl.formatMessage({ id: 'errors.import.incorrectPhonesFormat' })
    const AlreadyCreatedContactMessage = intl.formatMessage({ id: 'errors.import.alreadyCreatedContact' })
    const AddressTitle = intl.formatMessage({ id: 'contact.import.column.address' })
    const UnitTitle = intl.formatMessage({ id: 'contact.import.column.unit' })
    const PhoneTitle = intl.formatMessage({ id: 'contact.import.column.phone' })
    const NameTitle = intl.formatMessage({ id: 'contact.import.column.name' })
    const EmailTitle = intl.formatMessage({ id: 'contact.import.column.email' })
    const RoleTitle = intl.formatMessage({ id: 'contact.import.column.role' })
    const UnitTypeTitle = intl.formatMessage({ id: 'contact.import.column.unitType' })
    const FlatUnitTypeValue = intl.formatMessage({ id: 'ticket.field.unitType.flat' })
    const ParkingUnitTypeValue = intl.formatMessage({ id: 'ticket.field.unitType.parking' })
    const ApartmentUnitTypeValue = intl.formatMessage({ id: 'ticket.field.unitType.apartment' })
    const WarehouseUnitTypeValue = intl.formatMessage({ id: 'ticket.field.unitType.warehouse' })
    const CommercialUnitTypeValue = intl.formatMessage({ id: 'ticket.field.unitType.commercial' })

    const userOrganization = useOrganization()
    const client = useApolloClient()
    const { addressApi } = useAddressApi()

    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const userOrganizationIdRef = useRef(userOrganization.id)
    useEffect(() => {
        userOrganizationIdRef.current = userOrganizationId
    }, [userOrganizationId])

    const contactCreateAction = Contact.useCreate({})

    const {
        loading: isRolesLoading,
        objs: contactRoles,
    } = ContactRole.useObjects({
        where: {
            OR: [
                { organization_is_null: true },
                { organization: { id: userOrganizationId } },
            ],
        },
    })

    if (!isRolesLoading) {
        rolesNameToIdMapping = contactRoles.reduce((result, current) => ({
            ...result,
            [String(current.name).toLowerCase()]: current.id,
        }), {})
    }

    const columns: Columns = [
        { name: AddressTitle, type: 'string', required: true },
        { name: UnitTitle, type: 'string', required: true },
        { name: UnitTypeTitle, type: 'string', required: true },
        { name: PhoneTitle, type: 'string', required: true },
        { name: NameTitle, type: 'string', required: true },
        { name: EmailTitle, type: 'string', required: false },
        { name: RoleTitle, type: 'string', required: false },
    ]

    const contactNormalizer: RowNormalizer = async (row) => {
        const addons = {
            address: null,
            property: null,
            phones: null,
            fullName: null,
            email: null,
            unitType: null,
            role: null,
        }
        if (row.length !== columns.length) return Promise.resolve({ row })
        const [address, , unitType, phones, fullName, email, role] = row
        email.value = email.value && String(email.value).trim().length ? String(email.value).trim() : undefined

        const unitTypeValue = String(get(unitType, 'value', '')).trim().toLowerCase()
        const UNIT_TYPE_TRANSLATION_TO_TYPE = {
            [FlatUnitTypeValue.toLowerCase()]: FLAT_UNIT_TYPE,
            [ParkingUnitTypeValue.toLowerCase()]: PARKING_UNIT_TYPE,
            [ApartmentUnitTypeValue.toLowerCase()]: APARTMENT_UNIT_TYPE,
            [WarehouseUnitTypeValue.toLowerCase()]: WAREHOUSE_UNIT_TYPE,
            [CommercialUnitTypeValue.toLowerCase()]: COMMERCIAL_UNIT_TYPE,
        }

        addons.unitType = UNIT_TYPE_TRANSLATION_TO_TYPE[unitTypeValue]

        const roleValue = get(role, 'value')
        if (roleValue) {
            addons.role = String(roleValue).trim().toLowerCase()
        }

        return addressApi.getSuggestions(String(address.value)).then(result => {
            const suggestion = get(result, ['suggestions', 0])
            if (suggestion) {
                addons.address = suggestion.value
                const where = {
                    address: suggestion.value,
                    organization: { id: userOrganizationIdRef.current },
                }
                return searchProperty(client, where, undefined).then((res) => {
                    addons.property = res.length > 0 ? res[0].value : null
                    addons.phones = parsePhones(String(phones.value))
                    addons.fullName = String(get(fullName, 'value', '')).trim()
                    addons.email = normalizeEmail(email.value)
                    return { row, addons }
                })
            }
            addons.phones = parsePhones(String(phones.value))
            addons.fullName = String(get(fullName, 'value', '')).trim()
            addons.email = normalizeEmail(email.value)
            return { row, addons }
        })
    }

    const contactValidator: RowValidator = async (row) => {
        if (!row) return Promise.resolve(false)
        const errors = []
        if (!row.addons) errors.push(IncorrectRowFormatMessage)
        if (!get(row, ['addons', 'address'])) errors.push(AddressNotFoundMessage)
        if (!get(row, ['addons', 'property'])) errors.push(PropertyNotFoundMessage)
        if (!get(row, ['addons', 'fullName', 'length'])) errors.push(IncorrectContactNameMessage)

        const rowEmail = get(row, ['row', '5', 'value'])
        if (rowEmail && !get(row, ['addons', 'email'])) {
            errors.push(IncorrectEmailMessage)
        }

        const unitName = get(row, ['row', '1', 'value'], '')
        if (!unitName || String(unitName).trim().length === 0) errors.push(IncorrectUnitNameMessage)

        const unitType = get(row, ['addons', 'unitType'], '')
        if (!unitType || String(unitType).trim().length === 0) errors.push(IncorrectUnitTypeMessage)

        const phones = get(row, ['addons', 'phones'], []).filter(Boolean)
        if (!phones || phones.length === 0) errors.push(IncorrectPhonesMessage)

        const contactRoleName = get(row, ['addons', 'role'])
        if (contactRoleName) {
            const contactRoleId = get(rolesNameToIdMapping, String(contactRoleName).trim().toLowerCase())
            if (!contactRoleId) {
                // The roles list loading asynchronously, so this message should build dynamically
                errors.push(intl.formatMessage({ id: 'errors.import.incorrectContactRole' }, { rolesList: Object.keys(rolesNameToIdMapping).join(', ') }))
            }
        }

        const { data } = await searchContacts(client, {
            organizationId: userOrganizationIdRef.current,
            propertyId: row.addons.property,
            unitName,
            unitType,
        })
        const alreadyCreated = data.objs.some(contact => phones.includes(contact.phone))

        if (alreadyCreated) errors.push(AlreadyCreatedContactMessage)

        if (errors.length) {
            row.errors = errors
            return Promise.resolve(false)
        }

        return Promise.resolve(true)
    }

    const contactCreator: ObjectCreator = (row) => {
        if (!row) return Promise.resolve()
        const unitName = String(get(row.row, ['1', 'value'])).trim()
        const contactPool = []
        const splitPhones = String(row.row[3].value).split(SPLIT_PATTERN)
        const inValidPhones = []

        for (let i = 0; i < row.addons.phones.length; i++) {
            const phone: string = row.addons.phones[i]
            if (!phone && i < splitPhones.length) {
                inValidPhones.push(splitPhones[i])
                continue
            }

            const contactData = {
                organization: { connect: { id: userOrganizationIdRef.current } },
                property: { connect: { id: String(row.addons.property) } },
                unitName,
                unitType: row.addons.unitType,
                phone: phone,
                name: row.addons.fullName,
                email: row.addons.email,
            }

            const role = get(row, ['addons', 'role'])

            if (role) {
                const roleId = get(rolesNameToIdMapping, String(role).trim().toLowerCase())
                if (roleId) {
                    contactData['role'] = { connect: { id: roleId } }
                }
            }

            contactPool.push(contactCreateAction(contactData))
        }
        return Promise.all(contactPool).then(() => {
            if (inValidPhones.length > 0) {
                row.row[3].value = inValidPhones.join('; ')
                row.shouldBeReported = true
            }
        })
    }

    return [columns, contactNormalizer, contactValidator, contactCreator]
}
