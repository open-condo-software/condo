/**
 * @jest-environment node
 */

const { faker } = require('@faker-js/faker')
const fill = require('lodash/fill')

const { exportRecordsAsCsvFile } = require('./export')

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

describe('export', () => {
    const numberOfIterationsVsTotalRecords = [
        // TODO(DOMA-5932, antonal): fix commented case
        // [1, 0],
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

        expect(loadRecordsBatch.mock.calls).toHaveLength(numberOfIterations)
        expect(convertRecordToFileRow.mock.calls).toHaveLength(totalRecordsCount)
    })
})