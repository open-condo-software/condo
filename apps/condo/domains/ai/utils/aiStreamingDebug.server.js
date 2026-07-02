// TODO: remove before commit — temporary streaming debug logs (server only)
const PREFIX = '[ai-streaming]'

function logAiStreaming (logger, event, fields = {}) {
    logger.info({
        msg: `${PREFIX} ${event}`,
        ...fields,
    })
}

module.exports = {
    logAiStreaming,
}
