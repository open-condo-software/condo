import React, { useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import styles from './ImageOrVideoPreview.module.css'

import { UploadFileType } from '../FilesUploadList'


const PREVIEW_CACHE = new Map<string, string>()
export const getImagePreviewFromUrl = (url: string, id?: string) => {
    return new Promise<string>((resolve, reject) => {
        if (id && PREVIEW_CACHE.has(id)) {
            resolve(PREVIEW_CACHE.get(id))
            return
        }

        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            const WIDTH = 1280
            const HEIGHT = 720

            canvas.width = WIDTH
            canvas.height = HEIGHT

            const iw = img.width
            const ih = img.height

            const scale = Math.max(WIDTH / iw, HEIGHT / ih)

            const drawWidth = iw * scale
            const drawHeight = ih * scale

            const offsetX = (WIDTH - drawWidth) / 2
            const offsetY = (HEIGHT - drawHeight) / 2

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

            const resultUrl = canvas.toDataURL('image/jpeg', 0.85)
            PREVIEW_CACHE.set(id, resultUrl)
            resolve(resultUrl)
        }

        img.onerror = reject
        img.src = url
    })
}

export const createVideoPreviewFromUrl = (url: string, id?: string) => {
    return new Promise<string>((resolve, reject) => {
        if (id && PREVIEW_CACHE.has(id)) {
            resolve(PREVIEW_CACHE.get(id))
            return
        }

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

            const resultUrl = canvas.toDataURL('image/jpeg', 0.9)
            PREVIEW_CACHE.set(id, resultUrl)
            resolve(resultUrl)
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
            const id = file?.response?.id || file?.uid

            let thumb = ''
            if (file.response?.mimetype?.startsWith('image/')) {
                thumb = url
            }
            if (file.response?.mimetype?.startsWith('video/')) {
                thumb = await createVideoPreviewFromUrl(url, id)
            }

            setPreview(thumb)
        }

        process()
    }, [file])

    return (
        <img src={preview} className={styles.imageOrVideoPreview} />
    )
}
