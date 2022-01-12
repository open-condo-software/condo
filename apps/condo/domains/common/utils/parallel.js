/**
 * Executes an array of async functions in a sequence.
 * Useful when we need to:
 * 1. Await for some operations in each processing, for example, network requests
 * 2. Log one task processing, that another.
 * When we will use `Promise.all(items.map(process))`, than `process` functions will be
 * executed in parallel in log will produce unordered flow of records for
 * all of the tasks and we will be unable to figure out, for which processed task
 * a particular log record belongs
 * @example
 * const getRecord = (id) =>
 *     new Promise((resolve) => {
 *         setTimeout(() => {
 *             console.log(`record(id=${id})`)
 *             resolve(id)
 *         }, 1000)
 *     })
 * const ids = [1, 2, 3, 4, 5]
 * const getRecordTasks = ids.map((id) => () => getRecord(id))
 * executeInSequence(getRecordTasks).then(() => {
 *     console.log("end")
 * })
 * @param tasks
 * @return {Promise<unknown>}
 */
const executeInSequence = async (tasks) =>
    new Promise((resolve) => {
        const starterPromise = Promise.resolve(null)
        tasks.reduce((prevTask, nextTask) => prevTask.then(nextTask), starterPromise).then(resolve)
    })

const processArrayOf = (items) => ({
    inSequenceWith: (func) => {
        const itemTasks = items.map((item) => () => func(item))
        return executeInSequence(itemTasks)
    },
    inParallelWith: (func) => {
        return Promise.all(items.map((item) => func(item)))
    },
})

module.exports = {
    executeInSequence,
    processArrayOf,
}
