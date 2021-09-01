import { useOrganization } from '@core/next/organization'
import { useApolloClient } from '@core/next/apollo'
import { useAddressApi } from '../../common/components/AddressApi'
import get from 'lodash/get'
import { Property } from '../utils/clientSchema'
import { searchProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import { MapEdit } from '../components/panels/Builder/MapConstructor'
import { BuildingMapEntity } from '../../../schema'
import { TableRow, Columns, RowNormalizer, RowValidator, ObjectCreator } from '@condo/domains/common/utils/importer'

const createPropertyUnitsMap = (units, sections, floors) => {
    const unitsOnFloor = Math.floor(units / (floors * sections))
    if (!unitsOnFloor) {
        return
    }

    const propertyUnitsMap = {
        dv: 1,
        type: BuildingMapEntity.Building,
        sections: [],
    }

    const mapEditor = new MapEdit(propertyUnitsMap)

    for (let currentSection = 0; currentSection < sections; currentSection++) {
        const name = `№${currentSection + 1}`
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
    const userOrganization = useOrganization()
    const client = useApolloClient()
    const { addressApi } = useAddressApi()

    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const createPropertyAction = Property.useCreate({
        organization: userOrganizationId,
    }, () => Promise.resolve())

    const columns: Columns = [
        { name: 'address', type: 'string', required: true },
        { name: 'units', type: 'number', required: true },
        { name: 'sections', type: 'number', required: true },
        { name: 'floors', type: 'number', required: true },
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
        const address = get(row.addons, ['suggestion', 'value'])
        if (!address) return Promise.resolve(false)
        const where = {
            address: address,
            organization: { id: userOrganizationId },
        }
        return searchProperty(client, where, undefined)
            .then((res) => {
                return res.length === 0
            })
    }

    const propertyCreator: ObjectCreator = (row) => {
        if (!row) return Promise.resolve()
        const [, units, sections, floors] = row.row
        const property = get(row.addons, ['suggestion'])
        const value = get(property, 'value')
        const map = createPropertyUnitsMap(units.value, sections.value, floors.value)
        return createPropertyAction({
            // @ts-ignore
            dv: 1,
            type: 'building',
            name: String(value),
            address: String(value),
            addressMeta: { ...property, dv: 1 },
            map,
        })
    }

    return [columns, propertyNormalizer, propertyValidator, propertyCreator]
}