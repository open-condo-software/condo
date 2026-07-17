const crypto = require('crypto')

const ObsClient = require('esdk-obs-nodejs')
const express = require('express')

const conf = require('@open-condo/config')
const { generateUUIDv4 } = require('@open-condo/miniapp-utils/helpers/uuid')

/**
 * @param {ObsClient} self 
 * @param {keyof ObsClient} fnName 
 * @param  {Parameters<ObsClient[fnName]>} args 
 * @returns 
 */
function promisify (self, fnName, ...args) {
    return new Promise((res, rej) => self[fnName](...args, (reason, result) => reason ? rej(reason) : res(result)))
}


class MultiPartMiddleware {
    prepareMiddleware ({ keystone }) {
        // this route can not be used for csrf attack (use oidc-client library to handle auth flows properly)
        // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
        const app = express()
        
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


        const BUCKET = conf.OBS_BUCKET_NAME
        const MAX_FILE_SIZE = 5 * 1073741824 // Лимит 1 ГБ в байтах
        const SECRET = process.env.INTERNAL_SIGNING_SECRET || 'fallback-super-secret-key'
        console.log('BUCKET', BUCKET)
        // Функция генерации токена безопасности
        function createUploadToken (uploadId, key, userId) {
            const payload = {
                uploadId,
                key,
                userId,
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

        async function handler (req, res) {
            const initialJson = res.json.bind(res)
            res.json = (...args) => {
                console.log('res.json()', ...args)
                console.log(new Error().stack)
                return initialJson(...args)
            }
            console.log('IN HANDLER')
            console.log('req.body', req.body)
            const { action } = req.query
            if (req.method !== 'POST') return res.status(405).end()

            // Имитация получения ID пользователя из сессии вашего Condo/Keystone приложения
            const currentUserId = req.user?.id || 'anonymous_user'

            try {
                // -------------------------------------------------------------
                // 1. СТАРТ: Инициализация мультипарта в OBS
                // -------------------------------------------------------------
                if (action === 'start') {
                    const { fileName, fileType } = req.body
                    const fileId = generateUUIDv4()
                    const extension = fileName.split('.').pop()
                    const s3Key = `uploads/${fileId}.${extension}`

                    const result = await promisify(s3Client, 'initiateMultipartUpload', {
                        Bucket: BUCKET,
                        Key: s3Key,
                        ContentType: fileType,
                        // signature: 'v4',
                        // signatureContext: { signature: 'v4' }
                    })

                    console.log('start result', result)

                    if (result.CommonMsg.Status >= 300) {
                        return res.status(500).json({ error: result.CommonMsg.Code })
                    }

                    const uploadId = result.InterfaceResult.UploadId
                    const uploadToken = createUploadToken(uploadId, s3Key, currentUserId)

                    return res.status(200).json({ uploadToken, key: s3Key })
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

                    // Все проверки пройдены! 
                    // Возвращаем метаданные для последующей GraphQL-мутации записи в PostgreSQL
                    return res.status(200).json({
                        success: true,
                        fileMeta: {
                            path: payload.key,
                            size: actualSize,
                        },
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
