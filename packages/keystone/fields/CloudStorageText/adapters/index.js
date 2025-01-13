const { Text } = require('@keystonejs/fields')
const cuid = require('cuid')
const isNil = require('lodash/isNil')

const { bufferToStream, readFileFromStream, getObjectStream } = require('@open-condo/keystone/file')

const CommonInterface = superclass => class extends superclass {

    constructor () {
        super(...arguments)
        if (!this.config.adapter) {
            throw new Error('CloudStorageText field cannot be used without a file adapter')
        }
        this.fileAdapter = this.config.adapter
    }

    setupHooks ({ addPreSaveHook, addPostReadHook }) {
        addPreSaveHook(async (item) => {
            if (this._isFieldDefined(item)) {
                item[this.path] = await this._saveFileToAdapter(item[this.path])
            }
            return item
        })

        addPostReadHook(async (item) => {
            if (item[this.path]) {
                item[this.path] = await this._readFileFromAdapter(item[this.path])
            }
            return item
        })
    }

    _isFieldDefined (item) {
        return item && !isNil(item[this.path])
    }

    async _saveFileToAdapter (content) {
        const stream = bufferToStream(content)
        const originalFilename = this._generateFilename()
        const mimetype = 'text/plain'
        const encoding = 'utf8'

        const { id, filename, _meta } = await this.fileAdapter.save({
            stream,
            filename: originalFilename,
            mimetype,
            encoding,
            id: cuid(),
        })

        return {
            id,
            filename,
            originalFilename,
            mimetype,
            encoding,
            _meta,
        }
    }

    async _readFileFromAdapter (fileMetadata) {
        const fileStream = await getObjectStream(fileMetadata, this.fileAdapter)
        const fileContent = await readFileFromStream(fileStream)
        return fileContent.toString()
    }

    _generateFilename () {
        return `${new Date().toISOString()}`
    }

    addToTableSchema (table) {
        table.jsonb(this.path)
    }
}

class CloudStorageTextKnexFieldAdapter extends CommonInterface(Text.adapters.knex) {}
class CloudStorageTextMongooseFieldAdapter extends CommonInterface(Text.adapters.mongoose) {}
class CloudStorageTextPrismaFieldAdapter extends CommonInterface(Text.adapters.prisma) {}

module.exports = {
    mongoose: CloudStorageTextKnexFieldAdapter,
    knex: CloudStorageTextMongooseFieldAdapter,
    prisma: CloudStorageTextPrismaFieldAdapter,
}