import { useOrganization } from '@core/next/organization'
import { useApolloClient } from '@core/next/apollo'
import { useAddressApi } from '../../common/components/AddressApi'
import get from 'lodash/get'
import { Property } from '../utils/clientSchema'
import { searchProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import { MapEdit } from '../components/panels/Builder/MapConstructor'
import { BuildingMapType, PropertyTypeType } from '@app/condo/schema'
import { TableRow, Columns, RowNormalizer, RowValidator, ObjectCreator } from '@condo/domains/common/utils/importer'
import { useIntl } from '@core/next/intl'

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
    const PropertyDuplicateMessage = intl.formatMessage({ id: 'errors.import.PropertyDuplicate' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const UnitLabel = intl.formatMessage({ id: 'field.Unit' })
    const SectionLabel = intl.formatMessage({ id: 'field.Section' })
    const FloorLabel = intl.formatMessage({ id: 'field.Floor' })

    const userOrganization = useOrganization()
    const client = useApolloClient()
    const { addressApi } = useAddressApi()

    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const createPropertyAction = Property.useCreate({
        organization: { connect: { id: userOrganizationId } },
    })

    const columns: Columns = [
        { name: 'address', type: 'string', required: true, label: AddressLabel },
        { name: 'units', type: 'number', required: true, label: UnitLabel },
        { name: 'sections', type: 'number', required: true, label: SectionLabel },
        { name: 'floors', type: 'number', required: true, label: FloorLabel },
    ]

    const propertyNormalizer: RowNormalizer = (row: TableRow) => {
        const [address] = row
        return addressApi.getSuggestions(String(address.value)).then((result) => {
            const suggestion = get(result, ['suggestions', 0], null)
            return Promise.resolve({ row, addons: { suggestion } })
        })
    }

    const propertyValidator: RowValidator = (row) => {
        if (!row ) return Promise.resolve(false)
        const address = get(row, ['addons', 'suggestion', 'value'])
        if (!address) {
            row.errors = [AddressNotFoundMessage]
            return Promise.resolve(false)
        }

        const where = {
            address: address,
            organization: { id: userOrganizationId },
        }
        return searchProperty(client, where, undefined)
            .then((res) => {
                if (res.length > 0) {
                    row.errors = [PropertyDuplicateMessage]
                    return false
                }
                return true
            })
    }

    const propertyCreator: ObjectCreator = (row) => {
        if (!row) return Promise.resolve()
        const [, units, sections, floors] = row.row
        const property = get(row.addons, ['suggestion'])
        const value = get(property, 'value')
        const map = createPropertyUnitsMap(units.value, sections.value, floors.value)
        return createPropertyAction({
            dv: 1,
            type: PropertyTypeType.Building,
            name: String(value),
            address: String(value),
            addressMeta: { ...property, dv: 1 },
            map,
        })
    }

    return [columns, propertyNormalizer, propertyValidator, propertyCreator]
}
