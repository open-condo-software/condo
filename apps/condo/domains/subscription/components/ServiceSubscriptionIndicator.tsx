import React from 'react'
import { Typography } from 'antd'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { useIntl } from '@open-condo/next/intl'
import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'
import { green, grey } from '@ant-design/colors'
import { useServiceSubscriptionContext } from './SubscriptionContext'
import get from 'lodash/get'


const DaysLeftContainer = styled.div`
  width: 36px;
  height: 36px;
  padding: 4px;
  border-radius: 50%;
  background-color: ${colors.scampi};
  box-sizing: border-box;
`

const DaysLeftWrapper = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: ${colors.white};
  text-align: center;
  line-height: 200%;
  box-sizing: border-box;
`

export const ServiceSubscriptionIndicator: React.FC = () => {
    const intl = useIntl()
    const TrialDaysDescriptionMessage = intl.formatMessage({ id: 'subscription.type.expiredMessage' })

    const { subscription, daysLeft, isExpired } = useServiceSubscriptionContext()

    if (!subscription || !get(subscription, 'isTrial')) {
        return null
    }

    return isExpired
        ? (<TrialExpiredMessage/>)
        : (
            <Tooltip title={TrialDaysDescriptionMessage}>
                <DaysLeftContainer>
                    <DaysLeftWrapper>
                        <Typography.Text strong>
                            {daysLeft}
                        </Typography.Text>
                    </DaysLeftWrapper>
                </DaysLeftContainer>
            </Tooltip>
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
