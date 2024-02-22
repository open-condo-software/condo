import classNames from 'classnames'
import React from 'react'

import { useBreakpoints } from '../../../hooks'
import { Emoji, EmojiProps } from '../../Emoji'
import { ProgressIndicator, ProgressIndicatorProps } from '../../ProgressIndicator'
import { Space } from '../../Space'
import { Tag, TagProps } from '../../Tag'
import { Typography } from '../../Typography'
import { CardLinkType, renderLink } from '../_utils'
import { CARD_CLASS_PREFIX } from '../_utils/constants'

import './cardHeader.less'


export type CardHeaderProps = {
    tag?: TagProps
    progressIndicator?: ProgressIndicatorProps
    emoji?: EmojiProps[]
    headingTitle?: string
    mainLink?: CardLinkType
    secondLink?: CardLinkType
    image?: { src: string, size: 'small' | 'big' }
}

const CARD_HEADER_CONTENT_CLASS_NAME_PREFIX = `${CARD_CLASS_PREFIX}-header-content`

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

    const { TABLET_LARGE } = useBreakpoints()

    let headerContent = (
        <Space size={TABLET_LARGE ? 8 : 4} direction='vertical' className={CARD_HEADER_CONTENT_CLASS_NAME_PREFIX}>
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
        headerContent = (
            <Space size={12} direction='horizontal' align='start'>
                <ProgressIndicator {...progressIndicator} />
                {headerContent}
            </Space>
        )
    }

    return (
        <>
            {tag && <Tag {...tag} className={`${CARD_CLASS_PREFIX}-header-tag`} />}
            {headerContent}
        </>
    )
}

export {
    CardHeader,
}