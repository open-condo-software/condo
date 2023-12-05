const Queue = require('bull')

const conf = require('@open-condo/config')

const { _internalGetExecutionContextAsyncLocalStorage } = require('./executionContext')
const { getLogger } = require('./logging')
const { prepareKeystoneExpressApp } = require('./prepareKeystoneApp')
const { getRedisClient } = require('./redis')
const { getRandomString } = require('./test.utils')

const TASK_TYPE = 'TASK'
const WORKER_CONCURRENCY = parseInt(conf.WORKER_CONCURRENCY || '2')
const IS_BUILD = conf['DATABASE_URL'] === 'undefined'
// NOTE: If this is True, all tasks will be executed in the node process with setTimeout.
const FAKE_WORKER_MODE = conf.TESTS_FAKE_WORKER_MODE
const logger = getLogger('worker')

const taskQueue = (IS_BUILD) ? undefined : new Queue('tasks', {
    /**
     * @param {'client' | 'subscriber' | 'bclient'} type
     * @return {import('ioredis')}
     */
    createClient: (type, opts) => {
        // NOTE(pahaz): https://github.com/OptimalBits/bull/issues/1873
        //   Bull uses three Redis connection. Probably, we can share regular Redis connection for type 'client' think about it!
        if (['bclient', 'subscriber'].includes(type)) {
            opts.maxRetriesPerRequest = null
        }
        return getRedisClient('worker', type, opts)
    },
})

const globalTaskOptions = {}
const TASKS = new Map()
const CRON_TASKS = new Map()
const REMOVE_CRON_TASKS = []
let isWorkerCreated = false

function createTask (name, fn, opts = {}) {
    if (typeof fn !== 'function') throw new Error('unsupported fn argument type. Function expected')
    if (!name) throw new Error('no name')

    if (TASKS.has(name)) throw new Error(`Task with name ${name} is already registered`)
    TASKS.set(name, fn)
    return createTaskWrapper(name, fn, opts)
}

function createCronTask (name, cron, fn, opts = {}) {
    if (typeof fn !== 'function') throw new Error('unsupported fn argument type. Function expected')
    if (!name) throw new Error('no name')
    if (!cron) throw new Error('no cron string')

    const taskOpts = { repeat: { cron }, ...opts }
    const task = createTask(name, fn, taskOpts)
    CRON_TASKS.set(name, taskOpts)
    return task
}

function removeCronTask (name, cron, opts = {}) {
    const taskOpts = { repeat: { cron }, ...opts }
    REMOVE_CRON_TASKS.push([name, taskOpts])
}

async function _scheduleRemoteTask (name, preparedArgs, preparedOpts) {
    logger.info({ msg: 'Scheduling task', name, data: { preparedArgs, preparedOpts } })
    const job = await taskQueue.add(name, { args: preparedArgs }, preparedOpts)
    return {
        id: String(job.id),
        getState: async () => {
            return await job.getState()
        },
        awaitResult: async () => {
            return await job.finished()
        },
    }
}

/**
 * Because Bull does not participates in case of execution tasks with `FAKE_WORKER_MODE`,
 * an instance of a job, that is passed to worker function should have the same
 * methods as in Bull.
 * This helps to avoid handling `FAKE_WORKER_MODE` in every custom worker function.
 * Ideally the interface should be exactly the same as in "Bull", but currently only `.progress`
 * method is used in worker functions. So, make it simple.
 */
class InProcessFakeJob {
    constructor (name) {
        this.name = name
        this.id = getRandomString()
    }
    progress (percent) {
        logger.info({ msg: 'Progress for task', id: this.id, name: this.name, progress: percent })
    }
}

async function _scheduleInProcessTask (name, preparedArgs, preparedOpts) {
    // NOTE: it's just for test purposes
    // similar to https://docs.celeryproject.org/en/3.1/configuration.html#celery-always-eager
    logger.info({ msg: 'Scheduling task', name, data: { preparedArgs, preparedOpts } })

    const job = new InProcessFakeJob(name)
    let error = undefined
    let result = undefined
    let status = 'processing'
    let executor = async function inProcessExecutor () {
        try {
            logger.info({ msg: 'Executing task', name, data: { preparedArgs, preparedOpts } })
            result = await executeTask(name, preparedArgs, job)
            status = 'completed'
            logger.info({ msg: 'Task result', name, status, data: { result, preparedArgs, preparedOpts } })
        } catch (e) {
            logger.error({ msg: 'Error executing task', name, error: e, data: { preparedArgs, preparedOpts } })
            status = 'error'
            error = e
        }
    }

    setTimeout(executor, 1)

    return {
        id: job.id,
        getState: async () => { return Promise.resolve(status) },
        awaitResult: async () => {
            return new Promise((res, rej) => {
                const handler = setInterval(() => {
                    if (status === 'completed') {
                        clearInterval(handler)
                        res(result)
                    } else if (status === 'error') {
                        clearInterval(handler)
                        rej(error)
                    }
                }, 120)
            })
        },
    }
}

/**
 * Internal function! please don't use it directly! Use `task.delay(..)`
 * @deprecated for any external usage!
 */
