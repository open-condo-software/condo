const { Text } = require('@keystonejs/fields')
const cuid = require('cuid')

const { CLOUD_STORAGE_TEXT_MIMETYPE, CLOUD_STORAGE_TEXT_ENCODING } = require('@open-condo/keystone/fields/CloudStorageText/constants')
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
            if (item[this.path]) {
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

    async _saveFileToAdapter (content) {
        const stream = bufferToStream(content)
        const originalFilename = cuid()

        const { id, filename, _meta } = await this.fileAdapter.save({
            stream,
            filename: originalFilename,
            mimetype: CLOUD_STORAGE_TEXT_MIMETYPE,
            encoding: CLOUD_STORAGE_TEXT_ENCODING,
            id: cuid(),
        })

        return {
            id,
            filename,
            originalFilename,
            mimetype: CLOUD_STORAGE_TEXT_MIMETYPE,
            encoding: CLOUD_STORAGE_TEXT_ENCODING,
            _meta,
        }
    }

    async _readFileFromAdapter (fileMetadata) {
        const fileStream = await getObjectStream(fileMetadata, this.fileAdapter)
        const fileContent = await readFileFromStream(fileStream)
        return fileContent.toString()
    }

    addToTableSchema (table) {
        const column = table.jsonb(this.path)
        if (this.isNotNullable) column.notNullable()
        if (this.defaultTo) column.defaultTo(this.defaultTo)
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