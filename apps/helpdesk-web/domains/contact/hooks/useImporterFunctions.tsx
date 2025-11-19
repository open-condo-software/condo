import { ContactCreateInput } from '@app/condo/schema'
import { useEffect, useRef } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { SPECIAL_CHAR_REGEXP } from '@condo/domains/common/constants/regexps'
import { Columns, ObjectCreator, RowNormalizer, RowValidator } from '@condo/domains/common/utils/importer'
import { sleep } from '@condo/domains/common/utils/sleep'
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

export const useImporterFunctions = ({ isVerifiedRef }): [Columns, RowNormalizer, RowValidator, ObjectCreator] => {
    const intl = useIntl()
    const IncorrectRowFormatMessage = intl.formatMessage({ id: 'errors.import.IncorrectRowFormat' })
    const AddressNotFoundMessage = intl.formatMessage({ id: 'errors.import.AddressNotFound' })
    const PropertyNotFoundMessage = intl.formatMessage({ id: 'errors.import.PropertyNotFound' })
    const EmptyContactNameMessage = intl.formatMessage({ id: 'errors.import.IncorrectContactName.empty' })
    const ContactNameWithSpecialCharactersMessage = intl.formatMessage({ id: 'errors.import.IncorrectContactName.hasSpecialCharacters' })
    const IncorrectUnitNameMessage = intl.formatMessage({ id: 'errors.import.EmptyUnitName' })
    const IncorrectUnitTypeMessage = intl.formatMessage({ id: 'errors.import.EmptyUnitType' })
    const IncorrectEmailMessage = intl.formatMessage({ id: 'errors.import.IncorrectEmailFormat' })
    const IncorrectPhonesMessage = intl.formatMessage({ id: 'errors.import.IncorrectPhonesFormat' })
    const AlreadyCreatedContactMessage = intl.formatMessage({ id: 'errors.import.AlreadyCreatedContact' })
    const AddressTitle = intl.formatMessage({ id: 'contact.import.column.Address' })
    const UnitTitle = intl.formatMessage({ id: 'contact.import.column.Unit' })
    const PhoneTitle = intl.formatMessage({ id: 'contact.import.column.Phone' })
    const NameTitle = intl.formatMessage({ id: 'contact.import.column.Name' })
    const EmailTitle = intl.formatMessage({ id: 'contact.import.column.Email' })
    const RoleTitle = intl.formatMessage({ id: 'contact.import.column.Role' })
    const UnitTypeTitle = intl.formatMessage({ id: 'contact.import.column.UnitType' })
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

    const UNIT_TYPE_TRANSLATION_TO_TYPE = {
        [FlatUnitTypeValue.toLowerCase()]: FLAT_UNIT_TYPE,
        [ParkingUnitTypeValue.toLowerCase()]: PARKING_UNIT_TYPE,
        [ApartmentUnitTypeValue.toLowerCase()]: APARTMENT_UNIT_TYPE,
        [WarehouseUnitTypeValue.toLowerCase()]: WAREHOUSE_UNIT_TYPE,
        [CommercialUnitTypeValue.toLowerCase()]: COMMERCIAL_UNIT_TYPE,
    }

    const contactNormalizer: RowNormalizer = async (row) => {
        if (row.length !== columns.length) return { row }
        const addons = {
            address: null,
            property: null,
            phones: null,
            name: null,
            email: null,
            unitType: null,
            role: null,
        }
        const [address, , unitType, phones, name, email, role] = row

        const trimmedEmailValue = String(email?.value ?? '').trim()
        const trimmedUnitType = String(unitType?.value ?? '').trim().toLowerCase()

        const roleValue = role?.value
        if (roleValue) {
            addons.role = String(roleValue).trim().toLowerCase()
        }

        addons.email = normalizeEmail(trimmedEmailValue) || null
        addons.unitType = UNIT_TYPE_TRANSLATION_TO_TYPE[trimmedUnitType] || null
        addons.phones = parsePhones(String(phones.value))
        addons.name = String(name?.value ?? '').trim()

        const suggestionOptions = await addressApi.getSuggestions(String(address.value))
        const suggestion = suggestionOptions?.suggestions?.[0]

        if (!suggestion) return { row, addons }

        addons.address = suggestion.value
        const properties = await searchProperty(client, {
            address: suggestion.value,
            organization: { id: userOrganizationIdRef.current },
        }, undefined)
        addons.property = properties.length > 0 ? properties[0].value : null

        return { row, addons }
    }

    const contactValidator: RowValidator = async (row) => {
        if (!row) return false
        const errors = []
        if (!row?.addons) errors.push(IncorrectRowFormatMessage)
        if (!row?.addons?.address) errors.push(AddressNotFoundMessage)

        const propertyId = row?.addons?.property
        if (!propertyId) errors.push(PropertyNotFoundMessage)

        const name = row?.addons?.name
        if (!name) {
            errors.push(EmptyContactNameMessage)
        } else if (SPECIAL_CHAR_REGEXP.test(name)) {
            errors.push(ContactNameWithSpecialCharactersMessage)
        }

        const rowEmail = row?.row?.[5]?.value ?? ''
        if (rowEmail && !row?.addons?.email) {
            errors.push(IncorrectEmailMessage)
        }

        const unitName = row?.row?.[1]?.value ?? ''
        if (!unitName || String(unitName).trim().length === 0) errors.push(IncorrectUnitNameMessage)

        const unitType = row?.addons?.unitType ?? ''
        if (!unitType || String(unitType).trim().length === 0) errors.push(IncorrectUnitTypeMessage)

        const phones = (row?.addons?.phones ?? []).filter(Boolean)
        if (!phones || phones.length === 0) errors.push(IncorrectPhonesMessage)

        const contactRoleName = String(row?.addons?.role ?? '').trim().toLowerCase()
        if (contactRoleName) {
            const contactRoleId = rolesNameToIdMapping?.[contactRoleName]
            if (!contactRoleId) {
                // The roles list loading asynchronously, so this message should build dynamically
                errors.push(intl.formatMessage({ id: 'errors.import.IncorrectContactRole' }, { rolesList: Object.keys(rolesNameToIdMapping).join(', ') }))
            }
        }

        if (propertyId && unitName && unitType) {
            const { data } = await searchContacts(client, {
                organizationId: userOrganizationIdRef.current,
                propertyId,
                unitName,
                unitType,
            })

            const alreadyCreated = data.objs.some(contact => phones.includes(contact.phone))

            if (alreadyCreated) errors.push(AlreadyCreatedContactMessage)
        }

        if (errors.length) {
            row.errors = errors
            return false
        }

        return true
    }

    const contactCreator: ObjectCreator = async (row) => {
        if (!row) return
        const unitName = String(row?.row?.[1]?.value).trim()
        const splitPhones = String(row.row[3].value).split(SPLIT_PATTERN)
        const inValidPhones = []
        const phonesWithErrorCreations = []

        const phoneCount = row.addons.phones.length
        for (let i = 0; i < phoneCount; i++) {
            const phone: string = row.addons.phones[i]
            if (!phone && i < splitPhones.length) {
                inValidPhones.push(splitPhones[i])
                continue
            }

            const contactData: ContactCreateInput = {
                organization: { connect: { id: userOrganizationIdRef.current } },
                property: { connect: { id: String(row.addons.property) } },
                unitName,
                unitType: row.addons.unitType,
                phone: phone,
                name: row.addons.name,
                email: row.addons.email,
                isVerified: isVerifiedRef.current,
            }

            const role = String(row?.addons?.role || '').trim().toLowerCase()

            if (role) {
                const roleId = rolesNameToIdMapping?.[role]
                if (roleId) {
                    contactData['role'] = { connect: { id: roleId } }
                }
            }

            try {
                await contactCreateAction(contactData)
            } catch (error) {
                phonesWithErrorCreations.push(phone)
            } finally {
                if (i < phoneCount - 1) {
                    // only 1 insert request per 1 second
                    await sleep(1000)
                }
            }
        }

        if (inValidPhones.length > 0 || phonesWithErrorCreations.length > 0) {
            // return in report only phones which was not created
            const returnedPhones = [...phonesWithErrorCreations, ...inValidPhones].join('; ')
            const errors = []
            if (inValidPhones.length > 0) {
                errors.push(intl.formatMessage({ id: 'errors.import.IncorrectPhoneNumbersFormat' }, { phones: inValidPhones.join('; ') }))
            }
            if (phonesWithErrorCreations.length > 0) {
                errors.push(intl.formatMessage({ id: 'errors.import.CannotCreateContactsWithPhones' }, { phones: phonesWithErrorCreations.join('; ') }))
            }
            row.row[3].value = returnedPhones
            row.originalRow[3].value = returnedPhones
            row.errors = errors
            row.shouldBeReported = true
        }
    }

    return [columns, contactNormalizer, contactValidator, contactCreator]
}
