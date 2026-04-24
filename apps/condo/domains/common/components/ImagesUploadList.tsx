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

const FILE_UPLOAD_MODEL = 'MarketItemFile'

type ImagesUploadListProps = {
    type: 'view' | 'upload'
    onFilesChange?: (files: UploadFileType[]) => void
    hideArrows?: boolean
    defaultFileList?: UploadFileType[]
    fileList?: UploadFileType[]
    createAction?: ({ file }: { file: UploadFile }) => Promise<DBFile>
    imageSize?: number
}

export const ImagesUploadList: React.FC<ImagesUploadListProps> = ({
    type,
    hideArrows,
    onFilesChange,
    defaultFileList,
    fileList,
    createAction,
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
                    accept='image/*'
                    listType='picture-card'
                    maxCount={20}
                    showUploadList={{
                        showPreviewIcon: true,
                        previewIcon: <Eye color={colors.white}/>,
                        showRemoveIcon: type === 'upload',
                        removeIcon:<Trash size='small' color={colors.white}/>,
                    }}
                    onChange={(info) => {
                        let fileList = [...info.fileList]
                        fileList = fileList.map(file => {
                            if (get(file, 'response.url')) {
                                file.url = file.response.url
                            }

                            return file
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

                        if (!isFunction(createAction)) {
                            console.error('Specify createActionProp to upload files')
                            return
                        }

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

                            const dbFile = await createAction({ file: createInput })
                            onSuccess({ id: dbFile.id, url: dbFile?.file?.publicUrl }, null)
                        } catch (err) {
                            const error = new Error(UploadFailedErrorMessage)
                            console.error('Upload failed', err)
                            onError(error)
                        }
                    }}
                    onPreview={handlePreview}
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
