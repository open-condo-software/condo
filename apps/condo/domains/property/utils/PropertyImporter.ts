/*
* Accepts an excel file as input
* Parses it column by column
* Validates address
* Normalizes address
* Checks the uniqueness of the address
* Generates a checkerboard according to the specified parameters (If there are no parameters, it substitutes the default markup)
* Creates an object
* */
import isEqual from 'lodash/isEqual'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import { Scalars } from '../../../schema'
import { AddressApi, IAddressApi } from '../../common/utils/addressApi'
import { MapEdit, MapTypesList, BuildingSection } from '../components/panels/Builder/MapConstructor'

type TableRow = Array<Record<'value', string | number>>

type IBuildingMap = {
    dv: number,
    type: MapTypesList,
    sections: Array<BuildingSection>
}

export type ProgressUpdateHandler = (progress: number) => void
export type FinishHandler = () => void
export type ErrorHandler = (error: Error) => void

interface IPropertyImporter {
    import: (data: Array<TableRow>) => Promise<void>
    onProgressUpdate: (handleProgressUpdate: ProgressUpdateHandler) => void
    onFinish: (handleFinish: FinishHandler) => void
    onError: (handleError: ErrorHandler) => void
    break: () => void
}

export class PropertyImporter implements IPropertyImporter {
    constructor (
        // TODO(Dimitreee): remove any
        private propertyCreator: (...args: any) => Promise<any>,
        private propertyValidator: (address: string) => Promise<boolean>,
        private addressApi: IAddressApi,
    ) {}

    // TODO(Dimitreee): remove any
    public import (data: Array<TableRow>): Promise<any> {
        this.tableData = data
        const [columns, ...body] = this.tableData

        if (!this.isColumnsValid(columns)) {
            this.errorHandler(new Error())

            return
        }

        return this.createPropertyRecord(cloneDeep(body)).catch(e => {
            this.errorHandler(e)
        })
    }

    public onProgressUpdate (handleProgressUpdate: ProgressUpdateHandler): void {
        this.progressUpdateHandler = handleProgressUpdate
    }

    public break = () => {
        this.breakImport = true
    }

    public onFinish (handleFinish: FinishHandler): void {
        this.finishHandler = handleFinish
    }

    public onError (handleError: ErrorHandler): void {
        this.errorHandler = handleError
    }

    private async createPropertyRecord (table, index = 0) {
        if (this.breakImport) {
            return Promise.resolve()
        }

        if (!table.length) {
            this.updateProgress(100)
            this.finishHandler()

            return Promise.resolve()
        }

        const row = table.shift()

        if (!this.isRowValid(row)) {
            return this.createPropertyRecord(table, index++)
        }

        const [address, units, sections, floors] = row

        return this.addressApi
            .getSuggestions(String(address.value))
            .then((result) => {
                const suggestion = get(result, ['suggestions', 0])

                if (suggestion) {
                    const map = this.createPropertyUnitsMap(units.value, sections.value, floors.value)

                    return this.addProperty(suggestion, map)
                }

                return Promise.resolve()
            })
            .then(() => {
                return sleep(300)
            })
            .then(() => {
                return this.createPropertyRecord(table, index++)
            })
            .catch(e => {
                this.errorHandler(e)
            })
    }

    private addProperty (property, map: Scalars['JSON']) {
        return this.validateAddress(property.value)
            .then((isPropertyValid) => {
                if (isPropertyValid) {
                    const { value } = property

                    return this.propertyCreator({
                        dv: 1,
                        type: 'building',
                        name: value,
                        address: value,
                        addressMeta: { ...property, dv: 1 },
                        map,
                    })
                }

                return Promise.resolve()
            }).then(() => {
                this.updateProgress()
            })
    }

    private isColumnsValid (row: TableRow): boolean {
        const validColumns = ['address', 'units', 'sections', 'floors']
        const normalizedTableColumns = row.map(({ value }) => {
            if (typeof value === 'string') {
                return value.toLowerCase()
            }
        })

        // excel table columns validation
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

    private updateProgress (value?: number) {
        if (value) {
            this.progress.current = value
        } else {
            const step = 100 / (this.tableData.length - 1)
            const nextProgress = this.progress.current + step

            if (nextProgress < 100) {
                this.progress.current = nextProgress
            } else {
                this.progress.current = 100
            }
        }

        this.progressUpdateHandler(this.progress.current)
    }

    private validateAddress (address: string): Promise<boolean> {
        return this.propertyValidator(address)
    }

    private createPropertyUnitsMap (units: number, sections: number, floors: number): IBuildingMap {
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

    private progress = {
        min: 0,
        max: 100,
        current: 0,
    }
    private tableData: Array<TableRow> = []
    private progressUpdateHandler: ProgressUpdateHandler
    private finishHandler: FinishHandler
    private errorHandler: ErrorHandler
    private breakImport = false
}

function sleep (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
