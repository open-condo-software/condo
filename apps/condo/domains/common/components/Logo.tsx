/** @jsx jsx */

import { colors } from '@condo/domains/common/constants/style'
import styled from '@emotion/styled'
import React from 'react'
import { Image } from 'antd'
import { jsx, css, keyframes } from '@emotion/core'

const LogoWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  height: 40px;
`

const SunKeyFrames = keyframes`
  from {
    transform: translate(-30px, -12px);
    opacity: 0
  }
  to {
    transform: translate(-5px, -15px);
    opacity: 1
  }
`

const SunCSS = css`
  animation: ${SunKeyFrames} 5s ease 1;
  transform: translate(-5px, -15px);
`

interface ILogoProps {
    onClick: (e: React.SyntheticEvent) => void
    fillColor?: string
    minified?: boolean
}

export const Logo: React.FC<ILogoProps> = (props) => {
    const {
        onClick,
        minified,
        fillColor = colors.logoPurple,
    } = props

    if (minified) {
        return (
            <LogoWrapper onClick={onClick}>
                <svg width='20' height='22' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <path fill={fillColor}
                        d='M0 0v21.0183h7.399c7.2485 0 12.0608-3.453 12.0608-10.9295C19.4598 3.6332 15.6701 0 7.1282 0H0Zm4.8123 16.5144V4.5039h2.6769c5.083 0 6.9477 2.0418 6.9477 5.9452 0 3.6632-2.1053 6.0653-6.8876 6.0653h-2.737Z'/>
                </svg>
            </LogoWrapper>
        )
    }

    return (
        <LogoWrapper onClick={onClick}>
            <Image preview={false} src={'/logoHouse.svg'}/>
            <Image preview={false} css={SunCSS} src={'/logoSun.svg'}/>
            <Image preview={false} src={'/logoDoma.svg'}/>
        </LogoWrapper>
    )
}
