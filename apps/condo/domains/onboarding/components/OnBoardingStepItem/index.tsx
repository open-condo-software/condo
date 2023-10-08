import { Space } from 'antd'
import React from 'react'

import { ArrowSemiBoldRightSvg } from '@condo/domains/common/components/icons/ArrowSemiBold'
import { colors } from '@condo/domains/common/constants/style'

import { ActivateStepIcon, IconContainer, StepContainer, StepTitle, StepDescription } from './components'

export enum OnBoardingStepType {
    DEFAULT = 'Default',
    COMPLETED = 'Completed',
    DISABLED = 'Disabled',
}

interface IOnBoardingStep {
    type: OnBoardingStepType,
    icon: React.FC,
    title: string,
    description: string,
    action?: () => void
}

export const OnBoardingStepItem: React.FC<IOnBoardingStep> = (props) => {
    const { type, icon, title, description, action } = props
    const StepIcon = icon

    const handleClick = () => {
        if (action) {
            action()
        }
    }

    return (
        <StepContainer color={colors.transparent} type={props.type} onClick={handleClick}>
            <Space direction='horizontal' size={16}>
                <IconContainer type={type}>
                    <StepIcon/>
                </IconContainer>
                <Space direction='vertical' size={4}>
                    <StepTitle>{title}</StepTitle>
                    <StepDescription>{description}</StepDescription>
                </Space>
            </Space>
            <ActivateStepIcon>
                <ArrowSemiBoldRightSvg />
            </ActivateStepIcon>
        </StepContainer>
    )
}
