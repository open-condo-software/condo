const fill = require('lodash/fill')
const faker = require('faker')
const { loadRecordsAndConvertToFileRows } = require('./export')
const { catchErrorFrom } = require('@condo/domains/common/utils/testSchema')

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
    })
)

describe('export', async () => {
    const numberOfIterationsVsTotalRecords = [
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
            totalRecordsCount,
        }
        const context = mockContext()
        const taskServerUtils = mockServerUtilsFor(task)
        const loadRecordsBatch = mockLoadRecordsBatchFor(totalRecordsCount)
        const convertRecordToFileRow = mockConvertRecordToFileRow()

        await loadRecordsAndConvertToFileRows({
            context,
            loadRecordsBatch,
            convertRecordToFileRow,
            task,
            taskServerUtils,
        })

        expect(loadRecordsBatch.mock.calls.length).toBe(numberOfIterations)
        expect(convertRecordToFileRow.mock.calls.length).toBe(totalRecordsCount)
    })

    it('throws error when no records are to export', async () => {
        const totalRecordsCount = 0
        const task = {
            id: faker.datatype.uuid(),
            totalRecordsCount,
        }
        const context = mockContext()
        const taskServerUtils = mockServerUtilsFor(task)
        const loadRecordsBatch = mockLoadRecordsBatchFor(totalRecordsCount)
        const convertRecordToFileRow = mockConvertRecordToFileRow()

        await catchErrorFrom(async () => {
            await loadRecordsAndConvertToFileRows({
                context,
                loadRecordsBatch,
                convertRecordToFileRow,
                task,
                taskServerUtils,
            })
        }, (error) => {
            expect(error).toMatchObject({
                message: `No records to export for TestExportTask with id "${task.id}"`,
                extensions: {
                    code: 'BAD_USER_INPUT',
                    type: 'NOTHING_TO_EXPORT',
                    message: 'No records to export for {schema} with id "{id}"',
                    messageForUser: 'tasks.export.error.NOTHING_TO_EXPORT',
                },
            })
        })
    })
})