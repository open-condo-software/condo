import { RightOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import React from 'react'
import { shadows, transitions, colors, DEFAULT_BORDER_WIDTH } from '@condo/domains/common/constants/style'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { OnBoardingStepType } from './index'

export const ActivateStepIcon = styled(RightOutlined)`
    transition: ${transitions.easeInOut};
    font-size: 14px;
    margin-left: auto;
    color: ${colors.black};
    opacity: 0;
`

export const IconContainer = styled.div<{ type: OnBoardingStepType }>`
    border-radius: 50%;
    width: 44px;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    transition: ${transitions.easeInOut};
    color: ${colors.black};
    font-size: 16px;

    ${({ type }) => {
        if (type === OnBoardingStepType.COMPLETED) {
            return `
                border: ${DEFAULT_BORDER_WIDTH} solid ${colors.sberPrimary[5]};
                background-color: ${colors.sberPrimary[5]};
                color: ${colors.white};
          `
        }

        return `border: 2px solid ${colors.sberGrey[3]};`
    }}
`

export const StepContainer = styled(FocusContainer)<{ type: OnBoardingStepType }>`
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
    transition: ${transitions.easeInOut};
    position: relative;

    ${({ type }) => {
        if (type === OnBoardingStepType.COMPLETED) {
            return 'pointer-events: none;'
        }

        if (type === OnBoardingStepType.DISABLED) {
            return `
                pointer-events: none;
                opacity: 0.3;
            `
        }

        return `
            &:hover {
                box-shadow: ${shadows.elevated};
                ${ActivateStepIcon} {
                    opacity: 1;
                }
                
                ${IconContainer} {
                    background-color: ${colors.sberPrimary[5]};
                    border-color: ${colors.sberPrimary[5]};
                    color: ${colors.white};
                }
            }      
      `
    }}
`
