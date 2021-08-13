import styled from '@emotion/styled'
import React from 'react'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Space, Typography } from 'antd'
import { useSubscriptionContext } from './SubscriptionContext'

const TrialText = styled(Typography.Text)`
  font-size: 12px;
`

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

interface IProgressItem {
    backgroundColor: string,
    active?: boolean,
    hidden?: boolean
}

const ProgressItem = styled.div<IProgressItem>`
  background-color: ${({ backgroundColor }) => backgroundColor};
  visibility: ${({ hidden }) => hidden ? 'hidden' : 'visible'};
  border-radius: 50%;

  ${({ active }) => {
        if (active) {
            return `
            width: 10px;
            height: 10px;
          `
        }
        return `
            width: 6px;
            height: 6px;
        `
    }}
`

interface IProgress {
    progressState: number
}

const Progress: React.FC<IProgress> = (props) => {
    const progressColors = ['#FF4D4F', '#FA541C', '#F759AB', '#EB2F96', '#C41D7F', '#9E1068', '#780650', '#520339', '#254000', '#3F6600', '#5B8C00', '#7CB305', '#A0D911', '#BAE637']

    return (
        <ProgressContainer>
            {progressColors.map((color, index) => {
                return (
                    <ProgressItem
                        backgroundColor={color}
                        active={index === (props.progressState - 1)}
                        hidden={index > (props.progressState - 1)}
                        key={color}
                    />
                )
            })}
        </ProgressContainer>
    )
}

export const TrialTooltip: React.FC = () => {
    const { isSubscriptionActive, daysRemaining } = useSubscriptionContext()

    return isSubscriptionActive && (
        <FocusContainer margin={'0 0 0 -16px'} padding={'14px 13px 14px 16px'}>
            <Space direction={'vertical'} size={12}>
                <Progress progressState={daysRemaining}/>
                <TrialText type={'secondary'}>
                    Осталось <TrialText strong>{daysRemaining} дней</TrialText> бесплатного периода
                </TrialText>
            </Space>
        </FocusContainer>
    )
}
