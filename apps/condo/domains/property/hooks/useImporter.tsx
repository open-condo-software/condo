import { useCallback, useRef, useState } from 'react'
import { useOrganization } from '@core/next/organization'
import { useApolloClient } from '@core/next/apollo'
import { useAddressApi } from '../../common/components/AddressApi'
import get from 'lodash/get'
import { Property } from '../utils/clientSchema'
import { searchProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import { TableRow, ProcessedRow, Importer, ColumnInfo } from '@condo/domains/common/utils/Importer'
import { MapEdit, MapTypesList } from '../components/panels/Builder/MapConstructor'

export const useImporter = (onFinish, onError) => {
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(null)
    const [isImported, setIsImported] = useState(false)
    const userOrganization = useOrganization()
    const client = useApolloClient()
    const importer = useRef(null)
    const { addressApi } = useAddressApi()

    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const createPropertyAction = Property.useCreate({
        organization: userOrganizationId,
    }, () => Promise.resolve())

    const columns: Array<ColumnInfo> = [
        { name: 'address', type: 'string' },
        { name: 'units', type: 'number' },
        { name: 'sections', type: 'number' },
        { name: 'floors', type: 'number' },
    ]

    const propertyNormalizer = (row: TableRow) => {
        const [address] = row
        return addressApi.getSuggestions(String(address.value)).then((result) => {
            const suggestion = get(result, ['suggestions', 0])
            if (suggestion) {
                // TODO (savelevMatthew): Check for a building
                return { row, addons: { suggestion } }
            }
            return Promise.resolve(null)
        })
    }

    const propertyValidator = (row: ProcessedRow | null) => {
        if (!row) return Promise.resolve(false)
        const address = get(row.addons, ['suggestion', 'value'])
        const where = {
            address_contains_i: address,
            organization: { id: userOrganizationId },
        }
        return searchProperty(client, where, undefined)
            .then((res) => {
                return res.length === 0
            })
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const createPropertyUnitsMap = (units, sections, floors) => {
        const unitsOnFloor = Math.floor(units / (floors * sections))
        if (!unitsOnFloor) {
            return
        }

        const propertyUnitsMap = {
            dv: 1,
            type: MapTypesList.Building,
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

    const propertyCreator = (row: ProcessedRow | null) => {
        if (!row) return Promise.resolve()
        const [, units, sections, floors] = row.row
        const property = get(row.addons, ['suggestion'])
        const { value } = property
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

    const importData = useCallback((data) => {
        importer.current = null
        // reset hook state
        setIsImported(false)
        setError(null)
        setProgress(0)

        // @ts-ignore
        importer.current = new Importer(columns, propertyNormalizer, propertyValidator, propertyCreator)
        importer.current.onProgressUpdate(setProgress)
        importer.current.onError((e) => {
            importer.current = null
            setError(e)

            onError()
        })
        importer.current.onFinish(() => {
            importer.current = null
            setIsImported(true)

            onFinish()
        })
        importer.current.import(data)
    }, [])

    const breakImport = () => {
        if (importer) {
            importer.current.break()
        }
    }

    return [importData, progress, error, isImported, breakImport]
}