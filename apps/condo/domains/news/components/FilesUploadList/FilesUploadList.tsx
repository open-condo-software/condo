import { File as FileSchema } from '@app/condo/schema'
import { Upload } from 'antd'
import { UploadFile } from 'antd/lib/upload/interface'
import classNames from 'classnames'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { ChevronLeft, ChevronRight, Eye, PlusCircle, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { colors } from '@open-condo/ui/colors'

import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'

import styles from './FilesUploadList.module.css'
import { Action } from './hooks/useModifiedFiles'
import { convertFile } from './utils/fileConversion'
import { createImageThumbnailFromUrl, createVideoThumbnailFromUrl } from './utils/thumbnails'


const ALLOWED_TYPES = [
    'image/png',
    'image/jpeg',
    'image/heic',
    'image/webp',
    'video/mp4',
    'video/mov',
    'video/quicktime',
    'application/pdf',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const ALLOWED_TYPES_AS_STRING = ALLOWED_TYPES.join(',')

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
    updateFileList: React.Dispatch<Action>
    maxCount?: number
}

const iconRender = (file) => {
    const mimetype = file?.type || file.response?.mimetype
    let typeToView = ''
    if (mimetype?.startsWith('video/mp4')) typeToView = 'MP4'
    if (mimetype?.startsWith('image/jpeg')) typeToView = 'JPEG'
    if (mimetype?.startsWith('image/png')) typeToView = 'PNG'
    if (mimetype?.startsWith('application/pdf')) typeToView = 'PDF'
    if (mimetype?.startsWith('text/plain')) typeToView = 'TXT'
    if (mimetype?.startsWith('application/zip')) typeToView = 'ZIP'
    if (mimetype?.startsWith('application/x-zip-compressed')) typeToView = 'ZIP'
    if (mimetype?.startsWith('application/msword')) typeToView = 'DOC'
    if (mimetype?.startsWith('application/vnd.ms-excel')) typeToView = 'XLSX'
    if (mimetype?.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) typeToView = 'DOC'
    if (mimetype?.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) typeToView = 'XLSX'
    if (typeToView) return <span className={styles.uploadIcon}>{typeToView}</span>
    return ''
}

async function tryCreateThumbnailFromUrl (type, url) {
    try {
        if (type?.startsWith('image/')) {
            return await createImageThumbnailFromUrl(url)
        }
        if (type?.startsWith('video/')) {
            return await createVideoThumbnailFromUrl(url)
        }
    } catch (error) {
        console.log('Cannot create thumbnail from url')
        console.error(error)
    }
}

export const FilesUploadList: React.FC<ImagesUploadListProps> = ({
    type,
    hideArrows,
    onFilesChange,
    defaultFileList,
    fileList,
    createAction,
    updateFileList,
    maxCount = 10,
}) => {
    const intl = useIntl()
    // TODO(Doma-13015): increase MAX_UPLOAD_FILE_SIZE
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
                            thumb = await createImageThumbnailFromUrl(file.url)
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
        <div
            className={styles.uploadWrapper}
            ref={imagesListWrapperRef}
        >
            {
                !hideArrows && isScrollActiveX && !isAtStartX && (
                    <div className={classNames(styles.scrollButton, styles.scrollButtonLeft)} onClick={() => handleChevronClick(true)}>
                        <ChevronLeft/>
                    </div>
                )
            }
            <div className='upload-images-wrapper'>
                <Upload
                    multiple
                    accept={ALLOWED_TYPES_AS_STRING}
                    listType='picture-card'
                    maxCount={maxCount}
                    isImageUrl={(file: UploadFile) => {
                        const mimetype = file?.type || file?.response?.mimetype
                        return ['image/', 'video/'].some((type) => mimetype?.startsWith(type))
                    }}
                    showUploadList={{
                        showPreviewIcon: true,
                        previewIcon: <Eye color={colors.white}/>,
                        showRemoveIcon: type === 'upload',
                        removeIcon:<Trash size='small' color={colors.white}/>,
                    }}
                    onRemove={async (file) => {
                        updateFileList({ type: 'delete', payload: file })
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
                            const errorMessage = new Error(UploadFailedErrorMessage)
                            onError(errorMessage)
                            return
                        }

                        onProgress({ percent: 50 })

                        // TODO(Doma-13015): add custom size by types
                        if (file.size > MAX_UPLOAD_FILE_SIZE) {
                            const error = new Error(FileTooBigErrorMessage)
                            onError(error)
                            return
                        }

                        try {
                            const dbFile = await createAction({ file })

                            const thumbnail = (await tryCreateThumbnailFromUrl(file.type, dbFile?.file?.publicUrl)) || ''

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
                    iconRender={iconRender}
                >
                    {(type === 'upload' && (!maxCount || files?.length < maxCount)) ? <PlusCircle/> : null}
                </Upload>
            </div>
            {
                !hideArrows && isScrollActiveX && !isAtEndX && (
                    <div className={classNames(styles.scrollButton, styles.scrollButtonRight)} onClick={() => handleChevronClick(false)}>
                        <ChevronRight/>
                    </div>
                )
            }
        </div>
    )
}
