import styled from '@emotion/styled'
import { Space, Image } from 'antd'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Card, Typography, Button } from '@open-condo/ui'

import { AppLabelTag } from './AppLabelTag'

const FALLBACK_IMAGE_URL = '/homeWithSun.svg'
const TEXT_ELLIPSIS_CONFIG = { rows: 2 }
const CARD_BODY_PADDINGS = 20
const CARD_HEAD_PADDINGS = '32px 40px'
const TEXT_MARGIN = 8
const BUTTON_MARGIN = 16
const CARD_TEXT_STYLES: CSSProperties = { height: 100 }
const CARD_SPACE_STYLES: CSSProperties = { width: '100%' }
const IMAGE_STYLES: CSSProperties = { objectFit: 'contain', height: 60 }

export const MIN_CARD_WIDTH = 250

type AppCardTitleProps = {
    logoUrl?: string
    label?: string
}

type AppCardProps = {
    connected: boolean
    name: string
    description: string
    logoUrl?: string
    label?: string
    onClick?: () => void
}

const AppCardTitleWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 60px;
`

const AppCardTitleLabelContainer = styled.div`
  position: absolute;
  right: -36px;
  bottom: 62px;
`

const AppCardTitle: React.FC<AppCardTitleProps> = ({ logoUrl, label }) => {
    return (
        <AppCardTitleWrapper>
            <Image
                src={logoUrl || FALLBACK_IMAGE_URL}
                fallback={FALLBACK_IMAGE_URL}
                preview={false}
                style={IMAGE_STYLES}
                draggable={false}
            />
            {Boolean(label) && (
                <AppCardTitleLabelContainer>
                    <AppLabelTag type={label}/>
                </AppCardTitleLabelContainer>
            )}
        </AppCardTitleWrapper>
    )
}

export const AppCard: React.FC<AppCardProps> = ({
    connected,
    name,
    logoUrl,
    description,
    label,
    onClick,
}) => {
    const intl = useIntl()
    const ButtonLabel = connected
        ? intl.formatMessage({ id: 'miniapps.appCard.connected.label' })
        : intl.formatMessage({ id: 'miniapps.appCard.notConnected.label' })

    return (
        <Card
            bodyPadding={CARD_BODY_PADDINGS}
            titlePadding={CARD_HEAD_PADDINGS}
            onClick={onClick}
            title={<AppCardTitle logoUrl={logoUrl} label={label} />}
            hoverable
        >
            <Space direction='vertical' size={BUTTON_MARGIN} style={CARD_SPACE_STYLES}>
                <Space direction='vertical' size={TEXT_MARGIN} style={CARD_TEXT_STYLES}>
                    <Typography.Title level={4} ellipsis={TEXT_ELLIPSIS_CONFIG}>
                        {name}
                    </Typography.Title>
                    <Typography.Paragraph size='medium' type='secondary' ellipsis={TEXT_ELLIPSIS_CONFIG}>
                        {description}
                    </Typography.Paragraph>
                </Space>
                <Button
                    type='secondary'
                    block
                >
                    {ButtonLabel}
                </Button>
            </Space>
        </Card>
    )
}
