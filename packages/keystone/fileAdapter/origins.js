const conf = require('@open-condo/config')

function getFileServicePublicOrigin () {
    return conf.CONDO_DOMAIN || conf.FILE_SERVICE_URL || conf.SERVER_URL
}

module.exports = {
    getFileServicePublicOrigin,
}
