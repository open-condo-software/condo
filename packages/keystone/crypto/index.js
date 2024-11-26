const { registerCompressor } = require('./compressors')
const { EncryptionManager } = require('./EncryptionManager')
const { registerKeyDeriver } = require('./keyDerivers')

module.exports = {
    registerKeyDeriver,
    registerCompressor,
    EncryptionManager,
}