import styled from '@emotion/styled'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight, Eye, PlusCircle, Trash } from '@open-condo/icons'
import { colors } from '@open-condo/ui/dist/colors'

import { shadows, transitions } from '@condo/domains/common/constants/style'

import { DBFile, IUploadComponentProps, UploadListFile } from './MultipleFileUpload'


const UploadWrapper = styled.div`
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
      width: 80px;
      height: 80px;

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
      width: 80px;
      height: 80px;
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

const RemoveIcon = () => <Trash size='small' color={colors.white}/>

const getImagesList = (): HTMLDivElement => {
    return document.querySelector('.upload-control-wrapper')
}

type ImagesUploadListProps = {
    UploadComponent: React.FC<IUploadComponentProps>
    type: 'view' | 'upload'
    fileList?: DBFile[]
    hideArrows?: boolean
}

export const ImagesUploadList: React.FC<ImagesUploadListProps> = ({ UploadComponent, type, fileList, hideArrows }) => {
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
        const resizeObserver = new ResizeObserver(handleScrollX)

        imagesListWrapperRef.current.addEventListener('scroll', handleScrollX)
        imagesListRef.current = getImagesList()
        resizeObserver.observe(imagesListRef.current)

        return () => {
            imagesListWrapperRef.current.removeEventListener('scroll', handleScrollX)
            resizeObserver.disconnect()
        }
    }, [handleScrollX])

    const handleChevronClick = useCallback((toLeft) => {
        const scrollTo = toLeft ? Math.max(0, scrollLeft - (clientWidth / 2)) :
            Math.min(scrollWidth, scrollLeft + (clientWidth / 2))

        imagesListWrapperRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }, [clientWidth, scrollLeft, scrollWidth])

    const fileListProps = fileList ? { fileList } : {}

    return (
        <UploadWrapper
            ref={imagesListWrapperRef}
        >
            {
                !hideArrows && isScrollActiveX && !isAtStartX && (
                    <ScrollButton isLeft onClick={() => handleChevronClick(true)}>
                        <ChevronLeft/>
                    </ScrollButton>
                )
            }
            <UploadComponent
                uploadProps={{
                    listType: 'picture-card',
                    accept: 'image/*',
                }}
                showUploadListProps={{
                    showPreviewIcon: true,
                    previewIcon: <Eye color={colors.white}/>,
                    showRemoveIcon: type === 'upload',
                }}
                UploadButton={type === 'upload' ? <PlusCircle/> : null}
                RemoveIcon={RemoveIcon}
                {...fileListProps}
            />
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