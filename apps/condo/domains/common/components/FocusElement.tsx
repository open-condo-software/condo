import styled from '@emotion/styled'
import { Tooltip } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useRef, useState } from 'react'
import { useApolloClient } from '@core/next/apollo'
import { OnBoardingStep as OnBoardingStepGql } from '../../onboarding/gql'

const FocusWrapper = styled.div`
  position: relative;
  border-radius: 4px;
  padding: 0 0 0 16px;
  margin: 0 0 0 -16px;

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 4px;
    background: linear-gradient(120deg, #00F260, #0575E6, #00F260);
    background-size: 300% 300%;
    clip-path: polygon(0% 100%, 3px 100%, 3px 3px, calc(100% - 3px) 3px, calc(100% - 3px) calc(100% - 3px), 3px calc(100% - 3px), 3px 100%, 100% 100%, 100% 0%, 0% 0%);
    animation: frame-enter 1s forwards ease-in-out reverse, gradient-animation 4s ease-in-out infinite;

    @keyframes gradient-animation {
      0% {
        background-position: 15% 0%;
      }
      50% {
        background-position: 85% 100%;
      }
      100% {
        background-position: 15% 0%;
      }
    }

    @keyframes frame-enter {
      0% {
        clip-path: polygon(0% 100%, 3px 100%, 3px 3px, calc(100% - 3px) 3px, calc(100% - 3px) calc(100% - 3px), 3px calc(100% - 3px), 3px 100%, 100% 100%, 100% 0%, 0% 0%);
      }
      25% {
        clip-path: polygon(0% 100%, 3px 100%, 3px 3px, calc(100% - 3px) 3px, calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%, 100% 100%, 100% 0%, 0% 0%);
      }
      50% {
        clip-path: polygon(0% 100%, 3px 100%, 3px 3px, calc(100% - 3px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 3px, 100% 0%, 0% 0%);
      }
      75% {
        clip-path: polygon(0% 100%, 3px 100%, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 0%, 0% 0%);
      }
      100% {
        path: polygon(0% 100%, 3px 100%, 3px 100%, 3px 100%, 3px 100%, 3px 100%, 3px 100%, 3px 100%, 3px 100%, 0% 100%);
      }
    }
  }
`

export const FocusElement: React.FC = ({ children }) => {
    const client = useApolloClient()
    const [showFocus, setShowFocus] = useState(false)
    const lastCompletedStepsNumber = useRef(null)
    const timeoutId = useRef(null)
    const router = useRouter()

    const showFocusTooltip = useCallback(() => {
        if (!showFocus) {
            setShowFocus(true)

            if (!timeoutId.current) {
                timeoutId.current = setTimeout(() => {
                    setShowFocus(false)
                    timeoutId.current = null
                }, 10000)
            }
        }
    }, [])

    client.query({ query: OnBoardingStepGql.GET_ALL_OBJS_QUERY })
        .then((result) => {
            console.log(result.data.objs)
            const nextCompletedStepsLength = result.data.objs.filter((obj) => obj.completed === true).length

            if (!lastCompletedStepsNumber.current === null) {
                lastCompletedStepsNumber.current = nextCompletedStepsLength
            }

            if (nextCompletedStepsLength !== lastCompletedStepsNumber.current && nextCompletedStepsLength > 0) {
                if (router.pathname !== '/onboarding') {
                    showFocusTooltip()
                }

                lastCompletedStepsNumber.current = nextCompletedStepsLength
            }
        })

    return (
        showFocus
            ? (
                <FocusWrapper>
                    <Tooltip title={'Теперь вы можете перейти к следующему шагу'} visible placement={'right'}>
                        {children}
                    </Tooltip>
                </FocusWrapper>
            )
            : <>{ children }</>
    )
}
