import get from 'lodash/get'

import { Importer, ObjectCreator, RowValidator, RowNormalizer, Columns, TableRow, ProcessedRow, ImporterErrorMessages } from './importer'

const bypassNormalizer: RowNormalizer = (row) => {
    return Promise.resolve({ row })
}
const addonNormalizer: RowNormalizer = (row) => {
    return Promise.resolve({ row, addons: { name: `${row[0].value}${row[0].value}` } })
}
const bypassValidator: RowValidator =  (row) => {
    if (!row) return Promise.resolve(false)
    return Promise.resolve(true)
}
const checkAddonValidator: RowValidator = (row) => {
    if (!row || !row.addons) return Promise.resolve(false)
    return Promise.resolve(true)
}
const oddRowPassValidator: RowValidator =  (row) => {
    if (!row || get(row.row, ['0', 'value']) % 2 !== 0) {
        return Promise.resolve(false)
    }
    return Promise.resolve(true)
}
const getFakeCreator: (storage: Array<ProcessedRow | null>) => ObjectCreator = (storage) => {
    const fakeCreator: ObjectCreator = (row) => {
        return new Promise<void>((resolve) => {
            if (row) storage.push(get(row.row, ['0', 'value']))
            resolve()
        })
    }
    return fakeCreator
}

const defaultErrors: ImporterErrorMessages = {
    tooManyRows: { message: 'too many rows' },
    invalidColumns: { message: 'invalid columns' },
    invalidTypes: { message: 'invalid types' },
    normalization: { message: 'Normalization error' },
    validation: { message: 'Validation error' },
    creation: { message: 'Creation error' },
    emptyRows: { message: 'Empty rows' },
}

const testColumns: Columns = [
    { name: 'id', type: 'number', required: true },
    { name: 'stringColumn', type: 'string', required: true },
]
const generateTableRow: (id: number, value: string) => TableRow = (id, value) => {
    return [
        { value: id },
        { value },
    ]
}
const generateTable = (rows: number) => {
    const headers: TableRow = [
        { value: 'id' },
        { value: 'stringColumn' },
    ]
    const table: Array<TableRow> = []
    table.push(headers)
    for (let i = 0; i < rows; i++) {
        table.push(generateTableRow(i, `${i + 1} row`))
    }
    return table
}

const TEST_SLEEP_TIME = 5

