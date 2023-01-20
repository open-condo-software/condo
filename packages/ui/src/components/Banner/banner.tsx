import classNames from 'classnames'
import React, { useCallback, useRef } from 'react'

import { sendAnalyticsClickEvent } from '../_utils/analytics'
import { useSize } from '../_utils/hooks'
import { Button } from '../Button'
import { Typography } from '../Typography'

export type BannerProps = {
    title: string
    subtitle: string
    backgroundColor: string
    actionText: string
    onClick?: React.MouseEventHandler<HTMLElement>
    imgUrl?: string
    invertText?: boolean
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

export const Banner: React.FC<BannerProps> = ({
    backgroundColor,
    actionText,
    onClick,
    title,
    subtitle,
    imgUrl,
    invertText,
}) => {
    const ref = useRef<HTMLDivElement>(null)
    const { width } = useSize(ref)

    const showImage = imgUrl && width >= MD_BARRIER

    const bannerClasses = classNames({
        [`${CLASS_PREFIX}`]: true,
        [`${CLASS_PREFIX}-no-image`]: !showImage,
    })
    const contentContainerClasses = classNames({
        [`${CLASS_PREFIX}-content-container`]: true,
        [`${CLASS_PREFIX}-content-container-${getSize(width)}`]: getSize(width),
    })

    const titleLevel = (width >= LG_BARRIER || (width < MD_BARRIER && width >= SM_BARRIER)) ? 2 : 3
    const textSize = (width >= LG_BARRIER || width < MD_BARRIER) ? 'large' : 'medium'

    const handleClick = useCallback((event) => {
        sendAnalyticsClickEvent('Banner', { title })

        if (onClick) {
            onClick(event)
        }
    }, [title, onClick])

    return (
        <div
            className={bannerClasses}
            style={{ background: backgroundColor }}
            onClick={handleClick}
            ref={ref}
        >
            <div className={contentContainerClasses}>
                <div className={`${CLASS_PREFIX}-text-container`}>
                    <Typography.Title
                        type={invertText ? 'inverted' : undefined}
                        level={titleLevel}
                        ellipsis={{ rows: 3 }}
                    >
                        {title}
                    </Typography.Title>
                    <Typography.Paragraph
                        type={invertText ? 'inverted' : undefined}
                        ellipsis={{ rows: 3 }}
                        size={textSize}
                    >
                        {subtitle}
                    </Typography.Paragraph>
                </div>
                <Button
                    type='primary'
                    stateless
                >
                    {actionText}
                </Button>
            </div>
            {imgUrl && width > MD_BARRIER && (
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