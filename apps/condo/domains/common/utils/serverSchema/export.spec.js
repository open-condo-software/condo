/**
 * @jest-environment node
 */

const faker = require('faker')
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
    beforeAll(() => {
        console.debug('>>> Node ', process.version)
    })
    const numberOfIterationsVsTotalRecords = [
        // TODO(DOMA-5932, antonal): fix commented case
        // Any next test case after case `[1, 0]` will be failed because of strange race condition
        // A `filename` variable in `exportRecordsAsCsvFile` function seems to have a value of this case in next test case
        // This leads to following error:
        // > Error: ENOENT: no such file or directory, open '/var/folders/5g/1_1gv14n7y55cfw182lby3640000gn/T/8af5c380a4a8.csv'
        [1, 0],

        // If executed after `[1, 0]`, the `filename` variable in `exportRecordsAsCsvFile` will have the same value `...8af5c380a4a8.csv` as in test case `[1, 0]`
        [1, 1],

        // TODO(antonal): Uncomment all cases below that was commented to focus on error investigation
        // [1, 99],
        // [1, 100],
        // [2, 101],
        // [2, 199],
        // [2, 200],
        // [3, 201],
    ]

    test.each(numberOfIterationsVsTotalRecords)('takes %i iteration(s) when total records is %i', async (numberOfIterations, totalRecordsCount) => {
        console.debug('>>> Node ', process.version)
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