import { CheckOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Col, Row, Space, Image } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { HtmlHTMLAttributes, CSSProperties, useCallback, useMemo, useRef, useState } from 'react'

import { ChevronRight } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Tag, Carousel, Button } from '@open-condo/ui'
import type { ButtonProps, CarouselRef } from '@open-condo/ui'
// TODO(DOMA-4844): Replace with @open-condo/ui/colors
import { colors } from '@open-condo/ui/colors'

import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { CONTEXT_IN_PROGRESS_STATUS } from '@condo/domains/miniapp/constants'
import { NoSubscriptionTooltip } from '@condo/domains/subscription/components'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

import { AppLabelTag } from '../AppLabelTag'

import type { B2BAppLabelType } from '@app/condo/schema'
import type { RowProps, ColProps } from 'antd'


const CAROUSEL_CHANGE_DELAY_IN_MS = 6000 // 6 sec
const CAROUSEL_CHANGE_SPEED_IN_MS = 800 // 0.8 sec
const ROW_GUTTER: RowProps['gutter'] = [40, 40]
const HALF_COL_SPAN: ColProps['span'] = 12
const FULL_COL_SPAN: ColProps['span'] = 24
const SPACED_BUTTON_SPACING = 60
const SHRINKED_BUTTON_SPACING = 40
const TEXT_SPACING = 24
const TAG_SPACING = 8
const IMAGE_SIZE_LG_THRESHOLD = 500
const IMAGE_SIZE_MD_THRESHOLD = 400
const BASE_IMAGE_STYLES: CSSProperties = { width: '100%', objectFit: 'cover' }
const LARGE_IMAGE_STYLES: CSSProperties = { ...BASE_IMAGE_STYLES, height: 400 }
const MID_IMAGE_STYLES: CSSProperties = { ...BASE_IMAGE_STYLES, height: 300 }
const SMALL_IMAGE_STYLES: CSSProperties = { ...BASE_IMAGE_STYLES, height: 275 }
const IMAGE_WRAPPER_STYLES: CSSProperties = { borderRadius: 12, overflow: 'hidden', width: '100%' }
const IMAGE_WRAPPER_CLICKABLE: CSSProperties = { ...IMAGE_WRAPPER_STYLES, cursor: 'pointer' }
const VERT_ALIGN_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column', justifyContent: 'center' }
const HIDE_GALLERY_STYLES: CSSProperties = { display: 'none' }
const SPACED_ROW_STYLES: CSSProperties = { marginTop: 24 }
const WIDE_DISPLAY_THRESHOLD = 768
const ARROW_REVERSE_STYLES: CSSProperties = { transform: 'scaleX(-1)' }

type TopCardProps = {
    id: string
    name: string
    category: string
    label?: B2BAppLabelType
    description?: string
    price?: string
    gallery?: Array<string>
    contextStatus: string | null
    appUrl?: string
    accessible: boolean
    connectAction: () => void
}

type ArrowProps = HtmlHTMLAttributes<HTMLDivElement> & {
    size?: 'medium' | 'large'
}

const ArrowWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
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

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`

const Arrow: React.FC<ArrowProps> = ({ size = 'large', ...props }) => {
    return (
        <ArrowWrapper {...props} className='preview-arrow'>
            <ChevronRight size={size} />
        </ArrowWrapper>
    )
}

const getImageSize = (width: number) => {
    if (width > IMAGE_SIZE_LG_THRESHOLD) {
        return LARGE_IMAGE_STYLES
    } else if (width > IMAGE_SIZE_MD_THRESHOLD) {
        return MID_IMAGE_STYLES
    } else {
        return SMALL_IMAGE_STYLES
    }
}

const TopCard = React.memo<TopCardProps>(({
    id,
    name,
    category,
    label,
    description,
    price,
    gallery,
    contextStatus,
    appUrl,
    accessible,
    connectAction,
}) => {
    const intl = useIntl()
    const CategoryMessage = intl.formatMessage({ id: `miniapps.categories.${category}.name` as FormatjsIntl.Message['ids'] })
    const UnavailableForTariffMessage = intl.formatMessage({ id: 'miniapps.addDescription.action.unavailableForTariff' })
    const userOrganization = useOrganization()
    const canManageB2BApps = get(userOrganization, ['link', 'role', 'canManageB2BApps'], false)
    const { isB2BAppEnabled } = useOrganizationSubscription()
    const isAppAvailableForTariff = isB2BAppEnabled(id)

    const router = useRouter()
    const [{ width: contentWidth }, setContentRef] = useContainerSize()
    const [{ width: carouselColWidth }, setCarouselColRef] = useContainerSize()

    const buttonProps = useMemo<ButtonProps>(() => {
        const btnProps: ButtonProps = { type: 'primary' }
        
        if (!isAppAvailableForTariff) {
            btnProps.children = UnavailableForTariffMessage
            btnProps.disabled = true
            return btnProps
        }

        if (!contextStatus) {
            btnProps.children = intl.formatMessage({ id: 'miniapps.addDescription.action.connect' })
            btnProps.disabled = !canManageB2BApps
            btnProps.onClick = () => {
                connectAction()
            }
        } else if (contextStatus === CONTEXT_IN_PROGRESS_STATUS) {
            btnProps.children = intl.formatMessage({ id: 'miniapps.addDescription.action.inProgress' })
            btnProps.disabled = true
        } else if (appUrl) {
            btnProps.children = intl.formatMessage({ id: 'miniapps.addDescription.action.open' })
            btnProps.disabled = !accessible
            btnProps.onClick = () => {
                router.push(`/miniapps/${id}`)
            }
        } else {
            btnProps.children = intl.formatMessage({ id: 'miniapps.addDescription.action.connected' })
            btnProps.icon = <CheckOutlined/>
            btnProps.disabled = true
        }

        return btnProps
    }, [id, appUrl, contextStatus, connectAction, intl, router, canManageB2BApps, accessible, isAppAvailableForTariff, UnavailableForTariffMessage])

    const images = gallery || []
    const imagesAmount = images.length
    const [currentSlide, setCurrentSlide] = useState(0)
    const [currentPreview, setCurrentPreview] = useState(0)
    const [previewVisible, setPreviewVisible] = useState(false)
    const sliderRef = useRef<CarouselRef>(null)
    const isWide = contentWidth > WIDE_DISPLAY_THRESHOLD

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
    const isSmallSlide = carouselColWidth <= IMAGE_SIZE_MD_THRESHOLD
    const buttonSpacing = isWide && !isSmallSlide ? SPACED_BUTTON_SPACING : SHRINKED_BUTTON_SPACING
    const rowStyles = isWide ? {} : SPACED_ROW_STYLES
    const slideImageStyles = getImageSize(carouselColWidth)

    return (
        <Row gutter={ROW_GUTTER} ref={setContentRef} style={rowStyles}>
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
                        {Boolean(description) && (
                            <Typography.Paragraph type='secondary'>
                                {description}
                            </Typography.Paragraph>
                        )}
                        {Boolean(price) && (
                            <Typography.Title level={3}>
                                {price}
                            </Typography.Title>
                        )}
                    </Space>
                    {!isAppAvailableForTariff ? (
                        <NoSubscriptionTooltip>
                            <span><Button {...buttonProps}/></span>
                        </NoSubscriptionTooltip>
                    ) : (
                        <Button {...buttonProps}/>
                    )}
                </Space>
            </Col>
            <Col span={sectionSpan} style={VERT_ALIGN_STYLES} ref={setCarouselColRef}>
                {Boolean(images.length) && (
                    <>
                        <Carousel
                            slidesToShow={1}
                            autoplay={!previewVisible}
                            autoplaySpeed={CAROUSEL_CHANGE_DELAY_IN_MS}
                            speed={CAROUSEL_CHANGE_SPEED_IN_MS}
                            infinite
                            beforeChange={handleSlideChange}
                            ref={sliderRef}
                            effect='fade'
                            dots
                        >
                            {images.map((src, idx) => (
                                <Image
                                    style={slideImageStyles}
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
                                    right: <Arrow size={isWide ? 'large' : 'medium'} onClick={handleNextPreview}/>,
                                    left: <Arrow style={ARROW_REVERSE_STYLES} size={isWide ? 'large' : 'medium'} onClick={handlePrevPreview}/>,
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