const { executeInSequence, processArrayOf } = require('./parallel')

describe('parallel', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('executeInSequence', () => {
        it('executes async functions in array one after completing another', async (done) => {
            const records = []
            const pushRecord = (id) =>
                new Promise((resolve) => {
                    setTimeout(() => {
                        records.push(id)
                        resolve()
                    }, 500)
                })
            const ids = [1, 2, 3, 4, 5]
            const pushRecordTasks = ids.map((id) => () => pushRecord(id))
            executeInSequence(pushRecordTasks)
            setTimeout(() => {
                expect(records).toHaveLength(1)
            }, 600)
            setTimeout(() => {
                expect(records).toHaveLength(2)
            }, 1200)
            setTimeout(() => {
                expect(records).toHaveLength(3)
            }, 1800)
            setTimeout(() => {
                expect(records).toHaveLength(4)
            }, 2400)
            setTimeout(() => {
                expect(records).toHaveLength(5)
                done()
            }, 3000)
        })
    })

    describe('processArrayOf', () => {
        it('can process items in sequence', async (done) => {
            const records = []
            const pushRecord = (id) =>
                new Promise((resolve) => {
                    setTimeout(() => {
                        records.push(id)
                        resolve()
                    }, 500)
                })
            const ids = [1, 2, 3, 4, 5]
            processArrayOf(ids).inSequenceWith(pushRecord)
            setTimeout(() => {
                expect(records).toHaveLength(1)
            }, 600)
            setTimeout(() => {
                expect(records).toHaveLength(2)
            }, 1200)
            setTimeout(() => {
                expect(records).toHaveLength(3)
            }, 1800)
            setTimeout(() => {
                expect(records).toHaveLength(4)
            }, 2400)
            setTimeout(() => {
                expect(records).toHaveLength(5)
                done()
            }, 3000)
        })

        it('can process items in parallel', async (done) => {
            const records = []
            const pushRecord = (id) =>
                new Promise((resolve) => {
                    setTimeout(() => {
                        records.push(id)
                        resolve()
                    }, 500)
                })
            const ids = [1, 2, 3, 4, 5]
            processArrayOf(ids).inParallelWith(pushRecord)
            setTimeout(() => {
                expect(records).toHaveLength(5)
                done()
            }, 600)
        })
    })
})