import { useCreateNewsItemFileMutation, useUpdateNewsItemFileMutation } from '@app/condo/gql'
import { File as FileSchema } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Upload } from 'antd'
import { UploadFile } from 'antd/lib/upload/interface'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import getConfig from 'next/config'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { buildMeta, upload as uploadFiles } from '@open-condo/files'
import { ChevronLeft, ChevronRight, Eye, PlusCircle, Trash } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { colors } from '@open-condo/ui/colors'


import { shadows, transitions } from '@condo/domains/common/constants/style'
import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'

import styles from './FilesUploadList.module.css'

const { publicRuntimeConfig: { fileClientId } = {} } = getConfig()

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
    response: { id: string, url: string }
}

export type DBFile = {
    id: string
    file?: FileSchema
}

const FILE_UPLOAD_MODEL = 'NewsItemFile'

type ImagesUploadListProps = {
    type: 'view' | 'upload'
    onFilesChange?: (files: UploadFileType[]) => void
    hideArrows?: boolean
    defaultFileList?: UploadFileType[]
    fileList?: UploadFileType[]
    createAction?: ({ file }: { file: UploadFile }) => Promise<DBFile>
    imageSize?: number
}

const formatDuration = (sec) => {
    if (!sec) return ''
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

const customItemRender = (originNode, file, fileList, actions) => {
    const hasThumb = !!file.thumbUrl || !!file.url
    const isVideo = file.type?.startsWith('video/')

    const getFileIcon = () => {
        if (file.type?.startsWith('image/')) return '🖼'
        if (isVideo) return '🎬'
        if (file.type?.startsWith('audio/')) return '🎵'
        if (file.type === 'application/pdf') return '📄'
        if (file.name.match(/\.(zip|rar|7z)$/i)) return '🗜'
        return '📁'
    }

    return (
        <div
            className={`${styles.uploadItem} ${
                hasThumb
                    ? styles.uploadItemWithThumb
                    : styles.uploadItemNoThumb
            }`}
        >
            <div className={styles.mediaWrapper}>
                {hasThumb ? (
                    <img
                        src={file.thumbUrl || file.url}
                        alt={file.name}
                        className={styles.image}
                    />
                ) : (
                    <div className={styles.iconWrapper}>
                        {getFileIcon()}
                    </div>
                )}

                {/* Длительность */}
                {isVideo && file.videoMeta?.duration && hasThumb && (
                    <div className={styles.duration}>
                        {formatDuration(file.videoMeta.duration)}
                    </div>
                )}

                {/* Hover overlay */}
                <div className={styles.hoverOverlay}>
                    <div
                        onClick={actions.preview}
                        className={`${styles.actionButton} ${styles.eyeButton}`}
                    >
                        👁
                    </div>

                    <div
                        onClick={actions.remove}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                        ✕
                    </div>
                </div>
            </div>

            {!hasThumb && (
                <div className={styles.fileName} title={file.name}>
                    {file.name}
                </div>
            )}
        </div>
    )
}

const getImageThumbnail: (file) => Promise<string> = (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const reader = new FileReader()

        reader.onload = (e) => {
            // @ts-ignore
            img.src = e.target.result
        }

        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            const MAX_WIDTH = 400
            const scale = Math.min(1, MAX_WIDTH / img.width)

            canvas.width = img.width * scale
            canvas.height = img.height * scale

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            resolve(canvas.toDataURL('image/jpeg', 0.85) as string)
        }

        img.onerror = reject
        reader.onerror = reject

        reader.readAsDataURL(file)
    })
}

const createVideoThumbnail: (file) => Promise<string> = (file) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        video.preload = 'metadata'
        video.src = URL.createObjectURL(file)
        video.muted = true
        video.playsInline = true

        video.onloadedmetadata = () => {
            file.videoMeta = { duration: video.duration }

            const safeTime = Math.min(1, video.duration / 2)
            video.currentTime = safeTime
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

            URL.revokeObjectURL(video.src)
            resolve(canvas.toDataURL('image/jpeg', 0.9) as string)
        }

        video.onerror = reject
    })
}

