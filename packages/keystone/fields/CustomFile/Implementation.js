const { validate } = require('uuid')

const { CondoFile } = require('@open-condo/files/schema/utils/serverSchema')
const { GQLError } = require('@open-condo/keystone/errors')

const FileWithUTF8Name  = require('../FileWithUTF8Name/index')


class CustomFile extends FileWithUTF8Name.implementation {
    constructor () {
        super(...arguments)
        this.graphQLOutputType = 'File'
    }

    getFileUploadType () {
        return 'CustomUpload'
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

    async validateInput (props) {
        const { context, resolvedData } = props

        const fileData = resolvedData[this.path]
        if (fileData && fileData['meta']) {
            if (fileData['meta']['authedItem'] !== context.authedItem.id) {
                throw new GQLError({
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_FILE_ID',
                    variable: [this.path],
                    message: 'File not found or you do not have access to it',

                }, context)
            }
        }

        return await super.validateInput(props)
    }

    async resolveInput ({ resolvedData, existingItem, context }) {
        const uploadData = resolvedData[this.path]
        // New way to 'upload' - connect file
        if (typeof uploadData === 'string' && validate(uploadData)) {
            const data = await CondoFile.getOne(context, { id: uploadData }, 'file { id filename originalFilename mimetype encoding meta }')
            if (data) {
                if (data.file.meta.authedItem === context.authedItem.id) {
                    return data.file
                }
            }
            throw new GQLError({
                code: 'BAD_USER_INPUT',
                type: 'WRONG_FILE_ID',
                variable: [this.path],
                message: 'File not found or you do not have access to it',
            })
        }

        // Legacy way to upload file
        return await super.resolveInput({ resolvedData, existingItem })
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
