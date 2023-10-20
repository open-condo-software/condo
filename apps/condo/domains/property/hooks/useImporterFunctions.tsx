import { BuildingMapType, PropertyTypeType } from '@app/condo/schema'
import get from 'lodash/get'
import { useEffect, useRef } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { Columns, RowNormalizer, RowValidator, ObjectCreator } from '@condo/domains/common/utils/importer'
import { MapEdit } from '@condo/domains/property/components/panels/Builder/MapConstructor'
import { validHouseTypes } from '@condo/domains/property/constants/property'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { searchProperty } from '@condo/domains/ticket/utils/clientSchema/search'


const createPropertyUnitsMap = (units, sections, floors) => {
    const unitsOnFloor = Math.floor(units / (floors * sections))
    if (!unitsOnFloor) {
        return
    }

    const propertyUnitsMap = {
        dv: 1,
        type: BuildingMapType.Building,
        sections: [],
        parking: [],
    }

    const mapEditor = new MapEdit(propertyUnitsMap)

    for (let currentSection = 0; currentSection < sections; currentSection++) {
        const name = `${currentSection + 1}`
        mapEditor.addSection({
            name,
            unitsOnFloor,
            minFloor: 1,
            maxFloor: floors,
        })
    }

    // TODO(Dimitree): thing about rest flats
    return mapEditor.getMap()
}

export const useImporterFunctions = (): [Columns, RowNormalizer, RowValidator, ObjectCreator] => {
    const intl = useIntl()
    const AddressNotFoundMessage = intl.formatMessage({ id: 'errors.import.AddressNotFound' })
    const AddressValidationErrorMessage = intl.formatMessage({ id: 'pages.condo.property.warning.modal.AddressValidationErrorMsg' })
    const PropertyDuplicateMessage = intl.formatMessage({ id: 'errors.import.PropertyDuplicate' })
    const AddressLabel = intl.formatMessage({ id: 'property.import.column.Address' })
    const UnitLabel = intl.formatMessage({ id: 'property.import.column.Units' })
    const SectionLabel = intl.formatMessage({ id: 'property.import.column.Sections' })
    const FloorLabel = intl.formatMessage({ id: 'property.import.column.Floors' })

    const userOrganization = useOrganization()
    const client = useApolloClient()
    const { addressApi } = useAddressApi()

    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const userOrganizationIdRef = useRef(userOrganization.id)
    useEffect(() => {
        userOrganizationIdRef.current = userOrganizationId
    }, [userOrganizationId])

    const createPropertyAction = Property.useCreate({})

    const columns: Columns = [
        { name: AddressLabel, type: 'string', required: true },
        { name: UnitLabel, type: 'number', required: true },
        { name: SectionLabel, type: 'number', required: true },
        { name: FloorLabel, type: 'number', required: true },
    ]

    const propertyNormalizer: RowNormalizer = async (row) => {
        const addons = {
            suggestion: null,
            isHouse: null,
        }

        const [address] = row
        const suggestions = await addressApi.getSuggestions(String(address.value))

        let suggestion = get(suggestions, ['suggestions', 0], null)
        if (get(suggestion, 'value') !== get(address, 'value')) suggestion = null

        const suggestionType = get(suggestion, 'type')
        const houseTypeFull = get(suggestion, ['data', 'house_type_full'])

        addons.suggestion = suggestion
        addons.isHouse = suggestionType === 'building' || (houseTypeFull && validHouseTypes.includes(houseTypeFull))

        return { row, addons }
    }

    const propertyValidator: RowValidator = async (row) => {
        if (!row) return false
        const address = get(row, ['addons', 'suggestion', 'value'])
        const isHouse = get(row, ['addons', 'isHouse'])
        if (!address) {
            row.errors = [AddressNotFoundMessage]
            return false
        }

        if (!isHouse) {
            row.errors = [AddressValidationErrorMessage]
            return false
        }

        const where = {
            address: address,
            organization: { id: userOrganizationIdRef.current },
        }

        const properties = await searchProperty(client, where, undefined)

        if (properties.length > 0) {
            row.errors = [PropertyDuplicateMessage]
            return false
        }
        return true
    }

    const propertyCreator: ObjectCreator = async (row) => {
        if (!row) return
        const [, units, sections, floors] = row.row
        const property = get(row.addons, ['suggestion'])
        const value = get(property, 'value')
        const map = createPropertyUnitsMap(units.value, sections.value, floors.value)
        return await createPropertyAction({
            dv: 1,
            type: PropertyTypeType.Building,
            name: String(value),
            address: String(value),
            addressMeta: { ...property, dv: 1 },
            organization: { connect: { id: userOrganizationIdRef.current } },
            map,
        })
    }

    return [columns, propertyNormalizer, propertyValidator, propertyCreator]
}
