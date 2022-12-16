import React, { CSSProperties, useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { CheckOutlined } from '@ant-design/icons'
import { Col, Row, Space, Image } from 'antd'
import type { RowProps, ColProps } from 'antd'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Tag, Carousel, Button } from '@open-condo/ui'
import type { ButtonProps, CarouselRef } from '@open-condo/ui'
// TODO(DOMA-4844): Replace with @open-condo/ui/colors
import { colors } from '@open-condo/ui/dist/colors'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { CONTEXT_IN_PROGRESS_STATUS } from '@condo/domains/miniapp/constants'
import styled from '@emotion/styled'

import { AppLabelTag } from '../AppLabelTag'

const CAROUSEL_CHANGE_DELAY = 6000 // 6 sec
const CAROUSEL_CHANGE_SPEED = 800 // 0.8 sec
const ROW_GUTTER: RowProps['gutter'] = [40, 40]
const HALF_COL_SPAN: ColProps['span'] = 12
const FULL_COL_SPAN: ColProps['span'] = 24
const SPACED_BUTTON_SPACING = 60
const SHRINKED_BUTTON_SPACING = 40
const TEXT_SPACING = 24
const TAG_SPACING = 8
const IMAGE_STYLES: CSSProperties = { width: '100%', height: 400, objectFit: 'cover' }
const IMAGE_WRAPPER_STYLES: CSSProperties = { borderRadius: 12, overflow: 'hidden', width: '100%' }
const IMAGE_WRAPPER_CLICKABLE: CSSProperties = { ...IMAGE_WRAPPER_STYLES, cursor: 'pointer' }
const VERT_ALIGN_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column', justifyContent: 'center' }
const HIDE_GALLERY_STYLES: CSSProperties = { display: 'none' }
const SPACED_ROW_STYLES: CSSProperties = { marginTop: 24 }
const WIDE_DISPLAY_THRESHOLD = 768
const ARROW_REVERSE_STYLES: CSSProperties = { transform: 'scaleX(-1)' }

type TopCardProps = {
    id: string
    type: string
    name: string
    category: string
    label?: string
    description: string
    price?: string
    gallery?: Array<string>
    contextStatus: string | null
    appUrl?: string
    connectAction: () => void
}

const ArrowWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 100%;
  border: 1px solid ${colors.white};
  background: ${colors.white};
  color: ${colors.gray['7']};
  transition-duration: 0.15s, 0.15s;
  transition-property: border-color, color;
  cursor: pointer;
  
  &:hover {
    border-color: ${colors.gray['3']};
    color: ${colors.black};
  }
