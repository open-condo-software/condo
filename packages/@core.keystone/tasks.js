const Queue = require('bull')
const falsey = require('falsey')
const pino = require('pino')
const { serializeError } = require('serialize-error')

const conf = require('@core/config')

const { prepareKeystoneExpressApp, getRandomString } = require('./test.utils')
const { getRedisClient } = require('./redis')

const TASK_TYPE = 'TASK'
const WORKER_CONCURRENCY = parseInt(conf.WORKER_CONCURRENCY || '2')

// NOTE: If this is True, all tasks will be executed in the node process with setTimeout.
const FAKE_WORKER_MODE = conf.TESTS_FAKE_WORKER_MODE
const taskQueue = new Queue('tasks', {
    /**
     * @param {'client' | 'subscriber'} type
     * @return {import('ioredis')}
     */
    createClient: (type) => {
        if (type === 'client') {
            return getRedisClient('tasks', 'regular')
        } else if (type === 'subscriber') {
            return getRedisClient('tasks', 'subscriber')
        } else {
            throw new Error(`Queue.createClient() unexpected type = ${type}`)
        }
    },
})

const taskLogger = pino({ name: 'worker', enabled: falsey(conf.DISABLE_LOGGING) })
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
    const job = await taskQueue.add(name, { args: preparedArgs }, preparedOpts)

    return {
        getState: async () => {
            return await job.getState()
        },
        awaitResult: async () => {
            return await job.finished()
        },
    }
}

async function _scheduleInProcessTask (name, preparedArgs, preparedOpts) {
    // NOTE: it's just for test purposes
    // similar to https://docs.celeryproject.org/en/3.1/configuration.html#celery-always-eager
    console.warn(`ScheduleInProcessTask('${name}', ${JSON.stringify(preparedArgs)}, ${JSON.stringify(preparedOpts)}); // (task options ignored)`)

    const jobId = getRandomString()
    let error = undefined
    let result = undefined
    let status = 'processing'
    let executor = async function inProcessExecutor () {
        try {
            console.info(`ScheduleInProcessTask('${name}', ${JSON.stringify(preparedArgs)}) EXECUTION`)
            result = await executeTask(name, preparedArgs, { id: jobId })
            status = 'completed'
        } catch (e) {
            console.error('ScheduleInProcessTask() EXCEPTION:', e)
            status = 'error'
            error = e
        }
    }

    setTimeout(executor, 1)

    return {
        getState: async () => { return Promise.resolve(status) },
        awaitResult: async () => {
            return new Promise((res, rej) => {
                const handler = setInterval(() => {
                    console.log(status, result)
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

function createTaskWrapper (name, fn, defaultTaskOptions = {}) {
    async function applyAsync (args, taskOptions) {
        if (!isSerializable(args)) throw new Error('arguments is not serializable')

        const preparedArgs =  createSerializableCopy([...args])
        const preparedOpts = {
            ...globalTaskOptions,
            ...defaultTaskOptions,
            ...taskOptions,
        }

        if (FAKE_WORKER_MODE) {
            return await _scheduleInProcessTask(name, preparedArgs, preparedOpts)
        }

        return await _scheduleRemoteTask(name, preparedArgs, preparedOpts)
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
