const { Text } = require('@keystonejs/fields')
const cuid = require('cuid')
const isNil = require('lodash/isNil')

const { bufferToStream, readFileFromStream, getObjectStream } = require('@open-condo/keystone/file')

const CommonInterface = superclass => class extends superclass {

    constructor () {
        super(...arguments)
        if (!this.config.adapter) {
            throw new Error('LargeText field cannot be used without a file adapter')
        }
        this.fileAdapter = this.config.adapter
    }

    setupHooks ({ addPreSaveHook, addPostReadHook }) {

        addPreSaveHook(async item => {
            const fieldIsDefined = !isNil(item) && !isNil(item[this.path])
            if (fieldIsDefined) {
                const stream = bufferToStream(item[this.path])
                //TODO: need to think about name
                const originalFilename = `${new Date().toISOString()}`
                const mimetype = 'text/plain'
                const encoding = 'utf8'

                const {
                    id,
                    filename,
                    _meta,
                } = await this.fileAdapter.save({
                    stream,
                    filename: originalFilename,
                    mimetype,
                    encoding,
                    id: cuid(),
                })
                item[this.path] = JSON.stringify(
                    {
                        id,
                        filename,
                        originalFilename,
                        mimetype,
                        encoding,
                        _meta,
                    }
                )
            }
            return item
        })
        
        addPostReadHook(async item => {
            if (item[this.path]) {
                item[this.path] = (await readFileFromStream(await getObjectStream(item[this.path], this.fileAdapter))).toString()
            }

            return item
        })
    }

    addToTableSchema (table) {
        const column = table.jsonb(this.path)
        column.isMultiline = true
    }
}

class LargeTextKnexFieldAdapter extends CommonInterface(Text.adapters.knex) {}
class LargeTextMongooseFieldAdapter extends CommonInterface(Text.adapters.mongoose) {}
class LargeTextPrismaFieldAdapter extends CommonInterface(Text.adapters.prisma) {}

module.exports = {
    mongoose: LargeTextKnexFieldAdapter,
    knex: LargeTextMongooseFieldAdapter,
    prisma: LargeTextPrismaFieldAdapter,
}