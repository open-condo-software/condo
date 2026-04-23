
const formatDuration = (sec) => {
    if (!sec) return ''
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

export const createImageThumbnailFromUrl = (url: string) => {
    return new Promise<string>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            const SIZE = 400

            canvas.width = SIZE
            canvas.height = SIZE

            const iw = img.width
            const ih = img.height

            // object-fit: cover
            const scale = Math.max(SIZE / iw, SIZE / ih)

            const drawWidth = iw * scale
            const drawHeight = ih * scale

            const offsetX = (SIZE - drawWidth) / 2
            const offsetY = (SIZE - drawHeight) / 2

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

            resolve(canvas.toDataURL('image/jpeg', 0.85))
        }

        img.onerror = reject
        img.src = url
    })
}

export const createVideoThumbnailFromUrl = (url: string) => {
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
            const SIZE = 400

            canvas.width = SIZE
            canvas.height = SIZE

            const vw = video.videoWidth
            const vh = video.videoHeight

            // object-fit: cover
            const scale = Math.max(SIZE / vw, SIZE / vh)

            const drawWidth = vw * scale
            const drawHeight = vh * scale

            const offsetX = (SIZE - drawWidth) / 2
            const offsetY = (SIZE - drawHeight) / 2

            ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)

            // ⏱ Video duration
            const duration = formatDuration(video.duration)

            const scaleFactor = SIZE / 200
            const fontSize = 32 * scaleFactor
            const paddingX = 12 * scaleFactor
            const paddingY = 6 * scaleFactor
            const margin = 12 * scaleFactor
            const borderRadius = 12 * scaleFactor

            ctx.font = `bold ${fontSize}px sans-serif`
            const textWidth = ctx.measureText(duration).width

            const boxWidth = textWidth + paddingX * 2
            const boxHeight = fontSize + paddingY

            const x = SIZE - boxWidth - margin
            const y = SIZE - boxHeight - margin

            ctx.fillStyle = 'rgba(0,0,0,0.75)'

            if (ctx.roundRect) {
                ctx.beginPath()
                ctx.roundRect(x, y, boxWidth, boxHeight, borderRadius)
                ctx.fill()
            } else {
                ctx.fillRect(x, y, boxWidth, boxHeight)
            }

            ctx.fillStyle = '#fff'
            ctx.textBaseline = 'top'
            ctx.fillText(duration, x + paddingX, y + paddingY)

            resolve(canvas.toDataURL('image/jpeg', 0.9))
        }

        video.onerror = reject
    })
}
