const Queue = require('bull')
const falsey = require('falsey')
const pino = require('pino')
const { serializeError } = require('serialize-error')
const IORedis = require('ioredis')

const conf = require('@core/config')
const { prepareKeystoneExpressApp } = require('./test.utils')

const TASK_TYPE = 'TASK'
const WORKER_CONCURRENCY = parseInt(conf.WORKER_CONCURRENCY || '2')
// NOTE: If this is True, all tasks will be executed locally by blocking until the task returns.
// Tasks will be executed locally instead of being sent to the queue.
const FAKE_WORKER_MODE = conf.FAKE_WORKER_MODE
const WORKER_REDIS_URL = conf.WORKER_REDIS_URL || conf.REDIS_URL
if (!WORKER_REDIS_URL) throw new Error('No WORKER_REDIS_URL environment')
const taskQueue = new Queue('tasks', WORKER_REDIS_URL, {
    createClient: (type, opts) => {
        return new IORedis(opts)
    },
})
// NOTE: same as keystone logger
const taskLogger = pino({ name: 'worker', enabled: falsey(process.env.DISABLE_LOGGING) })
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

async function awaitResult (jobId) {
    const job = await Queue.Job.fromId(taskQueue, jobId)
    return await job.finished()
}

function createTaskWrapper (name, fn, defaultTaskOptions = {}) {
    async function applyAsync (args, taskOptions) {
        if (!isSerializable(args)) throw new Error('arguments is not serializable')
        if (FAKE_WORKER_MODE) {
            // NOTE: it's just for test purposes
            // similar to https://docs.celeryproject.org/en/3.1/configuration.html#celery-always-eager
            // TODO(pahaz): think about test errors!?
            console.warn('LocalTaskExecution', name, args, taskOptions, '(task options ignored)')
            const result = await executeTask(name, createSerializableCopy(args))
            return {
                getState: async () => { return Promise.resolve('completed') },
                awaitResult: async () => { return Promise.resolve(result) },
            }
        }

        const job = await taskQueue.add(name, { args: createSerializableCopy([...args]) }, {
            ...globalTaskOptions,
            ...defaultTaskOptions,
            ...taskOptions,
        })

        return {
            getState: async () => {
                return await job.getState()
            },
            awaitResult: async () => {
                return await awaitResult(job.id)
            },
        }
    }

    async function delay () {
        return await applyAsync([...arguments])
    }

    function errorTaskCallPrevent () {
        throw new Error('This function is converted to a task, and you need to use fn.delay(...) to call the tasks')
    }

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
                        console.warn(task)
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
    if (!TASKS.has(name)) throw new Error(`executeTask: Unknown task name ${name}`)
    if (!isSerializable(args)) throw new Error('executeTask: args is not serializable')

    const fn = TASKS.get(name)

    return fn.apply(job, args)
}

async function createWorker (keystoneModule) {
    // NOTE: we should have only one worker per node process!
    if (isWorkerCreated) {
        taskLogger.warn({ message: 'Call createWorker() more than one time! (ignored)' })
        return
    } else {
        isWorkerCreated = true
        taskLogger.info({ message: 'Creating worker process' })
    }

    // we needed to prepare keystone to use it inside tasks logic!
    if (keystoneModule) {
        await prepareKeystoneExpressApp(keystoneModule)
    } else {
        taskLogger.warn({ message: 'Keystone APP context is not prepared! You can\'t use Keystone GQL query inside the tasks!' })
    }

    taskQueue.process('*', WORKER_CONCURRENCY, async function (job) {
        taskLogger.info({ job: job.id, status: 'processing', task: job.toJSON() })
        try {
            return await executeTask(job.name, job.data.args, job)
        } catch (e) {
            taskLogger.error({ job: job.id, status: 'error', error: serializeError(e), task: job.toJSON() })
            throw e
        }
    })

    taskQueue.on('failed', function (job) {
        taskLogger.info({ job: job.id, status: 'failed', task: job.toJSON() })
    })

    taskQueue.on('completed', function (job) {
        taskLogger.info({ job: job.id, status: 'completed', task: job.toJSON(), t0: job.finishedOn - job.timestamp, t1: job.processedOn - job.timestamp, t2: job.finishedOn - job.processedOn })
    })

    await taskQueue.isReady()
    taskLogger.info({ message: 'Worker: ready to work!' })
    const cronTasksNames = [...CRON_TASKS.keys()]
    if (cronTasksNames.length > 0) {
        taskLogger.info({ message: 'Worker: add repeatable tasks!', names: cronTasksNames })
        cronTasksNames.forEach((name) => {
            const fn = TASKS.get(name)
            fn.delay()
        })
    }
    const removeTasksNames = REMOVE_CRON_TASKS.map(x => x[0])
    if (removeTasksNames.length > 0) {
        taskLogger.info({ message: 'Worker: remove tasks!', names: removeTasksNames })
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
}
