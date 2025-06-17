const { CondoFile } = require('@open-condo/files/schema/utils/serverSchema')

const FileWithUTF8Name  = require('../FileWithUTF8Name/index')


class CustomFile extends FileWithUTF8Name.implementation {
    constructor () {
        super(...arguments)
        this.graphQLOutputType = 'File'
    }

    getFileUploadType () {
        return 'Upload'
    }

    getGqlAuxTypes () {
        return [
            `
            type ${this.graphQLOutputType} {
              id: ID
              path: String
              filename: String
              originalFilename: String
              mimetype: String
              encoding: String
              publicUrl: String
              meta: JSON
            }
          `,
        ]
    }

    gqlOutputFieldResolvers () {
        return {
            [this.path]: item => {
                const itemValues = item[this.path]
                if (!itemValues) {
                    return null
                }

                if (typeof itemValues === 'string') {
                    return itemValues
                }

                return {
                    publicUrl: this.fileAdapter.publicUrl(itemValues),
                    ...itemValues,
                }
            },
        }
    }

    async resolveInput ({ resolvedData, existingItem, context }) {
        const uploadData = resolvedData[this.path]
        // Old way to upload file
        if (uploadData instanceof Promise) {
            return await super.resolveInput({ resolvedData, existingItem })
        }

        if (typeof uploadData === 'string') {
            const file = await CondoFile.getOne(context, { id: uploadData }, 'file { id filename originalFilename mimetype encoding meta }')
            if (file) {
                return file.file
            }
            return null
        }
    }

    getBackingTypes () {
        const type = `null | {
            id: string;
            path: string;
            filename: string;
            originalFilename: string;
            mimetype: string;
            encoding: string;
            meta: Record<string, any>
            _meta: Record<string, any>
           }
        `
        return { [this.path]: { optional: true, type } }
    }

    gqlCreateInputFields () {
        return [`${this.path}: ${this.getFileUploadType()}`]
    }

    gqlUpdateInputFields () {
        return [`${this.path}: ${this.getFileUploadType()} `]
    }
}

module.exports = { CustomFile }