async function scheduleTaskByNameWithArgsAndOpts (name, args, opts = {}) {
    if (typeof name !== 'string' || !name) throw new Error('task name invalid or empty')
    if (!isSerializable(args)) throw new Error('task args is not serializable')

    const preparedArgs = createSerializableCopy([...args])
    const preparedOpts = {
        ...globalTaskOptions,
        ...opts,
    }

    if (FAKE_WORKER_MODE) {
        return await _scheduleInProcessTask(name, preparedArgs, preparedOpts)
    }

    return await _scheduleRemoteTask(name, preparedArgs, preparedOpts)
}

function createTaskWrapper (name, fn, defaultTaskOptions = {}) {
    async function applyAsync (args, taskOptions) {
        const preparedOpts = {
            ...globalTaskOptions,
            ...defaultTaskOptions,
            ...taskOptions,
        }

        return await scheduleTaskByNameWithArgsAndOpts(name, args, preparedOpts)
    }

    async function delay () {
        return await applyAsync([...arguments])
    }

    function errorTaskCallPrevent () {
        throw new Error('This function is converted to a task, and you need to use fn.delay(...) to call the tasks')
    }

    if (fn.delay || fn.applyAsync) throw new Error('You trying to create two tasks for one function! You MUST use one function only for one task!')

    fn.delay = delay
    fn.applyAsync = applyAsync
    errorTaskCallPrevent.delay = delay
    errorTaskCallPrevent.applyAsync = applyAsync
    errorTaskCallPrevent._type = TASK_TYPE
    delay.fn = fn
    applyAsync.fn = fn
    return errorTaskCallPrevent
}

function registerTasks (modulesList) {
    modulesList.forEach(
        (module) => {
            Object.values(module).forEach(
                (task) => {
                    if (task._type !== TASK_TYPE) {
                        console.error(task)
                        throw new Error('Wrong task module export format! What\'s this? You should wrap everything by createTask()')
                    }
                })
        })
}

function createSerializableCopy (data) {
    return JSON.parse(JSON.stringify(data))
}

function isSerializable (data) {
    try {
        JSON.stringify(data)
        return true
    } catch (e) {
        return false
    }
}

function executeTask (name, args, job = null) {
    // Since executeTask is synchronous we should use enterWith:
    // From the docs:
    // Transitions into the context for the remainder of the current synchronous execution and then persists the store through any following asynchronous calls.
    _internalGetExecutionContextAsyncLocalStorage().enterWith({ taskId: job.id, taskName: job.name })

    if (!TASKS.has(name)) throw new Error(`executeTask: Unknown task name ${name}`)
    if (!isSerializable(args)) throw new Error('executeTask: args is not serializable')

    const fn = TASKS.get(name)
    const result = fn.apply(job, args)

    return result
}

function getTaskLoggingContext (job) {
    const jobData = job.toJSON()
    if (typeof jobData.data !== 'undefined') jobData.data = JSON.stringify(jobData.data)
    if (typeof jobData.returnvalue !== 'undefined') jobData.returnvalue = JSON.stringify(jobData.returnvalue)
    return jobData
}

async function createWorker (keystoneModule) {
    // NOTE: we should have only one worker per node process!
    if (isWorkerCreated) {
        logger.warn('Call createWorker() more than one time! (ignored)')
        return
    } else {
        isWorkerCreated = true
        logger.info('Creating worker process')
    }

    // we needed to prepare keystone to use it inside tasks logic!
    if (keystoneModule) {
        await prepareKeystoneExpressApp(keystoneModule)
    } else {
        logger.warn('Keystone APP context is not prepared! You can\'t use Keystone GQL query inside the tasks!')
    }

    taskQueue.process('*', WORKER_CONCURRENCY, async function (job) {
        logger.info({ taskId: job.id, status: 'processing', task: getTaskLoggingContext(job) })
        try {
            return await executeTask(job.name, job.data.args, job)
        } catch (error) {
            logger.error({ taskId: job.id, status: 'error', error, task: getTaskLoggingContext(job) })
            throw error
        }
    })

    taskQueue.on('failed', function (job) {
        logger.info({ taskId: job.id, status: 'failed', task: getTaskLoggingContext(job) })
    })

    taskQueue.on('completed', function (job) {
        logger.info({ taskId: job.id, status: 'completed', task: getTaskLoggingContext(job), t0: job.finishedOn - job.timestamp, t1: job.processedOn - job.timestamp, t2: job.finishedOn - job.processedOn })
    })

    await taskQueue.isReady()
    logger.info('Worker: ready to work!')
    const cronTasksNames = [...CRON_TASKS.keys()]
    if (cronTasksNames.length > 0) {
        logger.info({ msg: 'Worker: add repeatable tasks!', names: cronTasksNames })
        cronTasksNames.forEach((name) => {
            const fn = TASKS.get(name)
            fn.delay()
        })
    }
    const removeTasksNames = REMOVE_CRON_TASKS.map(x => x[0])
    if (removeTasksNames.length > 0) {
        logger.info({ msg: 'Worker: remove tasks!', names: removeTasksNames })
        REMOVE_CRON_TASKS.forEach(([name, opts]) => {
            taskQueue.removeRepeatable(name, opts.repeat)
        })
    }
}

module.exports = {
    taskQueue,
    createTask,
    createCronTask,
    removeCronTask,
    registerTasks,
    createWorker,
    scheduleTaskByNameWithArgsAndOpts,
}
