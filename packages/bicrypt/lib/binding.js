const path = require('path')
const addon = require(path.join(__dirname, '../build/Release/condo-bicrypt-sign-native'))
const { existsSync: checkPath } = require('fs')
const { DOMParser } = require('@xmldom/xmldom')
const c14n = require('xml-c14n')()

const formatXml = (xmlData) => new Promise((resolve, reject) => {
    const document = (new DOMParser()).parseFromString(xmlData, 'text/xml')
    const xmlParser = c14n.createCanonicaliser('http://www.w3.org/2001/10/xml-exc-c14n#')
    xmlParser.canonicalise(document.documentElement, (err, xml) => {
        if (err) {
            return reject(err)
        }
        return resolve({
            lib: xmlParser.name(),
            source: xmlData,
            xml,
        })
    })
})


class CondoBicryptSign {

    constructor ({ keyName = '', passPhrase, keyPath = '' }) {
        const pathToKey = keyName ? path.resolve(`${__dirname}/keys/${keyName}.key`) : keyPath
        const pathToPRDN = path.resolve(`${__dirname}/random/prnd.db3`)
        if (!pathToKey || !checkPath(pathToKey)) {
            return this.error('No key specified', { keyName, keyPath })
        }
        if (!passPhrase) {
            return this.error('No passPhrase', { passPhrase })
        }
        if (!pathToPRDN || !checkPath(pathToPRDN)) {
            return this.error('random generator path failed', { pathToPRDN })
        }
        this._addonInstance = new addon.CondoBicryptSign(pathToKey, passPhrase, pathToPRDN)
    }

    info (message, params = {}) {
        console.log({ module: 'bicrypt-sign', message, ...params })
    }

    error (message, params = {}) {
        console.error({ module: 'bicrypt-sign', message, ...params })
    }

    async sign (textToSign, isDebug = false) {
        try {
            const { xml } = await formatXml(textToSign)
            if (!xml) {
                return this.error('Empty text to sign')
            }
            const response = {
                xml,
                signature: this._addonInstance.sign(xml, isDebug),
            }
            return response
        } catch (error) {
            return this.error('Bad xml input', { textToSign })
        }
    }

}

module.exports = {
    CondoBicryptSign,
}