`

const Arrow: React.FC<React.HtmlHTMLAttributes<HTMLDivElement>> = (props) => {
    // TODO (DOMA-4666): Move to icons pack
    return (
        <ArrowWrapper {...props} className='preview-arrow'>
            <svg  width='9' height='14' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M1 2.374 5.414 7 1 11.626 2.293 13 8 7 2.293 1 1 2.374Z' fill='currentColor' stroke='currentColor' strokeWidth='.7'/>
            </svg>
        </ArrowWrapper>
    )
}
const TopCard = React.memo<TopCardProps>(({
    id,
    type,
    name,
    category,
    label,
    description,
    price,
    gallery,
    contextStatus,
    appUrl,
    connectAction,
}) => {
    const intl = useIntl()
    const CategoryMessage = intl.formatMessage({ id: `miniapps.categories.${category}.name` })
    const router = useRouter()
    const [{ width }, setRef] = useContainerSize()

    const buttonProps = useMemo<ButtonProps>(() => {
        const btnProps: ButtonProps = { type: 'primary' }
        if (!contextStatus) {
            btnProps.children = intl.formatMessage({ id: 'miniapps.addDescription.action.connect' })
            btnProps.onClick = () => {
                connectAction()
            }
        } else if (contextStatus === CONTEXT_IN_PROGRESS_STATUS) {
            btnProps.children = intl.formatMessage({ id: 'miniapps.addDescription.action.inProgress' })
            btnProps.disabled = true
        } else if (appUrl) {
            btnProps.children = intl.formatMessage({ id: 'miniapps.addDescription.action.open' })
            btnProps.onClick = () => {
                router.push(`/miniapps/${id}?type=${type}`)
            }
        } else {
            btnProps.children = intl.formatMessage({ id: 'miniapps.addDescription.action.connected' })
            btnProps.icon = <CheckOutlined/>
            btnProps.disabled = true
        }

        return btnProps
    }, [id, type, appUrl, contextStatus, connectAction, intl, router])

    const images = gallery || []
    const imagesAmount = images.length
    const [currentSlide, setCurrentSlide] = useState(0)
    const [currentPreview, setCurrentPreview] = useState(0)
    const [previewVisible, setPreviewVisible] = useState(false)
    const sliderRef = useRef<CarouselRef>(null)
    const isWide = width > WIDE_DISPLAY_THRESHOLD

    // NOTE: Carousel / preview logic
    // Clicking on carousel slide opens preview at the same picture and stops carousel from autoplay
    // Changing preview images does not affect carousel slide
    // Closing preview resuming carousel autoplay

    const handleSlideChange = useCallback((current, next) => {
        setCurrentSlide(next)
    }, [])

    const enablePreview = useCallback(() => {
        if (isWide) {
            setPreviewVisible(true)
            setCurrentPreview(currentSlide)
        }
    }, [isWide, currentSlide])

    const handleNextPreview = useCallback(() => {
        setCurrentPreview(curr => (curr + 1) % imagesAmount)
    }, [imagesAmount])

    const handlePrevPreview = useCallback(() => {
        setCurrentPreview(curr => (curr + imagesAmount - 1) % imagesAmount)
    }, [imagesAmount])

    const sectionSpan = isWide ? HALF_COL_SPAN : FULL_COL_SPAN
    const buttonSpacing = isWide ? SPACED_BUTTON_SPACING : SHRINKED_BUTTON_SPACING
    const rowStyles = isWide ? undefined : SPACED_ROW_STYLES

    return (
        <Row gutter={ROW_GUTTER} ref={setRef} style={rowStyles}>
            <Col span={sectionSpan} style={VERT_ALIGN_STYLES}>
                <Space direction='vertical' size={buttonSpacing}>
                    <Space direction='vertical' size={TEXT_SPACING}>
                        <Space direction='horizontal' size={TAG_SPACING}>
                            <Tag>{CategoryMessage}</Tag>
                            {Boolean(label) && (
                                <AppLabelTag type={label}/>
                            )}
                        </Space>
                        <Typography.Title level={1}>
                            {name}
                        </Typography.Title>
                        <Typography.Paragraph type='secondary'>
                            {description}
                        </Typography.Paragraph>
                        {Boolean(price) && (
                            <Typography.Title level={3}>
                                {price}
                            </Typography.Title>
                        )}
                    </Space>
                    <Button {...buttonProps}/>
                </Space>
            </Col>
            <Col span={sectionSpan} style={VERT_ALIGN_STYLES}>
                {Boolean(images.length) && (
                    <>
                        <Carousel
                            slidesToShow={1}
                            autoplay={!previewVisible}
                            autoplaySpeed={CAROUSEL_CHANGE_DELAY}
                            speed={CAROUSEL_CHANGE_SPEED}
                            infinite
                            beforeChange={handleSlideChange}
                            ref={sliderRef}
                            effect='fade'
                        >
                            {images.map((src, idx) => (
                                <Image
                                    style={IMAGE_STYLES}
                                    wrapperStyle={isWide ? IMAGE_WRAPPER_CLICKABLE : IMAGE_WRAPPER_STYLES}
                                    key={idx}
                                    src={src}
                                    preview={false}
                                    onClick={enablePreview}
                                />
                            ))}
                        </Carousel>
                        <div style={HIDE_GALLERY_STYLES}>
                            <Image.PreviewGroup
                                icons={{
                                    right: <Arrow onClick={handleNextPreview}/>,
                                    left: <Arrow style={ARROW_REVERSE_STYLES} onClick={handlePrevPreview}/>,
                                }}
                                preview={{
                                    visible: previewVisible,
                                    onVisibleChange: setPreviewVisible,
                                    current: currentPreview,
                                }}>
                                {images.map((src, idx) => (
                                    <Image
                                        wrapperStyle={IMAGE_WRAPPER_STYLES}
                                        key={idx}
                                        src={src}
                                    />
                                ))}
                            </Image.PreviewGroup>
                        </div>
                    </>
                )}
            </Col>
        </Row>
    )
})

TopCard.displayName = 'TopCard'

export {
    TopCard,
}