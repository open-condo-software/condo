const { SbbolRequestApi } = require('./SbbolRequestApi')

class SbbolCryptoApi extends SbbolRequestApi {
    async getCryptoInfo () {
        const result = await this.request({ method: 'GET', path: this.cryptoInfoPath })
        return result
    }

    get cryptoInfoPath () {
        return `${this.apiPrefix}/v1/crypto`
    }

    get apiPrefix () {
        return '/fintech/api'
    }
}

module.exports = {
    SbbolCryptoApi,
}