export const FilesUploadList: React.FC<ImagesUploadListProps> = ({
    type,
    hideArrows,
    onFilesChange,
    defaultFileList,
    fileList,
    // createAction,
    imageSize = 80,
}) => {
    const intl = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()
    const FileTooBigErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.FileTooBig' },
        { maxSizeInMb: MAX_UPLOAD_FILE_SIZE / (1024 * 1024) })
    const UploadFailedErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.UploadFailedErrorMessage' })

    const [files, setFiles] = useState<UploadFile[]>(fileList)
    useDeepCompareEffect(() => {
        setFiles(fileList)
    }, [fileList])

    const [createNewsItemFile] = useCreateNewsItemFileMutation()
    const [updateNewsItemFile] = useUpdateNewsItemFileMutation()

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
                    accept='image/*,video/*,application/pdf,text/plain,application/zip,application/x-zip-compressed,application/msword,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    listType='picture-card'
                    maxCount={20}
                    showUploadList={{
                        showPreviewIcon: true,
                        previewIcon: <Eye color={colors.white}/>,
                        showRemoveIcon: type === 'upload',
                        removeIcon:<Trash size='small' color={colors.white}/>,
                    }}
                    onRemove={async (file) => {
                        const newsItemFileId = file?.response?.id

                        const sender = getClientSideSenderInfo()
                        const dvAndSender = { dv: 1, sender }

                        try {
                            const deletedFile = await updateNewsItemFile({
                                variables: {
                                    id: newsItemFileId,
                                    data: {
                                        ...dvAndSender,
                                        deletedAt: new Date().toISOString(),
                                    },
                                },
                            })

                            if (deletedFile.errors) {
                                return false
                            }
                        } catch (error) {
                            console.log(error)
                            return false
                        }

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
                                // @ts-ignore
                                duration: file?.videoMeta?.duration,
                            }
                        })

                        if (isFunction(onFilesChange)) {
                            onFilesChange(fileList as UploadFileType[])
                        }

                        setFiles(fileList)
                    }}
                    defaultFileList={defaultFileList}
                    fileList={fileList || files}
                    customRequest={async (options) => {
                        const { onSuccess, onError } = options
                        const file = options.file as File

                        // if (!isFunction(createAction)) {
                        //     console.error('Specify createActionProp to upload files')
                        //     return
                        // }

                        if (file.size > MAX_UPLOAD_FILE_SIZE) {
                            const error = new Error(FileTooBigErrorMessage)
                            onError(error)
                            return
                        }

                        try {
                            let createInput

                            if (fileClientId && user?.id) {
                                const senderInfo = getClientSideSenderInfo()
                                const uploadResult = await uploadFiles({
                                    files: [file],
                                    meta: buildMeta({
                                        userId: user.id,
                                        fileClientId,
                                        modelNames: [FILE_UPLOAD_MODEL],
                                        fingerprint: senderInfo.fingerprint,
                                        organizationId: organization?.id,
                                    }),
                                })
                                createInput = {
                                    signature: uploadResult.files?.[0]?.signature,
                                    originalFilename: file.name,
                                    mimetype: file.type,
                                }
                            } else {
                                createInput = file
                            }

                            const sender = getClientSideSenderInfo()
                            const dvAndSender = { dv: 1, sender }

                            const dbFile = await createNewsItemFile({
                                variables: {
                                    data: {
                                        ...dvAndSender,
                                        file: createInput,
                                    },
                                },
                            })

                            // const dbFile = await createAction({ file: createInput })
                            onSuccess({ id: dbFile?.data?.newsItemFile?.id, url: dbFile?.data?.newsItemFile?.file?.publicUrl }, null)
                        } catch (err) {
                            const error = new Error(UploadFailedErrorMessage)
                            console.error('Upload failed', err)
                            onError(error)
                        }
                    }}
                    onPreview={handlePreview}
                    // itemRender={customItemRender}
                    // @ts-ignore
                    previewFile={async (file) => {
                        if (file.type?.startsWith('image/')) return getImageThumbnail(file)
                        if (file.type?.startsWith('video/')) return createVideoThumbnail(file) // сохраняет file.videoMeta.duration
                        return null
                    }}
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
                        return '📄'
                    }}
                >
                    {type === 'upload' ? <PlusCircle/> : null}
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
