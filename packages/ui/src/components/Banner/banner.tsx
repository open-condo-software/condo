import classNames from 'classnames'
import React, { useCallback } from 'react'

import { ChevronRight } from '@open-condo/icons'

import { colors } from '../../colors'
import { sendAnalyticsClickEvent } from '../_utils/analytics'
import { useContainerSize } from '../_utils/hooks'
import { Button } from '../Button'
import { Typography } from '../Typography'

export type BannerProps = {
    title: string
    subtitle: string
    backgroundColor: string
    actionText?: string
    onClick?: React.MouseEventHandler<HTMLElement>
    imgUrl?: string
    invertText?: boolean
    id?: string
    size?: 'small' | 'medium'
}

// NOTE: Some ad blockers block elements containing "banner" in classes
const CLASS_PREFIX = 'condo-promo-block'
const LG_BARRIER = 875
const MD_BARRIER = 740
const SM_BARRIER = 460
const X_SM_BARRIER = 400

const getSize =  (width: number) => {
    if (width < X_SM_BARRIER) {
        return 'xxs'
    } else if (width < SM_BARRIER) {
        return 'xs'
    } else if (width < MD_BARRIER) {
        return 'sm'
    } else if (width < LG_BARRIER) {
        return 'md'
    } else {
        return 'lg'
    }
}

const getTextSize = (width: number, bannerSize: BannerProps['size']) => {
    if (bannerSize === 'small') {
        return 'medium'
    }

    return (width >= LG_BARRIER || width < MD_BARRIER) ? 'large' : 'medium'
}

const getTitleLevel = (width: number, bannerSize: BannerProps['size']) => {
    if (bannerSize === 'small') {
        return 4
    }

    return (width >= LG_BARRIER || (width < MD_BARRIER && width >= SM_BARRIER)) ? 2 : 3
}

const getTitleRows = (width: number, bannerSize: BannerProps['size']) => {
    if (bannerSize === 'small') {
        return width < SM_BARRIER ? 2 : 1
    }

    return 2
}

const getShowImage = (width: number, bannerSize: BannerProps['size'], imgUrl: BannerProps['imgUrl']) => {
    if (!imgUrl) return false

    if (bannerSize === 'small') {
        return width >= LG_BARRIER
    }

    return width >= MD_BARRIER
}

export const Banner: React.FC<BannerProps> = ({
    backgroundColor,
    actionText,
    onClick,
    title,
    subtitle,
    imgUrl,
    invertText,
    id,
    size = 'medium',
}) => {
    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()

    const showImage = getShowImage(width, size, imgUrl)

    const bannerClasses = classNames({
        [`${CLASS_PREFIX}`]: true,
        [`${CLASS_PREFIX}-no-image`]: !showImage,
        [`${CLASS_PREFIX}-${size}`]: size,
        [`${CLASS_PREFIX}-${getSize(width)}`]: getSize(width),
    })
    const contentContainerClasses = classNames({
        [`${CLASS_PREFIX}-content-container`]: true,
    })

    const titleLevel = getTitleLevel(width, size)
    const titleRows = getTitleRows(width, size)
    const textSize = getTextSize(width, size)

    const handleClick = useCallback<React.MouseEventHandler<HTMLDivElement>>((event) => {
        sendAnalyticsClickEvent('Banner', { title, id })

        if (onClick) {
            onClick(event)
        }
    }, [title, id, onClick])

    return (
        <div
            className={bannerClasses}
            style={{ background: backgroundColor }}
            onClick={handleClick}
            ref={setRef}
        >
            <div className={contentContainerClasses}>
                <div className={`${CLASS_PREFIX}-text-container`}>
                    <Typography.Title
                        type={invertText ? 'inverted' : 'primary'}
                        level={titleLevel}
                        ellipsis={{ rows: titleRows }}
                    >
                        {title}
                    </Typography.Title>
                    <Typography.Paragraph
                        type={invertText ? 'inverted' : 'secondary'}
                        ellipsis={{ rows: 2 }}
                        size={textSize}
                    >
                        {subtitle}
                    </Typography.Paragraph>
                </div>
                {Boolean(actionText) && (
                    size === 'small'
                        ? (
                            <div className={`${CLASS_PREFIX}-action-link`}>
                                <Typography.Text
                                    type={invertText ? 'inverted' : 'primary'}
                                >
                                    {actionText}
                                </Typography.Text>
                                <ChevronRight
                                    color={invertText ? colors.white : colors.black}
                                    size='small'
                                    className={`${CLASS_PREFIX}-action-icon`}
                                />
                            </div>
                        )
                        : (
                            <Button
                                type='primary'
                                stateless
                            >
                                {actionText}
                            </Button>
                        )
                )}
            </div>
            {showImage && (
                <div className={`${CLASS_PREFIX}-image-container`}>
                    <img
                        src={imgUrl}
                        alt='promo-image'
                    />
                </div>
            )}
        </div>
    )
}