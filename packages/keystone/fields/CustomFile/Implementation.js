const jwt = require('jsonwebtoken')
const { omit, get } = require('lodash')

const conf = require('@open-condo/config')
const { parseAndValidateFileMetaSignature } = require('@open-condo/files/utils')
const { GQLError } = require('@open-condo/keystone/errors')

const FileWithUTF8Name  = require('../FileWithUTF8Name/index')

class CustomFile extends FileWithUTF8Name.implementation {
    constructor () {
        super(...arguments)
        this.graphQLOutputType = 'File'
        this._fileSecret = conf['FILE_SECRET']
    }

    getFileUploadType () {
        return 'FileUpload'
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
            [this.path]: (item, args, context) => {
                const itemValues = item[this.path]
                if (!itemValues) {
                    return null
                }

                if (typeof itemValues === 'string') {
                    return itemValues
                }

                const user = context?.req?.user || context?.authedItem || null

                return {
                    publicUrl: this.fileAdapter.publicUrl(itemValues, user),
                    ...itemValues,
                }
            },
        }
    }

    async validateInput (props) {
        const { context, resolvedData, listKey } = props

        const fileData = resolvedData[this.path]
        if (fileData && fileData['signature']) {
            let fileMeta
            try {
                fileMeta = jwt.verify(fileData['signature'], this._fileSecret, { algorithms: ['HS256'] })
            } catch (err) {
                throw new GQLError({
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_SIGNATURE',
                    variable: [this.path],
                    message: 'Signature is wrong or expired',
                })
            }

            const { data, success, error } = parseAndValidateFileMetaSignature(fileData)
            if (!success) {
                throw new GQLError({
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_SIGNATURE',
                }, context, error)
            }

            fileMeta = data

            if (fileMeta.meta.authedItem !== context.authedItem.id) {
                throw new GQLError({
                    code: 'FORBIDDEN',
                    type: 'ACCESS_DENIED',
                    variable: [this.path],
                    message: 'You are not own this file',
                }, context)
            }

            if (!fileMeta.meta.modelNames.includes(listKey)) {
                throw new GQLError({
                    code: 'FORBIDDEN',
                    type: 'ACCESS_DENIED',
                    variable: [this.path],
                    message: 'Owner of this file restrict connection to this model',
                }, context)
            }
        }

        return await super.validateInput(props)
    }

    async resolveInput ({ resolvedData, existingItem, context, listKey }) {
        const uploadData = resolvedData[this.path]
        // New way to 'upload' - connect file
        if (get(uploadData, 'signature')) {

            let file
            try {
                file = jwt.verify(uploadData['signature'], this._fileSecret, { algorithms: ['HS256'] })
            } catch (e) {
                throw new GQLError({
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_SIGNATURE',
                    variable: [this.path],
                    message: 'Signature is wrong or expired',
                })
            }

            // Clear final object before save to field
            return omit(file, ['iat', 'exp'])
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
