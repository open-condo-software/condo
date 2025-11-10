const jwt = require('jsonwebtoken')
const { get, omit } = require('lodash')

const conf = require('@open-condo/config')
const { validateFileUploadSignature } = require('@open-condo/files/utils')
const { GQLError, GQLErrorCode: { INTERNAL_ERROR, BAD_USER_INPUT, FORBIDDEN } } = require('@open-condo/keystone/errors')

const FileWithUTF8Name  = require('../FileWithUTF8Name/index')

const ERRORS = {
    INTERNAL_ERROR: {
        code: INTERNAL_ERROR,
        type: 'FAILED_TO_ATTACH_FILE',
        message: 'File service returned unexpected error during file verification process',
    },
    WRONG_SIGNATURE: {
        code: BAD_USER_INPUT,
        type: 'WRONG_SIGNATURE',
        message: 'Signature is wrong or expired',
    },
    ACCESS_DENIED: {
        code: FORBIDDEN,
        type: 'ACCESS_DENIED',
        message: 'You are not own this file',
    },
    LEGACY_FLOW_RESTRICTED: {
        code: BAD_USER_INPUT,
        type: 'LEGACY_FLOW_RESTRICTED',
        message: 'You are unable to use graphql upload flow',
    },
}


class CustomFile extends FileWithUTF8Name.implementation {
    constructor () {
        super(...arguments)
        this.graphQLOutputType = 'File'
        this._fileSecret = conf['FILE_SECRET']
        this._fileClientId = conf['FILE_CLIENT_ID']
        this._fileServiceUrl = (conf['FILE_SERVICE_URL'] || conf['SERVER_URL']) + '/api/files/attach'
        this._strictMode = conf['FILE_UPLOAD_STRICT_MODE'] || false
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
                throw new GQLError({ ...ERRORS.WRONG_SIGNATURE, variable: [this.path] }, context)
            }

            const { data, success, error } = validateFileUploadSignature(fileData)
            if (!success) {
                throw new GQLError(ERRORS.WRONG_SIGNATURE, context, error)
            }

            fileMeta = data

            if (fileMeta.authedItem !== context.authedItem.id) {
                throw new GQLError({ ...ERRORS.ACCESS_DENIED, variable: [this.path] }, context)
            }

            if (!fileMeta.modelNames.includes(listKey)) {
                throw new GQLError({
                    ...ERRORS.ACCESS_DENIED,
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
                throw new GQLError({ ...ERRORS.WRONG_SIGNATURE, variable: [this.path] }, context)
            }

            const { success, error } = validateFileUploadSignature(fileMeta)

            if (!success) {
                throw new GQLError(ERRORS.WRONG_SIGNATURE, context, error)
            }

            // keep per-request state so afterChange knows to run the webhook
            if (!context._fileNewFlow) context._fileNewFlow = {}

            const key = `${listKey}.${this.path}`
            context._fileNewFlow[key] = {
                signature: input.signature,
                userId: context.authedItem?.id || null,
                listKey,
                originalFilename: input.originalFilename,
            }

            return {
                originalFilename: input.originalFilename || '',
            }
        }

        if (this._strictMode) {
            throw new GQLError({
                ...ERRORS.LEGACY_FLOW_RESTRICTED,
                variable: [this.path],
            }, context)
        }

        // === Legacy flow (Upload stream): delegate to base ===
        return super.resolveInput({ resolvedData, existingItem })
    }

    async beforeChange ({ resolvedData, context, listKey }) {
        const key = `${listKey}.${this.path}`
        const hasFileInRequest = context._fileNewFlow && context._fileNewFlow[key]
        if (!hasFileInRequest) return

        const payload = {
            itemId: resolvedData.id,
            modelName: listKey,
            signature: context._fileNewFlow[key].signature,
            fileClientId: this._fileClientId,
            dv: 1, sender: resolvedData.sender,
        }

        let attachResult

        const headers = { 'Content-Type': 'application/json' }
        const raw = context?.req?.headers?.cookie || ''
        const cookieMatch = raw.match(/(?:^|;\s*)keystone\.sid=([^;]+)/)

        if (cookieMatch) {
            headers['Cookie'] = `keystone.sid=${cookieMatch[1]}`
        } else if (context?.req?.headers?.authorization) {
            headers['Authorization'] = context?.req?.headers?.authorization
        }

        try {
            const res = await fetch(this._fileServiceUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            })

            attachResult = await res.json()

            if (!res.ok) {
                if (attachResult?.errors && attachResult?.errors?.length > 0) {
                    throw new GQLError({
                        message: attachResult.errors[0].message,
                        code: res.statusCode,
                        type: attachResult.errors[0].extensions.type,
                    }, context)
                }

                throw new GQLError(ERRORS.INTERNAL_ERROR, context)
            }

            attachResult = attachResult.data.file.signature

            const data = jwt.verify(attachResult, this._fileSecret, { algorithms: ['HS256'] })

            resolvedData[this.path] = omit(data, ['iat', 'exp'])
        } catch (err) {
            if (err instanceof GQLError) {
                throw err
            }

            throw new GQLError(ERRORS.INTERNAL_ERROR, context)
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
