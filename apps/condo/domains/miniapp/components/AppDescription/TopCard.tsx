import React, { CSSProperties, useCallback, useMemo, useRef, useState } from 'react'
import get from 'lodash/get'
import { CheckOutlined } from '@ant-design/icons'
import { Col, Row, Space, Image } from 'antd'
import type { RowProps } from 'antd'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Tag, Carousel, Button, ButtonProps } from '@open-condo/ui'
import { LABEL_TO_TAG_PROPS, CONTEXT_IN_PROGRESS_STATUS } from '@condo/domains/miniapp/constants'

const ROW_GUTTER: RowProps['gutter'] = [40, 40]
const COL_SPAN_HALF = 12
const BUTTON_SPACING = 60
const TEXT_SPACING = 24
const TAG_SPACING = 8
const IMAGE_STYLES: CSSProperties = { width: '100%', height: 400, objectFit: 'cover' }
const IMAGE_WRAPPER_STYLES: CSSProperties = { borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }
const VERT_ALIGN_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column', justifyContent: 'center' }
const HIDE_GALLERY_STYLES: CSSProperties = { display: 'none' }

type TopCardProps = {
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

const Arrow: React.FC<React.HtmlHTMLAttributes<HTMLDivElement>> = (props) => {
    // TODO (DOMA-4666): Move to icons pack
    return (
        <div {...props} className='preview-arrow'>
            <svg  width='9' height='14' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M1 2.374 5.414 7 1 11.626 2.293 13 8 7 2.293 1 1 2.374Z' fill='currentColor' stroke='currentColor' strokeWidth='.7'/>
            </svg>
        </div>
    )
}
const TopCard = React.memo<TopCardProps>(({
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
    const LabelMessage = label && intl.formatMessage({ id: `miniapps.labels.${label}.name` })

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
        } else {
            btnProps.children = intl.formatMessage({ id: 'miniapps.addDescription.action.connected' })
            btnProps.icon = <CheckOutlined/>
            btnProps.disabled = true
        }

        return btnProps
    }, [appUrl, contextStatus, intl, connectAction])

    const labelTagProps = label && get(LABEL_TO_TAG_PROPS, label, {})
    const images = gallery || []
    const imagesAmount = images.length
    const [currentSlide, setCurrentSlide] = useState(0)
    const [previewVisible, setPreviewVisible] = useState(false)
    const sliderRef = useRef(null)

    const handleSlideChange = useCallback((current, next) => {
        setCurrentSlide(next)
    }, [])
    const enablePreview = useCallback(() => {
        setPreviewVisible(true)
    }, [])

    const handleNextSlide = useCallback(() => {
        setCurrentSlide(curr => (curr + 1) % imagesAmount)
        if (sliderRef.current) {
            sliderRef.current.next()
        }
    }, [imagesAmount])
    const handlePrevSlide = useCallback(() => {
        setCurrentSlide(curr => (imagesAmount + curr - 1) % imagesAmount)
        if (sliderRef.current) {
            sliderRef.current.prev()
        }
    }, [imagesAmount])

    return (
        <Row gutter={ROW_GUTTER}>
            <Col span={COL_SPAN_HALF} style={VERT_ALIGN_STYLES}>
                <Space direction='vertical' size={BUTTON_SPACING}>
                    <Space direction='vertical' size={TEXT_SPACING}>
                        <Space direction='horizontal' size={TAG_SPACING}>
                            <Tag>{CategoryMessage}</Tag>
                            {Boolean(label) && (
                                <Tag {...labelTagProps}>{LabelMessage}</Tag>
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
            <Col span={COL_SPAN_HALF} style={VERT_ALIGN_STYLES}>
                {Boolean(images.length) && (
                    <>
                        <Carousel
                            slidesToShow={1}
                            autoplay={!previewVisible}
                            infinite
                            beforeChange={handleSlideChange}
                            ref={sliderRef}
                        >
                            {images.map((src, idx) => (
                                <Image
                                    style={IMAGE_STYLES}
                                    wrapperStyle={IMAGE_WRAPPER_STYLES}
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
                                    right: <Arrow onClick={handleNextSlide}/>,
                                    left: <Arrow onClick={handlePrevSlide}/>,
                                }}
                                preview={{
                                    visible: previewVisible,
                                    onVisibleChange: setPreviewVisible,
                                    current: currentSlide,
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