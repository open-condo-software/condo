import { FFmpeg, ProgressEventCallback } from '@ffmpeg/ffmpeg'
import { UploadRequestOption } from 'rc-upload/lib/interface'


let heic2any = null
let ffmpeg: FFmpeg | null = null
let ffmpegLoadPromise: ReturnType<FFmpeg['load']> | null = null

async function loadHeic2any () {
    if (!heic2any) {
        heic2any = (await import('heic2any')).default
    }
}

// TODO(Doma-13015): add query
const loadFFmpeg = async () => {
    if (!ffmpeg) {
        ffmpeg = new FFmpeg()
        ffmpeg.on('log', ({ message }) => {
            console.log(message)
        })
    }
    if (!ffmpegLoadPromise) {
        ffmpegLoadPromise = ffmpeg.load()
    }
    await ffmpegLoadPromise
}

async function getCodec (type, inputName) {
    const outputName = `${inputName}_ffprobe_output.json`
    try {
        await ffmpeg.ffprobe([
            '-v', 'error',
            '-select_streams', `${type}:0`,
            '-show_entries', 'stream=codec_name',
            '-of', 'json',
            inputName,
            '-o', outputName,
        ])

        const data = await ffmpeg.readFile(outputName)
        const metadata = JSON.parse(new TextDecoder().decode(data as any))

        return metadata.streams?.[0]?.codec_name || null
    } finally {
        await Promise.allSettled([
            ffmpeg.deleteFile(outputName),
        ])
    }
}

async function transcodeVideo (ffmpeg: FFmpeg, inputName, outputName) {
    const videoCodec = await getCodec('v', inputName)
    const audioCodec = await getCodec('a', inputName)

    const isH264 = videoCodec === 'h264'
    const isAAC = audioCodec === 'aac'
    const hasAudio = audioCodec !== null

    const args = [
        '-i', inputName,
        '-movflags', 'faststart',
    ]

    // No encode
    if (isH264 && (isAAC || !hasAudio)) {
        args.push('-c', 'copy')
    }

    // Encode audio only
    else if (isH264 && hasAudio && !isAAC) {
        args.push(
            '-c:v', 'copy',
            '-c:a', 'aac'
        )
    }

    // Encode video only
    else if (!isH264 && isAAC) {
        args.push(
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-c:a', 'copy'
        )
    }

    // Encode audio and video
    else {
        args.push(
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-c:a', 'aac'
        )
    }

    args.push(outputName)

    await ffmpeg.exec(args)
}

export const convertFile = async (file: File, onProgress?: UploadRequestOption['onProgress']): Promise<File> => {
    // 🖼 HEIC → JPEG
    if (file.type === 'image/heic') {
        await loadHeic2any()
        const blob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
        }) as Blob

        return new File(
            [blob],
            file.name.replace(/\.heic$/i, '.jpeg'),
            { type: 'image/jpeg' }
        )
    }

    // 🖼 WebP → JPEG
    if (file.type === 'image/webp') {
        const objectUrl = URL.createObjectURL(file)
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image()
            i.onload = () => resolve(i)
            i.onerror = reject
            i.src = objectUrl
        })
        URL.revokeObjectURL(objectUrl)

        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9)
        })
        if (!blob) throw new Error('Failed to convert WebP to JPEG')

        return new File(
            [blob],
            file.name.replace(/\.webp$/i, '.jpeg'),
            { type: 'image/jpeg' }
        )
    }

    // 🎬 MOV/MP4 → MP4
    if (file.type === 'video/mp4' || file.type === 'video/quicktime') {
        await loadFFmpeg()

        let inputType = 'mp4'
        if (file.type === 'video/quicktime') inputType = 'mov'

        const random = Math.random()
        const inputName = `input_${random}.${inputType}`
        const outputName = `output_${random}.mp4`

        const onProgressHandler: ProgressEventCallback = ({ progress }) => {
            if (progress < 1) {
                onProgress && onProgress({ percent: progress * 0.5 * 100 })
            }
        }

        if (onProgress) {
            ffmpeg.on('progress', onProgressHandler)
        }

        try {
            await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()))

            await transcodeVideo(ffmpeg, inputName, outputName)

            const data = await ffmpeg.readFile(outputName)
            if (typeof data === 'string') {
                throw new Error('Unexpected string payload from ffmpeg.readFile')
            }

            let filename = file.name
            if (file.type === 'video/quicktime') filename = file.name.replace(/\.mov$/i, '.mp4')

            return new File(
                [data],
                filename,
                { type: 'video/mp4' }
            )
        } finally {
            if (onProgress) {
                ffmpeg.off('progress', onProgressHandler)
            }
            // Best-effort cleanup — swallow
            await Promise.allSettled([
                ffmpeg.deleteFile(inputName),
                ffmpeg.deleteFile(outputName),
            ])
        }
    }

    return file
}
