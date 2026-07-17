import { Upload, message } from 'antd'
import axios from 'axios'
import React from 'react'

const CHUNK_SIZE = 10 * 1024 * 1024 // 10 МБ (Минимум для S3 — 5 МБ)

const ResumableMultipartUploader = () => {

    const handleCustomUpload = async (options) => {
        const { file, onSuccess, onError, onProgress } = options

        try {
            // Создаем уникальный ключ для файла, чтобы искать его в localStorage при перезагрузке
            const storageKey = `s3_upload_${file.name}_${file.size}`
            const session = JSON.parse(localStorage.getItem(storageKey))

            let uploadToken = session?.uploadToken
            let key = session?.key
            let uploadedParts = session?.uploadedParts || [] // Массив уже загруженных [{PartNumber, ETag}]

            // Если сессии в localStorage нет, создаем новую на бэкенде
            if (!uploadToken) {
                const startRes = await fetch('/api/s3-multipart?action=start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type,
                    }),
                })
                const json = await startRes.json()
                uploadToken = json.uploadToken
                key = json.key
                uploadedParts = []

                localStorage.setItem(storageKey, JSON.stringify({ uploadToken, key, uploadedParts }))
            }

            const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      
            // Начинаем цикл по всем кускам файла
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const partNumber = chunkIndex + 1

                // Если этот кусок уже был успешно загружен ранее (до рефреша страницы), пропускаем его
                const isAlreadyUploaded = uploadedParts.some(p => p.PartNumber === partNumber)
                if (isAlreadyUploaded) continue

                // Вырезаем бинарный кусок из файла
                const start = chunkIndex * CHUNK_SIZE
                const end = Math.min(start + CHUNK_SIZE, file.size)
                const chunkBlob = file.slice(start, end)

                // 1. Просим у сервера подписанную ссылку конкретно под этот кусок
                const urlRes = await fetch('/api/s3-multipart?action=get-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uploadToken,
                        key,
                        partNumber,
                    }),
                })
                const json = await urlRes.json()
                const { uploadUrl } = json

                // 2. Загружаем бинарный кусок методом PUT напрямую в S3
                const chunkResponse = await axios.put(uploadUrl, chunkBlob, {
                    headers: { 'Content-Type': null },
                    onUploadProgress: (event) => {
                        // Считаем общий прогресс с учетом уже загруженных кусков
                        const currentLoaded = start + event.loaded
                        const percent = Math.floor((currentLoaded / file.size) * 100)
                        onProgress({ percent: Math.min(percent, 99) }) // 100% будет после склейки
                    },
                })

                // 3. AWS S3 в ответе на PUT-запрос возвращает заголовок ETag. Он критически важен для склейки.
                console.log(chunkResponse)
                const eTag = chunkResponse.headers.etag || chunkResponse.headers.Etag

                // Сохраняем информацию о загруженном чанке
                uploadedParts.push({ PartNumber: partNumber, ETag: eTag })
        
                // Обновляем localStorage, чтобы в случае падения страницы прогресс не потерялся
                localStorage.setItem(storageKey, JSON.stringify({ uploadToken, key, uploadedParts }))
            }

            // Сортируем куски по порядку (требование AWS S3)
            uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber)

            // 4. Финал: Отправляем запрос серверу на сборку файла из кусков
            await axios.post('/api/s3-multipart?action=complete', {
                uploadToken,
                key,
                parts: uploadedParts,
            })

            // Удаляем сессию из кэша, так как загрузка успешно завершена
            localStorage.removeItem(storageKey)

            // 5. Здесь вы вызываете вашу GraphQL-мутацию KeystoneJS, 
            // передавая готовые метаданные (путь, размер, имя), как мы разбирали ранее
            // await createTicketFile({ variables: { data: { file: { path: key, size: file.size, ... } } } })

            onSuccess('OK')
            message.success(`Файл ${file.name} полностью загружен и склеен!`)
        } catch (error) {
            console.error(error)
            onError(error)
            message.error('Ошибка при загрузке файла.')
        }
    }

    return (
        <Upload customRequest={handleCustomUpload}>
            <button type='button'>Загрузить большой файл с дозагрузкой</button>
        </Upload>
    )
}

const TestMultipartPage: React.FC = () => {
   
    
    return <ResumableMultipartUploader/>
}

export default TestMultipartPage
