import React, { CSSProperties } from 'react'

import './cardBody.less'
import { CARD_CLASS_PREFIX } from './constants'
import { CardLinkType, renderLink } from './utils'

import { Button, ButtonProps } from '../../Button'
import { Space } from '../../Space'
import { Typography } from '../../Typography'

export type CardBodyProps = {
    bodyTitle?: string
    description?: string
    image?: { src: string, style?: CSSProperties }
    caption?: string
    mainLink?: CardLinkType
    secondLink?: CardLinkType
    button?: ButtonProps
}

const CARD_HEADER_CONTENT_CLASS_NAME_PREFIX = `${CARD_CLASS_PREFIX}-body-content`

const CardBody: React.FC<CardBodyProps> = (props) => {
    const {
        bodyTitle,
        description,
        image,
        caption,
        mainLink,
        secondLink,
        button,
    } = props

    return (
        <Space size={8} direction='vertical' className={CARD_HEADER_CONTENT_CLASS_NAME_PREFIX}>
            {bodyTitle && (
                <Typography.Title level={3}>{bodyTitle}</Typography.Title>
            )}
            {description && (
                <Typography.Text size='medium' type='secondary'>{description}</Typography.Text>
            )}
            {image && (
                <div className={`${CARD_CLASS_PREFIX}-body-content-image-container`}>
                    <img src={image.src} style={image.style}/>
                </div>
            )}
            {caption && (
                <Typography.Text size='small' type='secondary'>{caption}</Typography.Text>
            )}
            {mainLink && renderLink(mainLink)}
            {secondLink && renderLink(secondLink)}
            {button && (
                <Button {...button} />
            )}
        </Space>
    )
}

export {
    CardBody,
}