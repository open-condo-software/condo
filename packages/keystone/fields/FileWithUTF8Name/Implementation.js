const { File } = require('@open-keystone/fields')
const cuid = require('cuid')

const { convertFileNameToUTF8 } = require('@open-condo/keystone/fields/FileWithUTF8Name/utils/convertFileNameToUTF8')

// keystone's original File implementation with only originalFilename converted to UTF-8
class FileWithUTF8Name extends File.implementation {
    async resolveInput ({
        resolvedData,
        existingItem,
    }) {
        const previousData = existingItem && existingItem[this.path]
        const uploadData = resolvedData[this.path] // NOTE: The following two conditions could easily be combined into a
        // single `if (!uploadData) return uploadData`, but that would lose the
        // nuance of returning `undefined` vs `null`.
        // Premature Optimisers; be ware!

        if (typeof uploadData === 'undefined') {
            // Nothing was passed in, so we can bail early.
            return undefined
        }

        if (uploadData === null) {
            // `null` was specifically uploaded, and we should set the field value to
            // null. To do that we... return `null`
            return null
        }

        const {
            createReadStream,
            filename: originalFilename,
            mimetype,
            encoding,
        } = await uploadData
        const stream = createReadStream()

        if (!stream && previousData) {
            // TODO: FIXME: Handle when stream is null. Can happen when:
            // Updating some other part of the item, but not the file (gets null
            // because no File DOM element is uploaded)
            return previousData
        }

        const {
            id,
            filename,
            _meta,
        } = await this.fileAdapter.save({
            stream,
            filename: originalFilename,
            mimetype,
            encoding,
            // if you use mongoose then make sure to use their own ObjectId type for id, like so:
            // this.adapter.listAdapter.parentAdapter.name === 'mongoose' ? new mongoose.Types.ObjectId()
            id: cuid(),
        })

        return {
            id,
            filename,
            originalFilename: convertFileNameToUTF8(originalFilename),
            mimetype,
            encoding,
            _meta,
        }
    }
}

module.exports = {
    FileWithUTF8Name,
}
