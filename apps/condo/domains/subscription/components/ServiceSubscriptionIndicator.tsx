import React from 'react'
import { Badge, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { green, grey } from '@ant-design/colors'
import { useServiceSubscriptionContext } from './SubscriptionContext'

const StyledPanel = styled.div`
  margin-left: -25px;
  margin-bottom: 15px;
  padding: 15px;
  border: ${colors.sberGrey[0]} thin solid;
  border-radius: 8px;
`

export const ServiceSubscriptionIndicator: React.FC = () => {
    const { subscription, daysLeft, daysLeftHumanized, isExpired } = useServiceSubscriptionContext()
    if (!subscription || !subscription.isTrial) {
        return null
    }
    const badges = []
    for (let i = 0; i < daysLeft; i++) {
        badges.push(
            <Badge
                status="success"
                style={{ marginLeft: i > 0 ? '-3px' : undefined }}
            />
        )
    }
    return (
        <StyledPanel>
            <div>
                {badges}
            </div>
            {isExpired ? (
                <TrialExpiredMessage/>
            ) : (
                <TrialActiveMessage daysLeftHumanized={daysLeftHumanized}/>
            )}
        </StyledPanel>
    )
}

const textStyle = {
    color: grey[2],
    fontSize: '12px',
    lineHeight: '12px',
}

const TrialExpiredMessage: React.FC = () => {
    const intl = useIntl()
    const InfoMessage = intl.formatMessage({ id: 'subscription.indicator.trial.expired.info' })
    const PromptMessage = intl.formatMessage({ id: 'subscription.indicator.trial.expired.prompt' })
    return (
        <>
            <Typography.Text style={textStyle}>
                {InfoMessage}
            </Typography.Text>
            <br/>
            <Typography.Text style={{ color: green[6] }} strong>
                {PromptMessage}
            </Typography.Text>
        </>
    )
}


interface ITrialActiveMessage {
    daysLeftHumanized: string
}

const TrialActiveMessage: React.FC<ITrialActiveMessage> = ({ daysLeftHumanized }) => {
    const intl = useIntl()
    const TrialActiveMessage = intl.formatMessage({ id: 'subscription.indicator.trial.active' })
    const [before, after] = TrialActiveMessage.split('{days}')

    return (
        <Typography.Text style={textStyle}>
            {before}
            <Typography.Text style={textStyle} strong>
                {daysLeftHumanized}
            </Typography.Text>
            {after}
        </Typography.Text>
    )
}