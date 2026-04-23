import React, { useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import styles from './ImageOrVideoPreview.module.css'

import { UploadFileType } from '../FilesUploadList'


const createVideoPreviewFromUrl = (url: string) => {
    return new Promise<string>((resolve, reject) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        video.preload = 'metadata'
        video.src = url
        video.crossOrigin = 'anonymous'
        video.muted = true
        video.playsInline = true

        video.onloadedmetadata = () => {
            video.currentTime = Math.min(1, video.duration / 2)
        }

        video.onseeked = () => {
            const WIDTH = 1280
            const HEIGHT = 720

            canvas.width = WIDTH
            canvas.height = HEIGHT

            const vw = video.videoWidth
            const vh = video.videoHeight

            const scale = Math.max(WIDTH / vw, HEIGHT / vh)

            const drawWidth = vw * scale
            const drawHeight = vh * scale

            const offsetX = (WIDTH - drawWidth) / 2
            const offsetY = (HEIGHT - drawHeight) / 2

            ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)

            resolve(canvas.toDataURL('image/jpeg', 0.9))
        }

        video.onerror = reject
    })
}


type ImageOrVideoPreviewProps = { file: UploadFileType }

export const ImageOrVideoPreview: React.FC<ImageOrVideoPreviewProps> = ({ file }) => {
    const [preview, setPreview] = useState<string>(null)

    useDeepCompareEffect(() => {
        const process = async () => {
            const url = file?.response?.url || file?.url

            let thumb = ''
            if (file.response?.mimetype?.startsWith('image/')) {
                thumb = url
            }
            if (file.response?.mimetype?.startsWith('video/')) {
                thumb = await createVideoPreviewFromUrl(url)
            }

            setPreview(thumb)
        }

        process()
    }, [file])

    return (
        <img src={preview} className={styles.imageOrVideoPreview} />
    )
}
