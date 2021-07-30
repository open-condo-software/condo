import styled from '@emotion/styled'
import { Tooltip } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'

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

    /* motion */
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
    const router = useRouter()
    const { query } = router

    return (
        query.showTooltip
            ? (
                <FocusWrapper>
                    <Tooltip title={'Теперь вы можете перейти к следующему шагу'} visible placement={'right'}>
                        {children}
                    </Tooltip>
                </FocusWrapper>
            )
            : null
    )
}
