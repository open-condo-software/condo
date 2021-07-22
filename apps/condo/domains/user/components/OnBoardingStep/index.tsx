import { Space, Typography } from 'antd'
import React from 'react'
import { colors } from '@condo/domains/common/constants/style'
import { ActivateStepIcon, IconContainer, StepContainer } from './components'

export enum OnBoardingStepType {
    DEFAULT,
    COMPLETED,
    DISABLED,
}

interface IOnBoardingStep {
    type: OnBoardingStepType,
    icon: React.FC,
    title: string,
    description: string,
}

export const OnBoardingStep: React.FC<IOnBoardingStep> = (props) => {
    const { type, icon, title, description } = props
    const StepIcon = icon

    return (
        <StepContainer color={colors.transparent} type={props.type}>
            <Space direction={'horizontal'} size={16}>
                <IconContainer type={type}>
                    <StepIcon/>
                </IconContainer>
                <Space direction={'vertical'} size={4}>
                    <Typography.Title level={5}>{title}</Typography.Title>
                    <Typography.Text>{description}</Typography.Text>
                </Space>
            </Space>
            <ActivateStepIcon />
        </StepContainer>
    )
}
