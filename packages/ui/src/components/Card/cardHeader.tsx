import classNames from 'classnames'
import React from 'react'

import { IconProps } from '@open-condo/icons'

import { CARD_CLASS_PREFIX } from './_utils/constants'

import { Emoji, EmojiProps } from '../Emoji'
import { ProgressIndicator, ProgressIndicatorProps } from '../ProgressIndicator'
import { Space } from '../Space'
import { Tag, TagProps } from '../Tag'
import { Typography } from '../Typography'

import './cardHeader.less'


type CardLinkType = {
    href: string
    label: string
    PreIcon?: React.FC<IconProps>
    AfterIcon?: React.FC<IconProps>
}

type CardHeaderProps = {
    tag?: TagProps
    progressIndicator?: ProgressIndicatorProps
    emoji?: EmojiProps[]
    headingTitle?: string
    mainLink?: CardLinkType
    secondLink?: CardLinkType
    image?: { src: string, size: 'small' | 'big' }
}

const CARD_HEADER_CONTENT_CLASS_NAME_PREFIX = `${CARD_CLASS_PREFIX}-header-content`

const renderLink = (linkProps: CardLinkType) => {
    const { PreIcon, AfterIcon, href, label } = linkProps

    return (
        <Space size={8} direction='horizontal' align='center'>
            {PreIcon && <PreIcon size='small' />}
            <Typography.Link href={href}>{label}</Typography.Link>
            {AfterIcon && <AfterIcon size='small' />}
        </Space>
    )
}

const CardHeader: React.FC<CardHeaderProps> = (props) => {
    const {
        progressIndicator,
        emoji,
        headingTitle,
        mainLink,
        secondLink,
        tag,
        image,
    } = props

    const imageClassName = image && classNames(
        `${CARD_HEADER_CONTENT_CLASS_NAME_PREFIX}-image`,
        `${CARD_HEADER_CONTENT_CLASS_NAME_PREFIX}-image-size-${image.size}`,
    )

    const headerContent = (
        <Space size={8} direction='vertical' className={CARD_HEADER_CONTENT_CLASS_NAME_PREFIX}>
            {tag && (
                <Tag {...tag} />
            )}
            {emoji && (
                <span>
                    {emoji.map((emojiProps, index) => <Emoji key={index} {...emojiProps} />)}
                </span>
            )}
            {image && (
                <img src={image.src} className={imageClassName} />
            )}
            {headingTitle && (
                <Typography.Title level={3}>{headingTitle}</Typography.Title>
            )}
            {mainLink && renderLink(mainLink)}
            {secondLink && renderLink(secondLink)}
        </Space>
    )

    if (progressIndicator) {
        return (
            <Space size={12} direction='horizontal' align='start'>
                <ProgressIndicator {...progressIndicator} />
                {headerContent}
            </Space>
        )
    }

    return headerContent
}

export {
    CardHeader,
}