describe('importer tests', () => {
    describe('importer should work', () => {
        it('with no validation and no processing', async () => {
            const result = []
            let importerError
            let finished = false
            const fakeCreator = getFakeCreator(result)
            const importer = new Importer(testColumns, bypassNormalizer, bypassValidator, fakeCreator, defaultErrors, {}, TEST_SLEEP_TIME, 100, 0)
            importer.onError((error) => {
                importerError = error
            })
            importer.onFinish(() => {
                finished = true
            })

            const tableLength = 5
            const table = generateTable(tableLength)
            const expectedResult = []
            for (let i = 0; i < tableLength; i++) {
                expectedResult.push(i)
            }
            await importer.import(table)

            expect(importerError).toBeUndefined()
            expect(finished).toEqual(true)
            expect(result).toHaveLength(tableLength)
            expect(result).toStrictEqual(expectedResult)
        })
        it('with additional row validation', async () => {
            const result = []
            let importerError
            let finished = false
            const fakeCreator = getFakeCreator(result)
            const importer = new Importer(testColumns, bypassNormalizer, oddRowPassValidator, fakeCreator, defaultErrors, {}, TEST_SLEEP_TIME, 100, 0)
            importer.onError((error) => {
                importerError = error
            })
            importer.onFinish(() => {
                finished = true
            })

            const tableLength = 6
            const table = generateTable(tableLength)
            const expectedResult = []
            for (let i = 0; i < tableLength; i++) {
                if (i % 2 === 0) expectedResult.push(i)
            }
            await importer.import(table)

            expect(importerError).toBeUndefined()
            expect(finished).toEqual(true)
            expect(result).toHaveLength(tableLength / 2)
            expect(result).toStrictEqual(expectedResult)
        })
        it('with additional preprocessor', async () => {
            const result = []
            let importerError
            let finished = false
            const fakeCreator = getFakeCreator(result)
            const importer = new Importer(testColumns, addonNormalizer, checkAddonValidator, fakeCreator, defaultErrors, {}, TEST_SLEEP_TIME, 100, 0)
            importer.onError((error) => {
                importerError = error
            })
            importer.onFinish(() => {
                finished = true
            })

            const tableLength = 6
            const table = generateTable(tableLength)
            const expectedResult = []
            for (let i = 0; i < tableLength; i++) {
                expectedResult.push(i)
            }
            await importer.import(table)

            expect(importerError).toBeUndefined()
            expect(finished).toEqual(true)
            expect(result).toHaveLength(tableLength)
            expect(result).toStrictEqual(expectedResult)
        })
    })
    describe('should handle errors', () => {
        it('with empty data', async () => {
            const result = []
            let importerError
            let finished = false
            const fakeCreator = getFakeCreator(result)
            const importer = new Importer(testColumns, bypassNormalizer, bypassValidator, fakeCreator, defaultErrors, {}, TEST_SLEEP_TIME, 100, 0)
            importer.onError((error) => {
                importerError = error
            })
            importer.onFinish(() => {
                finished = true
            })

            const tableLength = 0
            const table = generateTable(tableLength)
            await importer.import(table)

            expect(importerError).toEqual(defaultErrors.emptyRows)
            expect(finished).toEqual(false)
            expect(result).toStrictEqual([])
        })
        it('when columns don\'t match', async () => {
            const result = []
            let importerError
            let finished = false
            const fakeCreator = getFakeCreator(result)
            const importer = new Importer(testColumns, bypassNormalizer, bypassValidator, fakeCreator, defaultErrors, {}, TEST_SLEEP_TIME, 100, 0)
            importer.onError((error) => {
                importerError = error
            })
            importer.onFinish(() => {
                finished = true
            })

            const tableLength = 6
            const table = generateTable(tableLength)
            table[0][0].value = 'incorrect title'
            await importer.import(table)

            expect(importerError).toEqual(defaultErrors.invalidColumns)
            expect(finished).toEqual(false)
            expect(result).toStrictEqual([])
        })
        it('when no columns at all', async () => {
            const result = []
            let importerError
            let finished = false
            const fakeCreator = getFakeCreator(result)
            const importer = new Importer(testColumns, bypassNormalizer, bypassValidator, fakeCreator, defaultErrors, {}, TEST_SLEEP_TIME, 100, 0)
            importer.onError((error) => {
                importerError = error
            })
            importer.onFinish(() => {
                finished = true
            })
            const table = []
            await importer.import(table)

            expect(importerError).toEqual(defaultErrors.invalidColumns)
            expect(finished).toEqual(false)
            expect(result).toStrictEqual([])
        })
        it('skip invalid rows', async () => {
            const result = []
            let importerError
            let finished = false
            const fakeCreator = getFakeCreator(result)
            const importer = new Importer(testColumns, bypassNormalizer, bypassValidator, fakeCreator, defaultErrors, {}, TEST_SLEEP_TIME, 100, 0)
            importer.onError((error) => {
                importerError = error
            })
            importer.onFinish(() => {
                finished = true
            })

            const tableLength = 6
            const brokenRow = 3
            const table = generateTable(tableLength)
            table[brokenRow][0].value = 'not integer'
            await importer.import(table)

            const expectedResult = []
            for (let i = 0; i < tableLength; i++) {
                if (i + 1 !== brokenRow) expectedResult.push(i)
            }

            expect(importerError).toBeUndefined()
            expect(finished).toEqual(true)
            expect(result).toHaveLength(tableLength - 1)
            expect(result).toStrictEqual(expectedResult)
        })
    })
    it('should not import after break', async () => {
        const result = []
        let importerError
        let finished = false
        const fakeCreator = getFakeCreator(result)
        const importer = new Importer(testColumns, bypassNormalizer, bypassValidator, fakeCreator, defaultErrors, {}, TEST_SLEEP_TIME, 100, 0)
        importer.onError((error) => {
            importerError = error
        })
        importer.onFinish(() => {
            finished = true
        })

        const tableLength = 5
        const table = generateTable(tableLength)
        const expectedResult = []
        for (let i = 0; i < tableLength; i++) {
            expectedResult.push(i)
        }
        await importer.import(table)

        expect(importerError).toBeUndefined()
        expect(finished).toEqual(true)
        expect(result).toHaveLength(tableLength)
        expect(result).toStrictEqual(expectedResult)
        importer.break()
        await importer.import(table)
        expect(importerError).toBeUndefined()
        expect(finished).toEqual(true)
        expect(result).toHaveLength(tableLength)
        expect(result).toStrictEqual(expectedResult)
    })
    it('should display progress correctly', async () => {
        const result = []
        let importerError
        let finished = false
        const fakeCreator = getFakeCreator(result)
        const progresses = []
        const expectedProgresses = [20, 40, 60, 80, 100, 100]
        const importer = new Importer(testColumns, bypassNormalizer, bypassValidator, fakeCreator, defaultErrors, {}, TEST_SLEEP_TIME, 100, 0)
        importer.onError((error) => {
            importerError = error
        })
        importer.onFinish(() => {
            finished = true
        })
        importer.onProgressUpdate((progress => {
            progresses.push(progress)
        }))

        const tableLength = 5
        const table = generateTable(tableLength)
        await importer.import(table)

        expect(importerError).toBeUndefined()
        expect(finished).toEqual(true)
        expect(result).toHaveLength(tableLength)
        expect(progresses).toStrictEqual(expectedProgresses)
    })
})