// eslint-disable-next-line
const conf = require('@open-condo/config')  // Note: we need to prepare process.env first
// eslint-disable-next-line
const tracer = require('dd-trace')  // Note: required for monkey patching

const { createWorker } = require('@open-condo/keystone/tasks')
const { getAppName, getXRemoteApp, getXRemoteClient, getXRemoteVersion } = require('@open-condo/keystone/tracingUtils')

const index = require('./index')

const IS_ENABLE_DD_TRACE = conf.NODE_ENV === 'production' && conf.DD_TRACE_ENABLED === 'true'

if (IS_ENABLE_DD_TRACE) {
    const isDDLog = conf.DD_TRACE_LOGGING === 'true'
    const appName = getAppName()
    const xRemoteApp = getXRemoteApp()
    const xRemoteClient = getXRemoteClient()
    const xRemoteVersion = getXRemoteVersion()
    // NOTE: https://datadoghq.dev/dd-trace-js/
    tracer.init({
        // Note: we need to save old service name as `root` to save history
        service: (appName === 'condo-app') ? 'root' : appName,
        tags: { xRemoteApp, xRemoteClient, xRemoteVersion },
        experimental: (isDDLog) ? { exporter: 'log' } : undefined,
        // NOTE: we don't need IAST and AppSec inside workers
        // TODO(pahaz): DOMA-10202 probably we need to set it by ENV but at the moment I can't change env for workers only
        iast: { enabled: false },
        appsec: { enabled: false },
    })
}

function traceWrapper (fn) {
    return tracer.wrap('task.process', fn)
}

createWorker(index, process.argv.slice(2), traceWrapper)
    .catch((error) => {
        console.error(error)
        process.exit(2)
    })
