import { Columns, ObjectCreator, RowNormalizer, RowValidator } from '@condo/domains/common/utils/importer'
import { useOrganization } from '@core/next/organization'
import { useApolloClient } from '@core/next/apollo'
import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import get from 'lodash/get'
import { Contact } from '../utils/clientSchema'
import { searchProperty, searchContacts } from '@condo/domains/ticket/utils/clientSchema/search'
import { useIntl } from '@core/next/intl'

const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')

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

export const useImporterFunctions = (): [Columns, RowNormalizer, RowValidator, ObjectCreator] => {
    const intl = useIntl()
    const IncorrectRowFormatMessage = intl.formatMessage({ id: 'errors.import.IncorrectRowFormat' })
    const AddressNotFoundMessage = intl.formatMessage({ id: 'errors.import.AddressNotFound' })
    const PropertyNotFoundMessage = intl.formatMessage({ id: 'errors.import.PropertyNotFound' })
    const IncorrectContactNameMessage = intl.formatMessage({ id: 'errors.import.IncorrectContactName' })
    const IncorrectUnitNameMessage = intl.formatMessage({ id: 'errors.import.EmptyUnitName' })
    const IncorrectEmailMessage = intl.formatMessage({ id: 'errors.import.IncorrectEmailFormat' })
    const IncorrectPhonesMessage = intl.formatMessage({ id: 'errors.import.IncorrectPhonesFormat' })
    const AlreadyCreatedContactMessage = intl.formatMessage({ id: 'errors.import.AlreadyCreatedContact' })
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const UnitTitle = intl.formatMessage({ id: 'field.Unit' })
    const PhoneTitle = intl.formatMessage({ id: 'Phone' })
    const NameTitle = intl.formatMessage({ id: 'field.FullName.short' })
    const EmailTitle = intl.formatMessage({ id: 'field.EMail' })

    const userOrganization = useOrganization()
    const client = useApolloClient()
    const { addressApi } = useAddressApi()

    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    // @ts-ignore
    const contactCreateAction = Contact.useCreate({},
        () => Promise.resolve())

    const columns: Columns = [
        { name: 'Address', type: 'string', required: true, label: AddressTitle },
        { name: 'Unit Name', type: 'string', required: true, label: UnitTitle },
        { name: 'Phones', type: 'string', required: true, label: PhoneTitle },
        { name: 'Full Name', type: 'string', required: true, label: NameTitle },
        { name: 'Email', type: 'string', required: false, label: EmailTitle },
    ]

    const contactNormalizer: RowNormalizer = (row) => {
        const addons = { address: null, property: null, phones: null, fullName: null, email: null }
        if (row.length !== columns.length) return Promise.resolve({ row })
        const [address, , phones, fullName, email] = row
        email.value = email.value && String(email.value).trim().length ? String(email.value).trim() : undefined
        return addressApi.getSuggestions(String(address.value)).then(result => {
            const suggestion = get(result, ['suggestions', 0])
            if (suggestion) {
                addons.address = suggestion.value
                const where = {
                    address: suggestion.value,
                    organization: { id: userOrganizationId },
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

        const rowEmail = get(row, ['row', '4', 'value'])
        if (rowEmail && !get(row, ['addons', 'email'])) {
            errors.push(IncorrectEmailMessage)
        }

        const unitName = get(row, ['row', '1', 'value'], '')
        if (!unitName || String(unitName).trim().length === 0) errors.push(IncorrectUnitNameMessage)

        const phones = get(row, ['addons', 'phones'], []).filter(Boolean)
        if (!phones || phones.length === 0) errors.push(IncorrectPhonesMessage)

        const { data } = await searchContacts(client, {
            organizationId: userOrganizationId,
            propertyId: row.addons.property,
            unitName,
        })
        const alreadyCreated = data.objs.some(contact => phones.includes(contact.phone) && contact.name === row.addons.fullName)

        if (alreadyCreated) errors.push(AlreadyCreatedContactMessage)

        if (errors.length) {
            row.errors = errors
            return Promise.resolve(false)
        }

        return Promise.resolve(true)
    }

    const contactCreator: ObjectCreator = (row) => {
        if (!row) return Promise.resolve()
        const unitName = String(get(row.row, ['1', 'value'])).trim().toLowerCase()
        const contactPool = []
        const splitPhones = String(row.row[2].value).split(SPLIT_PATTERN)
        const inValidPhones = []

        for (let i = 0; i < row.addons.phones.length; i++) {
            const phone: string = row.addons.phones[i]
            if (!phone && i < splitPhones.length) {
                inValidPhones.push(splitPhones[i])
                continue
            }
            contactPool.push(
                contactCreateAction({
                    organization: String(userOrganizationId),
                    property: String(row.addons.property),
                    unitName,
                    phone: phone,
                    name: row.addons.fullName,
                    email: row.addons.email,
                })
            )
        }
        return Promise.all(contactPool).then(() => {
            if (inValidPhones.length > 0) {
                row.row[2].value = inValidPhones.join('; ')
                row.shouldBeReported = true
            }
        })
    }

    return [columns, contactNormalizer, contactValidator, contactCreator]
}
