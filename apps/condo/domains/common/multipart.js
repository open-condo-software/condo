const crypto = require('crypto')
const { Readable } = require('node:stream')
const path = require('path')

const cookieSignature = require('cookie-signature')
const ObsClient = require('esdk-obs-nodejs')
const express = require('express')
const { fromFile } = require('file-type')
const jwt = require('jsonwebtoken')

const conf = require('@open-condo/config')
const { FileMiddleware } = require('@open-condo/files/fileMiddleware')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { generateUUIDv4 } = require('@open-condo/miniapp-utils/helpers/uuid')

const kv = getKVClient('fing/multipart-upload')

const MAX_CHUNK_SIZE_BYTES = 10 * 1024 * 1024

/**
 * @param {ObsClient} self 
 * @param {keyof ObsClient} fnName 
 * @param  {Parameters<ObsClient[fnName]>} args 
 * @returns 
 */
function promisify (self, fnName, ...args) {
    return new Promise((res, rej) => self[fnName](...args, (reason, result) => reason ? rej(reason) : res(result)))
}



const logger = getLogger('detect-mime-type')

async function detectMimeTypeFromFile (filepath) {
    if (!filepath) return null

    try {
        const result = await fromFile(filepath)
        return result?.mime || null
    } catch (err) {
        logger.warn({ msg: 'Failed to detect mimetype from file', err, data: { filepath } })
        return null
    }
}

