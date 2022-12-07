import React, { CSSProperties, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Space, Image } from 'antd'
import get from 'lodash/get'
import styled from '@emotion/styled'
import { useIntl } from '@open-condo/next/intl'
import { Card, Typography, Button, Tag } from '@open-condo/ui'
// TODO(DOMA-4844): Replace with @open-condo/ui/colors
import { colors } from '@open-condo/ui/dist/colors'
import { APP_NEW_LABEL, APP_POPULAR_LABEL, APP_DISCOUNT_LABEL, APP_FREE_LABEL } from '@condo/domains/miniapp/constants'

const FALLBACK_IMAGE_URL = '/greyLogo.svg'
const TEXT_ELLIPSIS_CONFIG = { rows: 2 }
const CARD_BODY_PADDINGS = 20
const CARD_HEAD_PADDINGS = '32px 40px'
const TEXT_MARGIN = 8
const BUTTON_MARGIN = 16
const CARD_TEXT_STYLES: CSSProperties = { height: 100 }
const IMAGE_STYLES: CSSProperties = { objectFit: 'contain', height: 60 }
const LABEL_TO_TAG_PROPS = {
    [APP_FREE_LABEL]: { textColor: colors.blue['5'], bgColor: colors.blue['1'] },
    [APP_DISCOUNT_LABEL]: { textColor: colors.red['5'], bgColor: colors.red['1'] },
    [APP_POPULAR_LABEL]: { textColor: colors.green['7'], bgColor: colors.green['1'] },
    [APP_NEW_LABEL]: { textColor: colors.orange['5'], bgColor: colors.orange['1'] },
}

type AppCardTitleProps = {
    logoUrl?: string
    label?: string
}

type AppCardProps = {
    id: string
    type: string
    connected: boolean
    name: string
    description: string
    logoUrl?: string
    label?: string
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
    const intl = useIntl()
    const AppLabel = label && intl.formatMessage({ id: `miniapps.labels.${label}.name` })
    const tagProps = label && get(LABEL_TO_TAG_PROPS, label, {})

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
                    <Tag {...tagProps}>{AppLabel}</Tag>
                </AppCardTitleLabelContainer>
            )}
        </AppCardTitleWrapper>
    )
}

export const AppCard: React.FC<AppCardProps> = ({
    id,
    type,
    connected,
    name,
    logoUrl,
    description,
    label,
}) => {
    const intl = useIntl()
    const ButtonLabel = connected
        ? intl.formatMessage({ id: 'miniapps.appCard.connected.label' })
        : intl.formatMessage({ id: 'miniapps.appCard.notConnected.label' })

    const router = useRouter()

    const handleCardClick = useCallback(() => {
        // TODO(DOMA-4830): Remove types after billing migration
        const url = connected
            ? `/miniapps/${id}?type=${type}`
            : `/miniapps/${id}/about?type=${type}`
        router.push(url)
    }, [router, connected, id, type])

    return (
        <Card
            bodyPadding={CARD_BODY_PADDINGS}
            titlePadding={CARD_HEAD_PADDINGS}
            onClick={handleCardClick}
            title={<AppCardTitle logoUrl={logoUrl} label={label} />}
            hoverable
        >
            <Space direction='vertical' size={BUTTON_MARGIN}>
                <Space direction='vertical' size={TEXT_MARGIN} style={CARD_TEXT_STYLES}>
                    <Typography.Title level={4} ellipsis={TEXT_ELLIPSIS_CONFIG}>
                        {name}
                    </Typography.Title>
                    <Typography.Paragraph size='medium' type='secondary' ellipsis={TEXT_ELLIPSIS_CONFIG}>
                        {description}
                    </Typography.Paragraph>
                </Space>
                <Button
                    type={connected ? 'primary' : 'secondary'}
                    block
                >
                    {ButtonLabel}
                </Button>
            </Space>
        </Card>
    )
}