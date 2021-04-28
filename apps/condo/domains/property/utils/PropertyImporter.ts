/*
* На вход принимает excel файл
* Разбирает его по столбцам
* Валидирует адрес
* Нормализует адрес
* Проверяет уникальность адреса
* Генерирует шахматку по заданным параметрам (Если параметров нет, подставляет дефолтную разметку)
* Создает объект
* */
import isEqual from 'lodash/isEqual'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import { Scalars } from '../../../schema'
import { DadataApi, IDadataApi } from '../../common/utils/dadataApi'
import { BDataSection, BDataTypes, createNewBBuildingSectionData } from './BBuildingData'

type TableRow = Array<Record<'value', string | number>>

type IBuildingMap = {
    dv: number,
    type: BDataTypes,
    sections: Array<BDataSection>
}


interface IPropertyImporter {
    import: (data: Array<TableRow>) => Promise<void>
}

export class PropertyImporter implements IPropertyImporter {
    constructor (private dadataApi: IDadataApi = new DadataApi() ) {
    }

    public import (data: Array<TableRow>): Promise<any> {
        const [columns, ...body] = data

        if (!this.isColumnsValid(columns)) {
            return
        }

        return this.normalizeAddress(cloneDeep(body))
    }

    private async normalizeAddress (table) {
        if (!table.length) {
            return Promise.resolve()
        }

        const row = table.shift()

        if (!this.isRowValid(row)) {
            return this.normalizeAddress(table)
        }

        const [address, units, sections, floors] = row

        return this.dadataApi
            .getSuggestions(String(address.value))
            .then(response => response.text())
            .then((result) => {
                const suggestion = get(JSON.parse(result), ['suggestions', 0])

                if (suggestion) {
                    const { value, data } = suggestion

                    return this.addProperty(value, data)
                }

                return Promise.resolve()
            }).then(() => {
                return sleep(300)
            }).then(() => {
                return this.normalizeAddress(table)
            })
    }

    private addProperty (value: string, addressMeta: Scalars['JSON']) {

        console.log('addProperty', value)

        // добавляет объект в базку

        return Promise.resolve()
    }

    private isColumnsValid (row: TableRow): boolean {
        const validColumns = ['address', 'units', 'sections', 'floors']
        const normalizedTableColumns = row.map(({ value }) => {
            if (typeof value === 'string') {
                return value.toLowerCase()
            }
        })

        // Проверяет корректность колонок файла
        return isEqual(validColumns, normalizedTableColumns)
    }

    private isRowValid (row: TableRow): boolean {
        const [address, units, sections, floors] = row

        return (
            typeof address.value === 'string' &&
            typeof units.value === 'number' &&
            typeof sections.value === 'number' &&
            typeof floors.value === 'number'
        )
    }

    private validateAddress (address: string): boolean {
        // ходит в апишку и проверяет все данные
        return true
    }

    private createPropertyUnitMap (units: number, sections: number, floors: number): IBuildingMap {
        const unitsPerFloor = Math.floor(units / (floors * sections))
        if (!unitsPerFloor) {
            return
        }
        // const unitsDelta = units - (unitsPerFloor * floors * sections)

        const propertyUnitsMap = {
            dv: 1,
            type: BDataTypes.Building,
            sections: [],
        }

        for (let currentSection = 0; currentSection < sections; currentSection++) {
            const sectionName = `Подъезд №${currentSection + 1}`
            const sectionData = createNewBBuildingSectionData({
                sectionName,
                unitsPerFloor,
                minFloor: 1,
                maxFloor: floors,
            })

            propertyUnitsMap.sections.push(sectionData)
        }

        // TODO: непонятно что делать с оставшимися после округления квартирами
        return propertyUnitsMap
    }

    private progress = {
        min: 0,
        max: 100,
        current: 0,
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}