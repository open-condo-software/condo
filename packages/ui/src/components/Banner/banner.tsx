import React, { useRef } from 'react'
import { Button } from '../Button'
import { Typography } from '../Typography'
import { useSize } from '../_utils/hooks/useSize'
import classNames from 'classnames'

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
const IMAGE_TOGGLE_BARRIER = 768

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
    const contentContainerClasses = classNames({
        [`${CLASS_PREFIX}-content-container`]: true,
        [`${CLASS_PREFIX}-content-container-small`]: width <= IMAGE_TOGGLE_BARRIER,
    })

    return (
        <div
            className={CLASS_PREFIX}
            style={{ background: backgroundColor }}
            onClick={onClick}
            ref={ref}
        >
            <div className={contentContainerClasses}>
                <div className={`${CLASS_PREFIX}-text-container`}>
                    <Typography.Title
                        type={invertText ? 'inverted' : undefined}
                        level={2}
                    >
                        {title}
                    </Typography.Title>
                    <Typography.Paragraph
                        type={invertText ? 'inverted' : undefined}
                        ellipsis={{ rows: 2 }}
                    >
                        {subtitle}
                    </Typography.Paragraph>
                </div>
                <Button
                    type='primary'
                >
                    {actionText}
                </Button>
            </div>
            {imgUrl && width > IMAGE_TOGGLE_BARRIER && (
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