const fill = require('lodash/fill')
const faker = require('faker')
const { exportRecordsAsCsvFile, exportRecordsAsXlsxFile } = require('./export')

const mockContext = () => ({})

const mockServerUtilsFor = (task) => ({
    update: jest.fn((context, id, attrs) => Object.assign(task, attrs)),
    getOne: jest.fn(() => task),
    gql: {
        SINGULAR_FORM: 'TestExportTask',
    },
})

const mockLoadRecordsBatchFor = (totalRecordsCount) => (
    jest.fn((offset, limit) => (
        fill(Array(totalRecordsCount - offset), { name: 'A record to convert' }).slice(0, limit)
    ))
)

const mockConvertRecordToFileRow = () => (
    jest.fn((item) => {
        expect(item.name).toEqual('A record to convert')
        return item
    })
)

describe('export', async () => {
    const numberOfIterationsVsTotalRecords = [
        [1, 0],
        [1, 1],
        [1, 99],
        [1, 100],
        [2, 101],
        [2, 199],
        [2, 200],
        [3, 201],
    ]

    test.each(numberOfIterationsVsTotalRecords)('takes %i iteration(s) when total records is %i', async (numberOfIterations, totalRecordsCount) => {
        const task = {
            id: faker.datatype.uuid(),
            status: 'processing',
            totalRecordsCount,
        }
        const context = mockContext()
        const taskServerUtils = mockServerUtilsFor(task)
        const loadRecordsBatch = mockLoadRecordsBatchFor(totalRecordsCount)
        const convertRecordToFileRow = mockConvertRecordToFileRow()

        await exportRecordsAsCsvFile({
            context,
            loadRecordsBatch,
            convertRecordToFileRow,
            taskId: task.id,
            totalRecordsCount,
            taskServerUtils,
        })

        expect(loadRecordsBatch.mock.calls.length).toBe(numberOfIterations)
        expect(convertRecordToFileRow.mock.calls.length).toBe(totalRecordsCount)
    })
})