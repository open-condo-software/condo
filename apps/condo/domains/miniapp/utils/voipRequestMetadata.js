const validate = require('validate.js')

const { getLogger } = require('@open-condo/keystone/logging')

const { UUID_REGEXP } = require('@condo/domains/common/constants/regexps')
const { JSON_STRUCTURE_FIELDS_CONSTRAINTS } = require('@condo/domains/common/utils/validation.utils')

const logger = getLogger()
const UUID_LENGTH = 36
const MAX_FINGERPRINT_LENGTH = JSON_STRUCTURE_FIELDS_CONSTRAINTS.fingerprint.length.maximum

// TODO: Remove default dv/sender once callers always provide valid request metadata.
const DEFAULT_DV = 1
const DEFAULT_SENDER = { dv: DEFAULT_DV, fingerprint: 'voip-rest' }

function getDv (data) {
    return Object.hasOwn(data, 'dv') ? data.dv : DEFAULT_DV
}

function getSender (req, data) {
    if (Object.hasOwn(data, 'sender')) return data.sender
    const remoteClient = req.headers['x-remote-client']
    if (typeof remoteClient === 'string') {
        const uuid = remoteClient.slice(0, UUID_LENGTH)
        const fingerprint = remoteClient[UUID_LENGTH] === '-' && remoteClient.length > UUID_LENGTH + 1 && UUID_REGEXP.test(uuid)
            ? uuid
            : remoteClient.slice(0, MAX_FINGERPRINT_LENGTH)
        if (!validate({ fingerprint }, JSON_STRUCTURE_FIELDS_CONSTRAINTS)) {
            return { dv: DEFAULT_DV, fingerprint }
        }
    }

    logger.warn({
        msg: 'Using default VoIP sender',
        data: { source: 'x-remote-client', reason: remoteClient === undefined ? 'missing' : 'invalid' },
    })
    return { ...DEFAULT_SENDER }
}

module.exports = {
    getDv,
    getSender,
}
