const jwt = require('jsonwebtoken')
const { get, omit } = require('lodash')

const conf = require('@open-condo/config')
const { validateFileUploadSignature } = require('@open-condo/files/utils')
const { GQLError } = require('@open-condo/keystone/errors')

const FileWithUTF8Name  = require('../FileWithUTF8Name/index')

class CustomFile extends FileWithUTF8Name.implementation {
    constructor () {
        super(...arguments)
        this.graphQLOutputType = 'File'
        this._fileSecret = conf['FILE_SECRET']
        this._fileClientId = conf['FILE_CLIENT_ID']
        this._fileServiceUrl = conf['FILE_SERVICE_URL'] || '/api/files/attach'
    }

    getFileUploadType () {
        return 'FileMeta'
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

            const { data, success, error } = validateFileUploadSignature(fileData)
            if (!success) {
                throw new GQLError({
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_SIGNATURE',
                }, context, error)
            }

            fileMeta = data

            if (fileMeta.authedItem !== context.authedItem.id) {
                throw new GQLError({
                    code: 'FORBIDDEN',
                    type: 'ACCESS_DENIED',
                    variable: [this.path],
                    message: 'You are not own this file',
                }, context)
            }

            if (!fileMeta.modelNames.includes(listKey)) {
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
        const input = resolvedData[this.path]

        // === New flow (signature): don't write a file yet; just mark this request ===
        if (get(input, 'signature')) {
            let fileMeta

            try {
                fileMeta = jwt.verify(input.signature, this._fileSecret, { algorithms: ['HS256'] })
            } catch (err) {
                throw new GQLError({
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_SIGNATURE',
                    variable: [this.path],
                    message: 'Signature is wrong or expired',
                })
            }

            validateFileUploadSignature(fileMeta)

            // keep per-request state so afterChange knows to run the webhook
            if (!context._fileNewFlow) context._fileNewFlow = {}

            const key = `${listKey}.${this.path}`
            context._fileNewFlow[key] = {
                signature: input.signature,
                userId: context.authedItem?.id || null,
                listKey,
            }
            return null // field stays null for the first write
        }

        // === Legacy flow (Upload stream): delegate to base ===
        return super.resolveInput({ resolvedData, existingItem })
    }

    async beforeChange ({ resolvedData, context, listKey }) {
        const key = `${listKey}.${this.path}`
        const marker = context._fileNewFlow && context._fileNewFlow[key]
        if (!marker) return

        const payload = {
            id: resolvedData.id,
            modelName: listKey,
            signature: context._fileNewFlow[key].signature,
            fileClientId: this._fileClientId,
            dv: 1, sender: { dv: 1, fingerprint: 'file-attach-handler' },
        }

        let attachResult

        try {
            const res = await fetch(this._fileServiceUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                return
            }

            attachResult = await res.json()

            if (!get(attachResult, ['data', 'file', 'signature'], false)) {
                return
            }

            attachResult = attachResult.data.file.signature

            const data = jwt.verify(attachResult, this._fileSecret, { algorithms: ['HS256'] })

            resolvedData[this.path] = omit(data, ['iat', 'exp'])
        } catch (err) {
            return
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
