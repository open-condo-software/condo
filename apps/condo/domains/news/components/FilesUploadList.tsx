import { GetNewsItemFilesQuery, useCreateNewsItemFileMutation } from '@app/condo/gql'
import { File as FileSchema } from '@app/condo/schema'
import styled from '@emotion/styled'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { Upload } from 'antd'
import { UploadFile } from 'antd/lib/upload/interface'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { ChevronLeft, ChevronRight, Eye, PlusCircle, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { colors } from '@open-condo/ui/colors'

import { shadows, transitions } from '@condo/domains/common/constants/style'
import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'


let ffmpeg: FFmpeg | null = null
let ffmpegLoaded = false

const loadFFmpeg = async () => {
    if (!ffmpeg) {
        ffmpeg = new FFmpeg()
        ffmpeg.on('log', ({ message }) => {
            console.log(message)
        })
    }
    if (!ffmpegLoaded) {
        await ffmpeg.load()
        ffmpegLoaded = true
    }
}

const UploadWrapper = styled.div<{ imageSize: number }>`
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  
  & .ant-upload-list.ant-upload-list-picture-card {
    display: flex;
    flex-direction: row-reverse;
    width: fit-content;
    max-width: 100%;

    & .ant-upload-list-picture-card-container {
      margin: 5px 8px 0 0;
      flex-shrink: 0;
      border-radius: 12px;
      width: ${props => `${props.imageSize}px`};
      height: ${props => `${props.imageSize}px`};

      & .ant-upload-list-item-list-type-picture-card.ant-upload-list-item {
        border-radius: 12px;
        padding: 0;

        .ant-upload-list-item-info {
          border-radius: 12px;
          
          & .ant-upload-list-item-image {
            object-fit: fill;
          }

          &::before {
            background-color: rgba(112, 118, 149, 0.6);
          }
        }

        .ant-upload-list-item-card-actions-btn {
          background-color: ${colors.red[5]};
          padding: 3px;
          border-radius: 100px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: absolute;
          top: -30px;
          right: -34px;
          transition: ${transitions.allDefault};

          &:hover {
            background-color: ${colors.black}
          }
        }
      }
    }

    & .ant-upload.ant-upload-select.ant-upload-select-picture-card {
      flex-shrink: 0;
      border-radius: 12px;
      border: none;
      background-color: ${colors.gray[1]};
      width: ${props => `${props.imageSize}px`};
      height: ${props => `${props.imageSize}px`};
      margin-top: 6px;
    }
  }
`

const ScrollButton = styled.div<{ isLeft?: boolean }>`
  width: fit-content;
  position: absolute;
  top: 27px;
  ${(props) => props.isLeft ? 'left: 0px;' : 'right: 0px;'}
  background: white;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  box-shadow: ${shadows.main};
  cursor: pointer;
  z-index: 1000;
`

const getImagesList = (): HTMLDivElement => {
    return document.querySelector('.upload-images-wrapper')
}

export type UploadFileType = {
    uid: string
    name: string
    status: 'done' | 'uploading'
    url: string
    response: { id: string, url: string, originalName: string, mimetype: string, thumbnail?: string }
    thumbUrl?: string
}

export type DBFile = {
    id: string
    file?: FileSchema
}
type ImagesUploadListProps = {
    type: 'view' | 'upload'
    onFilesChange?: (files: UploadFileType[]) => void
    hideArrows?: boolean
    defaultFileList?: UploadFileType[]
    fileList?: UploadFileType[]
    createAction?: ({ file }: { file: UploadRequestOption['file'] }) => Promise<DBFile>
    imageSize?: number
    updateFileList: React.Dispatch<Action>
    maxCount?: number
}

const formatDuration = (sec) => {
    if (!sec) return ''
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

const getImageThumbnailFromUrl = (url: string) => {
    return new Promise<string>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            const SIZE = 400 // квадрат как в видео

            canvas.width = SIZE
            canvas.height = SIZE

            const iw = img.width
            const ih = img.height

            // =========================
            // 🧠 object-fit: cover
            // =========================

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

const createVideoThumbnailFromUrl = (url: string) => {
    return new Promise<string>((resolve, reject) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        video.preload = 'metadata'
        video.src = url
        video.crossOrigin = 'anonymous' // ВАЖНО для canvas
        video.muted = true
        video.playsInline = true

        video.onloadedmetadata = () => {
            video.currentTime = Math.min(1, video.duration / 2)
        }

        video.onseeked = () => {
            // =========================
            // 🔧 РАЗМЕР ПРЕВЬЮ (КВАДРАТ)
            // =========================
            const SIZE = 400 // итоговый размер превью (квадрат)

            canvas.width = SIZE
            canvas.height = SIZE

            const vw = video.videoWidth
            const vh = video.videoHeight

            // =========================
            // 🧠 ЛОГИКА "object-fit: cover"
            // =========================

            // масштаб — чтобы заполнить квадрат
            const scale = Math.max(SIZE / vw, SIZE / vh)

            const drawWidth = vw * scale
            const drawHeight = vh * scale

            // центрирование
            const offsetX = (SIZE - drawWidth) / 2
            const offsetY = (SIZE - drawHeight) / 2

            // 🎬 рисуем видео без искажений
            ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)

            // =========================
            // ⏱ БЕЙДЖ ДЛИТЕЛЬНОСТИ
            // =========================

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

            // 👉 если браузер поддерживает — рисуем скруглённый прямоугольник
            if (ctx.roundRect) {
                ctx.beginPath()
                ctx.roundRect(x, y, boxWidth, boxHeight, borderRadius)
                ctx.fill()
            } else {
                // fallback
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

async function transcodeVideo (ffmpeg: FFmpeg, inputName, outputName) {
    const getCodec = async (type) => {
        const outputName = `${inputName}_ffprobe_output.json`
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
    }

    const videoCodec = await getCodec('v')
    const audioCodec = await getCodec('a')

    const isH264 = videoCodec === 'h264'
    const isAAC = audioCodec === 'aac'
    const hasAudio = audioCodec !== null

    const args = [
        '-i', inputName,
        '-movflags', 'faststart',
    ]

    // 🔥 1. Идеальный случай — всё копируем
    if (isH264 && (isAAC || !hasAudio)) {
        args.push('-c', 'copy')
    }

    // 🎬 2. Видео ок, аудио нет → только аудио encode
    else if (isH264 && hasAudio && !isAAC) {
        args.push(
            '-c:v', 'copy',
            '-c:a', 'aac'
        )
    }

    // 🎬 3. Видео не ок, аудио ок → только видео encode
    else if (!isH264 && isAAC) {
        args.push(
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-c:a', 'copy'
        )
    }

    // 🐢 4. Всё плохо → encode всё
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

let heic2any: any
const convertFile = async (file: File, onProgress?): Promise<File> => {
    // 🖼 HEIC → JPEG
    if (file.type === 'image/heic') {
        if (!heic2any) {
            heic2any = (await import('heic2any')).default
        }

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
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image()
            i.onload = () => resolve(i)
            i.onerror = reject
            i.src = URL.createObjectURL(file)
        })

        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9)
        })

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

        const onProgressHandler = ({ progress }) => {
            if (progress < 1) {
                onProgress && onProgress({ percent: progress * 0.5 * 100 })
            }
        }

        if (onProgress) {
            ffmpeg.on('progress', onProgressHandler)
        }

        await ffmpeg.writeFile(inputName, await file.bytes())

        await transcodeVideo(ffmpeg, inputName, outputName)

        const data = await ffmpeg.readFile(outputName)

        if (onProgress) {
            ffmpeg.off('progress', onProgressHandler)
        }

        let filename = file.name
        if (file.type === 'video/quicktime') filename = file.name.replace(/\.mov$/i, '.mp4')

        return new File(
            // @ts-ignore
            [data.buffer],
            filename,
            { type: 'video/mp4' }
        )
    }

    return file
}

export const convertFilesToUploadType: (files: GetNewsItemFilesQuery['newsItemFiles']) => UploadFileType[] = (files) => {
    if (!Array.isArray(files)) {
        return []
    }

    return files.map(fileObj => {
        return {
            uid: fileObj?.id,
            id: fileObj?.id,
            name: fileObj?.file?.originalFilename,
            status: 'done',
            url: fileObj?.file?.publicUrl,
            response: { id: fileObj?.id, url: fileObj?.file?.publicUrl, originalName: fileObj?.file?.originalFilename, mimetype: fileObj?.file?.mimetype },
        }
    })
}

type State = {
    added: Array<{ id: string }>
    deleted: Array<{ id: string }>
}

export type Action =
    | { type: 'delete', payload: { id: string } }
    | { type: 'add', payload: { id: string } }
    | { type: 'reset', payload?: undefined }

const reducer = (state: State, action: Action): State => {
    const { type, payload: file } = action
    switch (type) {
        case 'delete': {
            if (file.id) {
                return {
                    ...state,
                    added: state.added.filter(addFile => addFile.id !== file.id),
                    deleted: [...state.deleted, file],
                }
            }

            const fileToDeleteId = (file as any)?.response?.id

            if (!fileToDeleteId) return state

            const fileToDelete = state.added.find(addedFile => addedFile.id === fileToDeleteId)
            return {
                ...state,
                added: state.added.filter(addFile => addFile.id !== fileToDeleteId),
                deleted: [...state.deleted, fileToDelete],
            }
        }
        case 'add':
            return {
                ...state,
                added: [...state.added, file],
            }
        case 'reset':
            return {
                added: [],
                deleted: [],
            }
        default:
            throw new Error(`unknown action ${type}`)
    }
}

const initialState: State = { added: [], deleted: [] }

export const useFilesUploadListHook = () => {
    const [modifiedFiles, dispatch] = useReducer(reducer, initialState)

    return {
        modifyFiles: dispatch,
        modifiedFiles,
    }
}

export const FilesUploadList: React.FC<ImagesUploadListProps> = ({
    type,
    hideArrows,
    onFilesChange,
    defaultFileList,
    fileList,
    createAction,
    imageSize = 80,
    updateFileList,
    maxCount = 10,
}) => {
    const intl = useIntl()
    const FileTooBigErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.FileTooBig' },
        { maxSizeInMb: MAX_UPLOAD_FILE_SIZE / (1024 * 1024) })
    const UploadFailedErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.UploadFailedErrorMessage' })

    const [isReady, setIsReady] = useState<boolean>(!!fileList?.length)
    const [files, setFiles] = useState<UploadFile[]>(fileList || [])
    useDeepCompareEffect(() => {
        setFiles(fileList)
    }, [fileList])

    const imagesListWrapperRef = useRef<HTMLDivElement>()
    const imagesListRef = useRef<HTMLDivElement>()

    const [scrollLeft, setScrollLeft] = useState<number>()
    const [scrollWidth, setScrollWidth] = useState<number>()
    const [clientWidth, setClientWidth] = useState<number>()

    const isScrollActiveX = useMemo(() => scrollWidth > clientWidth, [clientWidth, scrollWidth])
    const isAtStartX = useMemo(() => scrollLeft === 0, [scrollLeft])
    const isAtEndX = useMemo(() => scrollLeft + clientWidth === scrollWidth, [clientWidth, scrollLeft, scrollWidth])

    const handleScrollX = useCallback(() => {
        const container = imagesListWrapperRef.current

        setScrollLeft(container.scrollLeft)
        setScrollWidth(container.scrollWidth)
        setClientWidth(container.clientWidth)
    }, [])

    useEffect(() => {
        if (!imagesListWrapperRef.current) return

        const wrapper = imagesListWrapperRef.current // Store ref in a variable
        const resizeObserver = new ResizeObserver(handleScrollX)
        const imagesList = getImagesList()

        wrapper.addEventListener('scroll', handleScrollX)
        imagesListRef.current = imagesList
        resizeObserver.observe(imagesList)

        return () => {
            if (!wrapper) return

            wrapper.removeEventListener('scroll', handleScrollX)
            resizeObserver.disconnect()
        }
    }, [handleScrollX])

    const handleChevronClick = useCallback((toLeft) => {
        const scrollTo = toLeft ? Math.max(0, scrollLeft - (clientWidth / 2)) :
            Math.min(scrollWidth, scrollLeft + (clientWidth / 2))

        imagesListWrapperRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }, [clientWidth, scrollLeft, scrollWidth])

    const handlePreview = useCallback((file) => {
        const fileUrl = file.url

        if (typeof window !== 'undefined') {
            window.open(fileUrl, '_blank')
        }
    }, [])

    useDeepCompareEffect(() => {
        const process = async () => {
            const updated = await Promise.all(
                (fileList || files).map(async (file) => {
                    if (file.thumbUrl) return file

                    try {
                        let thumb = ''
                        if (file.response?.mimetype?.startsWith('image/')) {
                            thumb = await getImageThumbnailFromUrl(file.url)
                        }
                        if (file.response?.mimetype?.startsWith('video/')) {
                            thumb = await createVideoThumbnailFromUrl(file.url)
                        }

                        if (!thumb) return file

                        return {
                            ...file,
                            thumbUrl: thumb,
                        }
                    } catch (e) {
                        console.error(e)
                        return file
                    }
                })
            )

            setFiles(updated)
            setIsReady(true)
        }

        if ((fileList || files)?.length) {
            process()
        } else {
            setIsReady(true)
        }
    }, [fileList])

    if (!isReady) return null

    return (
        <UploadWrapper
            ref={imagesListWrapperRef}
            imageSize={imageSize}
        >
            {
                !hideArrows && isScrollActiveX && !isAtStartX && (
                    <ScrollButton isLeft onClick={() => handleChevronClick(true)}>
                        <ChevronLeft/>
                    </ScrollButton>
                )
            }
            <div className='upload-images-wrapper'>
                <Upload
                    multiple
                    accept='image/png,image/jpeg,image/heic,video/mp4,video/mov,video/quicktime,application/pdf,text/plain,application/zip,application/x-zip-compressed,application/msword,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    listType='picture-card'
                    maxCount={maxCount}
                    isImageUrl={() => true}
                    showUploadList={{
                        showPreviewIcon: true,
                        previewIcon: <Eye color={colors.white}/>,
                        showRemoveIcon: type === 'upload',
                        removeIcon:<Trash size='small' color={colors.white}/>,
                    }}
                    onRemove={async (file) => {
                        updateFileList({ type: 'delete', payload: file as any })
                        return true
                    }}
                    onChange={(info) => {
                        let fileList = [...info.fileList]
                        fileList = fileList.map(file => {
                            if (get(file, 'response.url')) {
                                file.url = file.response.url
                            }

                            return {
                                ...file,
                            }
                        })

                        if (isFunction(onFilesChange)) {
                            onFilesChange(fileList as UploadFileType[])
                        }

                        setFiles(fileList)
                    }}
                    defaultFileList={defaultFileList}
                    fileList={files}
                    customRequest={async (options) => {
                        const { onSuccess, onError, onProgress } = options

                        if (!isFunction(createAction)) {
                            console.error('Specify createActionProp to upload files')
                            return
                        }

                        onProgress({ percent: 0 })

                        let file = options.file as File

                        try {
                            file = await convertFile(file, onProgress)
                        } catch (error) {
                            console.error('Conversion failed', error)
                            throw error
                        }

                        onProgress({ percent: 50 })

                        if (file.size > 512 * 1024 * 1024) {
                            const error = new Error(FileTooBigErrorMessage)
                            onError(error)
                            return
                        }

                        try {
                            const dbFile = await createAction({ file })

                            // ADD preview
                            let thumbnail = ''
                            if (file.type?.startsWith('image/')) {
                                thumbnail = await getImageThumbnailFromUrl(dbFile?.file?.publicUrl)
                            }
                            if (file.type?.startsWith('video/')) {
                                thumbnail = await createVideoThumbnailFromUrl(dbFile?.file?.publicUrl)
                            }

                            updateFileList({ type: 'add', payload: dbFile })

                            onProgress({ percent: 100 })
                            onSuccess({
                                id: dbFile?.id,
                                url: dbFile?.file?.publicUrl,
                                originalName: dbFile?.file?.originalFilename,
                                mimetype: dbFile?.file?.mimetype,
                                thumbnail: thumbnail,
                            }, null)
                        } catch (err) {
                            const error = new Error(UploadFailedErrorMessage)
                            console.error('Upload failed', err)
                            onError(error)
                        }
                    }}
                    onPreview={handlePreview}
                    // itemRender={customItemRender}
                    iconRender={(file) => {
                        let typeToView = ''
                        if (file.type?.startsWith('video/mp4')) typeToView = 'MP4'
                        if (file.type?.startsWith('image/jpeg')) typeToView = 'JPEG'
                        if (file.type?.startsWith('image/png')) typeToView = 'PNG'
                        if (file.type?.startsWith('application/pdf')) typeToView = 'PDF'
                        if (file.type?.startsWith('text/plain')) typeToView = 'TXT'
                        if (file.type?.startsWith('application/zip')) typeToView = 'ZIP'
                        if (file.type?.startsWith('application/x-zip-compressed')) typeToView = 'ZIP'
                        if (file.type?.startsWith('application/msword')) typeToView = 'DOC'
                        if (file.type?.startsWith('application/vnd.ms-excel')) typeToView = 'XLSX'
                        if (file.type?.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) typeToView = 'DOC'
                        if (file.type?.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) typeToView = 'XLSX'
                        if (typeToView) return <span style={{ fontWeight: 'bold', color: 'grey' }}>{typeToView}</span>
                        return ''
                    }}
                >
                    {(type === 'upload' && (!maxCount || files?.length < maxCount)) ? <PlusCircle/> : null}
                </Upload>
            </div>
            {
                !hideArrows && isScrollActiveX && !isAtEndX && (
                    <ScrollButton onClick={() => handleChevronClick(false)}>
                        <ChevronRight/>
                    </ScrollButton>
                )
            }
        </UploadWrapper>
    )
}
