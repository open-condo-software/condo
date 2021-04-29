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
import { DadataApi, IDadataApi } from '../../common/utils/dadataApi'
import { BDataSection, BDataTypes, createNewBBuildingSectionData } from './BBuildingData'

type TableRow = Array<Record<'value', string | number>>

type IBuildingMap = {
    dv: number,
    type: BDataTypes,
    sections: Array<BDataSection>
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
        private dadataApi: IDadataApi = new DadataApi(),
    ) {}

    // TODO(Dimitreee): remove any
    public import (data: Array<TableRow>): Promise<any> {
        this.tableData = data
        const [columns, ...body] = this.tableData

        if (!this.isColumnsValid(columns)) {
            this.errorHandler(new Error('Таблица имеет некорректную структуру. Обратитесь к администратору за дополнительной информацией.'))

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

        return this.dadataApi
            .getSuggestions(String(address.value))
            .then((result) => {
                const suggestion = get(result, ['suggestions', 0])

                if (suggestion) {
                    return this.addProperty(suggestion)
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

    private addProperty (property) {
        return this.validateAddress(property.value)
            .then((isPropertyValid) => {
                if (isPropertyValid) {
                    const { value } = property

                    return this.propertyCreator({
                        type: 'building',
                        name: value,
                        dv: 1,
                        address: value,
                        addressMeta: property,
                    })
                }
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
    private tableData: Array<TableRow> = []
    private progressUpdateHandler: ProgressUpdateHandler
    private finishHandler: FinishHandler
    private errorHandler: ErrorHandler
    private breakImport = false
}

function sleep (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