class MultiPartMiddleware {
    prepareMiddleware ({ keystone }) {
        const appConfig = FileMiddleware.prototype.loadConfig()
        const appClients = appConfig?.clients ?? {}
        console.log(appClients)
        // this route can not be used for csrf attack (use oidc-client library to handle auth flows properly)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        app.use(express.raw({ type: 'application/octet-stream', limit: `${MAX_CHUNK_SIZE_BYTES / 1024 / 1024}mb` }))
        app.use(express.json())
        
        const s3Conf = {
            access_key_id: conf.OBS_ACCESS_KEY_ID,
            secret_access_key: conf.OBS_SECRET_ACCESS_KEY,
            server: conf.OBS_ENDPOINT, // например, 'https://sbercloud.ru'
            // is_cname: true,
            signature: 'v4',
            // region: 'ru-central1',
        }
        console.log('s3Conf', s3Conf)
        /** @type {ObsClient} */
        const s3Client = new ObsClient(s3Conf)
        // const s3Client = new S3Client({
        //     region: process.env.S3_REGION,
        //     credentials: {
        //         accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        //         secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        //     },
        //     endpoint: process.env.S3_ENDPOINT,
        //     forcePathStyle: true,
        // })


        const BUCKET = 'dev-test-multipart-upload' //conf.OBS_BUCKET_NAME
        const MAX_FILE_SIZE = 5 * 1073741824 // Лимит 1 ГБ в байтах
        const SECRET = process.env.INTERNAL_SIGNING_SECRET || 'fallback-super-secret-key'
        console.log('BUCKET', BUCKET)
        // Функция генерации токена безопасности
        function createUploadToken ({ uploadId, key, userId, fileName, fileType, fileClientId }) {
            const payload = {
                uploadId,
                key,
                userId,
                fileName,
                fileType,
                fileClientId,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 часа жизни сессии
            }
            const dataString = JSON.stringify(payload)
            const signature = crypto.createHmac('sha256', SECRET).update(dataString).digest('hex')
            return Buffer.from(JSON.stringify({ payload, signature })).toString('base64')
        }

        // Функция верификации токена безопасности
        function verifyUploadToken (token, currentUserId) {
            try {
                const { payload, signature } = JSON.parse(Buffer.from(token, 'base64').toString())
                console.log('verifyUploadToken', { payload, signature, SECRET  })
                const expectedSignature = crypto.createHmac('sha256', SECRET).update(JSON.stringify(payload)).digest('hex')
                console.log('verifyUploadToken', expectedSignature)
                if (signature !== expectedSignature) throw new Error('Invalid signature')
                if (Date.now() > payload.expiresAt) throw new Error('Expired signature')
                if (payload.userId !== currentUserId) throw new Error('User ID does not match')
    
                return payload
            } catch (err) {
                console.error('verifyUploadToken', err)
                return null
            }
        }

        /**
         * 
         * @returns {ObsClient}
         */
        function getS3Client () {
            return new FileAdapter('market_category').s3
        }

        /**
         *
         * @param {import('express').Request} req
         * @param {import('express').Response} res
         * @returns {Promise<*>}
         */
        async function handler (req, res) {
            const initialJson = res.json.bind(res)
            res.json = (...args) => {
                console.log('res.json()', ...args)
                console.log(new Error().stack)
                return initialJson(...args)
            }
            console.log('IN HANDLER')
            if (req.headers['Content-Type'] === 'application/json') {
                console.log('req.body', req.body)
            }
            const { action } = req.query
            if (req.method !== 'POST') return res.status(405).end()

            // Имитация получения ID пользователя из сессии вашего Condo/Keystone приложения
            const currentUserId = req.user?.id || 'anonymous_user'

            const s3Client = getS3Client()

            try {
                // -------------------------------------------------------------
                // 1. СТАРТ: Инициализация мультипарта в OBS
                // -------------------------------------------------------------
                if (action === 'start') {
                    const { folder, fileName, fileType, fileClientId } = req.body // вместо folder можем указать модельку и поле, и по keystone найти адаптер и папку
                    if (!appClients?.[fileClientId]) {
                        return res.status(400).json({ error: 'invalid fileClientId' })
                    }
                    const extension = fileName.split('.').pop()
                    const s3Key = `${folder}/${fileName}`

                    const result = await promisify(s3Client, 'initiateMultipartUpload', {
                        Bucket: BUCKET,
                        Key: s3Key,
                        ContentType: fileType,
                        // Expires: Date.now() + 60 * 60 * 1000, // 1 hour
                        // signature: 'v4',
                        // signatureContext: { signature: 'v4' }
                    })

                    console.log('start result', result)

                    if (result.CommonMsg.Status >= 300) {
                        return res.status(500).json({ error: result.CommonMsg.Code })
                    }

                    const uploadId = result.InterfaceResult.UploadId
                    const uploadToken = createUploadToken({ fileClientId, uploadId, key: s3Key, userId: currentUserId, fileName, fileType })

                    return res.status(200).json({ uploadToken, key: s3Key })
                }

                if (action === 'upload-part') {
                    const uploadToken = req.headers['x-upload-token']
                    const partNumber = Number(req.headers['x-part-number'])

                    if (!uploadToken || !partNumber) {
                        return res.status(400).json({ error: 'Missing x-upload-token or x-part-number headers' })
                    }
                    // 1. Валидация токена сессии загрузки
                    const payload = verifyUploadToken(uploadToken, currentUserId)
                    if (!payload) return res.status(403).json({ error: 'Access Denied / Invalid Token' })
                    // 2. Валидация размера чанка на бэкенде (Контроль объема)
                    const chunkBuffer = req.body
                    if (!Buffer.isBuffer(chunkBuffer) || chunkBuffer.length === 0) {
                        return res.status(400).json({ error: 'Empty or invalid file chunk payload' })
                    }
                    // Минимальный размер чанка для S3/OBS обычно 5 МБ (кроме последнего чанка)
                    // Максимальный размер защищает сервер от переполнения памяти
                    if (chunkBuffer.length > MAX_CHUNK_SIZE_BYTES) {
                        return res.status(400).json({ error: 'Chunk size exceeds allowed server limit' })
                    }
                    console.log(`Uploading part ${partNumber} for key ${payload.key} (Size: ${chunkBuffer.length} bytes)`)

                    // 3. Загрузка чанка в Huawei Cloud OBS через SDK
                    // Передаем буфер в параметр SourceFile (OBS SDK принимает буферы в этот параметр)
                    const bufferStream = new Readable({
                        read () {
                            this.push(chunkBuffer)
                            this.push(null) // Сигнализируем о конце стрима
                        },
                    })
                    const uploadPartResult = await promisify(s3Client, 'uploadPart', {
                        Bucket: BUCKET,
                        Key: payload.key,
                        UploadId: payload.uploadId,
                        PartNumber: partNumber,
                        Body: bufferStream, // Передаем данные прямо из оперативной памяти
                        ContentLength: chunkBuffer.length,
                    })

                    console.log('uploadPartResult', uploadPartResult)

                    if (uploadPartResult.CommonMsg.Status >= 300) {
                        console.error('OBS UploadPart Error:', uploadPartResult.CommonMsg)
                        return res.status(500).json({ error: uploadPartResult.CommonMsg.Code })
                    }
                    // 4. Возвращаем ETag клиенту. Клиент должен его сохранить и передать в complete
                    const eTag = uploadPartResult.InterfaceResult.ETag
                    return res.status(200).json({
                        PartNumber: partNumber,
                        ETag: eTag,
                    })
                }

                // -------------------------------------------------------------
                // 2. GET-URL: Подпись ссылки для конкретного чанка
                // -------------------------------------------------------------
                if (action === 'get-url') {
                    const { uploadToken, partNumber } = req.body
                    const payload = verifyUploadToken(uploadToken, currentUserId)
                    if (!payload) return res.status(403).json({ error: 'Access Denied / Invalid Token' })

                    // Генерируем подписанную URL-ссылку средствами OBS SDK Sync метода
                    const resSigned = s3Client.createSignedUrlSync({
                        Method: 'PUT',
                        Bucket: BUCKET,
                        Key: payload.key,
                        Expires: 900, // 15 минут действия ссылки
                        QueryParams: {
                            uploadId: payload.uploadId,
                            partNumber: String(partNumber),
                        },
                    })

                    return res.status(200).json({ uploadUrl: resSigned.SignedUrl })
                }

                // -------------------------------------------------------------
                // 3. COMPLETE: Сборка файла в OBS и итоговая валидация
                // -------------------------------------------------------------
                if (action === 'complete') {
                    const { uploadToken, parts } = req.body
                    const payload = verifyUploadToken(uploadToken, currentUserId)
                    if (!payload) return res.status(403).json({ error: 'Access Denied' })

                    // Форматируем массив частей под требования структуры OBS SDK
                    // OBS ожидает массив объектов в ключе Parts: [{PartNumber: X, ETag: Y}]
                    const formattedParts = parts.map((p) => ({
                        PartNumber: Number(p.PartNumber),
                        ETag: p.ETag.replace(/"/g, ''), // Очищаем кавычки, если браузер их передал
                    }))

                    const completeResult = await promisify(s3Client, 'completeMultipartUpload', {
                        Bucket: BUCKET,
                        Key: payload.key,
                        UploadId: payload.uploadId,
                        Parts: formattedParts,
                    })
                    console.log('completeResult', completeResult)
                    if (completeResult.CommonMsg.Status >= 300) {
                        return res.status(500).json({ error: completeResult.CommonMsg.Code })
                    }
                    const { Location: fileUrl, Bucket, Key, ETag  } = completeResult.InterfaceResult

                    // Безопасность: Проверяем реальный размер получившегося файла в бакете
                    const metaResult = await s3Client.getObjectMetadata({
                        Bucket: BUCKET,
                        Key: payload.key,
                    })

                    const actualSize = Number(metaResult.InterfaceResult.ContentLength)

                    if (actualSize > MAX_FILE_SIZE) {
                        // Удаляем файл, если он нарушает лимиты
                        await s3Client.deleteObject({ Bucket: BUCKET, Key: payload.key })
                        return res.status(400).json({ error: 'Файл превышает допустимый размер 5 ГБ' })
                    }

                    // const listKey = 'MarketCategory'
                    // const Adapter = new FileAdapter('mim')
                    // Adapter.acl.setMeta('', {
                    //     listkey: 'BillingIntegrationOrganizationContext',
                    //     id: billingIntegrationOrganizationContextId,
                    // })

                    const appClient = appClients[payload.fileClientId]
                    if (!appClient) {
                        return res.status(400).json({ error: 'No or invalid fileClientId' })
                    }
                    const safeName = path.basename(payload.fileName)
                    
                    const mimetype = await detectMimeTypeFromFile(safeName) || payload.fileType || 'application/octet-stream'

                    const updatedId = generateUUIDv4()

                    //         [
                    //     'type FileRecordMetaUser { id: ID! }',
                    //     'type FileSender { dv: Int!, fingerprint: String! }',
                    //     'type FileRecordUserMeta { dv: Int!, sender: FileSender!, user: FileRecordMetaUser!, fileClientId: String!, modelNames: [String!]!, sourceFileClientId: String }',
                    //     'type FileRecordMeta { id: ID!, fileAdapter: String!, recordId: ID, path: String, filename: String!, originalFilename: String, mimetype: String!, encoding: String!, meta: FileRecordUserMeta! }',
                    // ]

                    const fileMeta = { 
                        id: payload.uploadId, 
                        fileAdapter: 'sbercloud', 
                        recordId: generateUUIDv4(), 
                        path: payload.key,
                        filename: payload.fileName,
                        originalFilename: payload.fileName,
                        mimetype,
                        encoding: 'utf-8', // NEED TO USE LIBRARY FOR THAT
                        meta: {
                            dv: 1,
                            sender: { dv: 1, fingerprint: generateUUIDv4() },
                            user: { id: payload.userId },
                            fileClientId: payload.fileClientId,
                            modelNames: ['Invalid model name'],
                            sourceFileClientId: payload.fileClientId,
                            // path: payload.key,
                            // filename: payload.fileName,
                            // originalFilename: payload.fileName,
                            // mimetype,
                            // encoding: 'utf-8', // NEED TO USE LIBRARY FOR THAT
                        },
                    }

                    // res.cookie(`X-Multipart-Upload-${payload.uploadId}-Data`, cookieSignature.sign(JSON.stringify({
                    //     filename: payload.fileName,
                    //     originalFilename: payload.fileName,
                    //     mimetype,
                    //     encoding: 'utf-8', // NEED TO USE LIBRARY FOR THAT
                    //     path: fileUrl,
                    // }), conf.COOKIE_SECRET),
                    // { 
                    //     httpOnly: true,
                    //     maxAge: 5 * 60 * 1000,
                    // }
                    // )
                    await kv.set(`multipart-upload-uuid-to-file-data:${updatedId}`, JSON.stringify({
                        filename: payload.fileName,
                        originalFilename: payload.fileName,
                        mimetype,
                        encoding: 'utf-8', // NEED TO USE LIBRARY FOR THAT
                        path: fileUrl,
                    }), 'EX', 5 * 60 * 1000)


                    console.log('SIGNING WITH APPCLIENT', appClient)
                    const fileFieldData = {
                        id: updatedId,
                        attached: true,
                        signature: jwt.sign(
                            { 
                                id: updatedId, 
                                mimetype, 
                                ...fileMeta.meta,
                            },
                            appClient.secret,
                            { expiresIn: '5m', algorithm: 'HS256' }
                        ),
                        publicSignature: jwt.sign(
                            fileMeta,
                            appClient.secret,
                            { expiresIn: '5m', algorithm: 'HS256' }
                        ),
                    }

                    // Все проверки пройдены!
                    // Возвращаем метаданные для последующей GraphQL-мутации записи в PostgreSQL
                    return res.status(200).json({
                        success: true,
                        fileMeta: {
                            path: payload.key,
                            size: actualSize,
                            fileUrl,
                            Bucket,
                            Key,
                            ETag,
                        },
                        fileFieldData,
                    })
                }

                return res.status(400).json({ error: 'Unknown action' })
            } catch (error) {
                console.error(error)
                return res.status(500).json({ error: error.message || 'Internal Error' })
            }
        }


        app.use('/api/s3-multipart', handler)

        app.set('trust proxy', true)

        return app
    }
}

module.exports = {
    MultiPartMiddleware,
}
