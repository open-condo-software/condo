import styled from '@emotion/styled'
import React from 'react'

import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { shadows, transitions, colors, DEFAULT_BORDER_WIDTH } from '@condo/domains/common/constants/style'

import { OnBoardingStepType } from './index'

export const ActivateStepIcon = styled.div`
  transition: ${transitions.easeInOut};
  margin-left: auto;
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
  font-size: 24px;

  ${({ type }) => {
        if (type === OnBoardingStepType.COMPLETED) {
            return (`
                border: ${DEFAULT_BORDER_WIDTH} solid ${colors.sberPrimary[5]};
                background-color: ${colors.sberPrimary[5]};
                color: ${colors.white};
          `)
        }

        return (`border: 2px solid ${colors.sberGrey[3]};`)
    }}
`

export const StepTitle = styled.div`
  font-weight: bold;
  font-size: 16px;
  line-height: 24px;
`

export const StepDescription = styled.div`
  font-size: 14px;
  line-height: 22px;
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
