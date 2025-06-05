import pino from 'pino'

const logger = pino({ name: 'console', level: 'debug' })

function getLogMethod (consoleMethodName) {
    switch (consoleMethodName) {
        case 'error':
            return logger.error.bind(logger)
        case 'warn':
            return logger.warn.bind(logger)
        case 'debug':
            return logger.debug.bind(logger)
        case 'log':
        case 'info':
        default:
            return logger.info.bind(logger)
    }
}

const consoleMethodsNames = ['log', 'debug', 'info', 'warn', 'error']

const originalLogsMethods = {}
const patchedLogsMethods = {}

for (const consoleMethodName of consoleMethodsNames) {
    originalLogsMethods[consoleMethodName] = console[consoleMethodName].bind(console)
    patchedLogsMethods[consoleMethodName] = getLogMethod(consoleMethodName)

    console[consoleMethodName] = (...args) => {
        const _consoleMethodName = consoleMethodName
        const isSSR = typeof window === 'undefined'

        if (isSSR) {
            const f = patchedLogsMethods[_consoleMethodName]

            if (args.every(arg => typeof arg === 'string')) {
                f({ msg: args.join(' ') })
            } else {
                f({ msg: 'complex SSR log', data: JSON.stringify({ args }) })
            }
        } else {
            originalLogsMethods[_consoleMethodName](...args)
        }
    }
}
