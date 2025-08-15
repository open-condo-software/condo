const jwt = require('jsonwebtoken')
const { omit, get } = require('lodash')

const conf = require('@open-condo/config')
const { CondoFile } = require('@open-condo/files/schema/utils/serverSchema')
const { GQLError } = require('@open-condo/keystone/errors')

const FileWithUTF8Name  = require('../FileWithUTF8Name/index')

class CustomFile extends FileWithUTF8Name.implementation {
    constructor () {
        super(...arguments)
        this.graphQLOutputType = 'File'
        this.fileServiceUrl = conf['FILE_SERVICE_URL']
        this._fileSecret = conf['FILE_SECRET']
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

    async resolveInput ({ resolvedData, existingItem, context, listKey }) {
        const uploadData = resolvedData[this.path]
        // New way to 'upload' - connect file
        if (get(uploadData, 'signature')) {

            let file
            try {
                file = jwt.verify(uploadData['signature'], this._fileSecret)
            } catch (e) {
                throw new GQLError({
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_SIGNATURE',
                    variable: [this.path],
                    message: 'Signature is wrong or expired',
                })
            }

            const fileMeta = file.meta

            if (fileMeta.authedItem !== context.authedItem.id) {
                throw new GQLError({
                    code: 'FORBIDDEN',
                    type: 'ACCESS_DENIED',
                    variable: [this.path],
                    message: 'You are not own this file',
                })
            }

            if (fileMeta.modelNames.length && !fileMeta.modelNames.includes(listKey)) {
                throw new GQLError({
                    code: 'FORBIDDEN',
                    type: 'ACCESS_DENIED',
                    variable: [this.path],
                    message: 'Owner of this file restrict connection to this model',
                })
            }

            let condoFile

            if (this.fileServiceUrl) {
                const response = await fetch(this.fileServiceUrl + '/api/files/attach', {
                    method: 'POST',
                    body: JSON.stringify({
                        signature: uploadData['signature'],
                    }),
                })
                if (response.status !== 200) {
                    throw new GQLError({
                        code: 'BAD_USER_INPUT',
                        type: 'WRONG_FILE_ID',
                        variable: [this.path],
                        message: 'File not found or you do not have access to it',
                    })
                }
            } else {
                condoFile = await CondoFile.getOne(context, {
                    signature: uploadData['signature'],
                    deletedAt: null,
                })

                if (!condoFile) {
                    throw new GQLError({
                        code: 'BAD_USER_INPUT',
                        type: 'WRONG_SIGNATURE',
                        variable: [this.path],
                        message: 'Signature is wrong or expired',
                    })
                }

                await CondoFile.update(context, condoFile.id, { attach: true, dv: 1, sender: { dv: 1, fingerprint: 'file-attach-handler' } })
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
