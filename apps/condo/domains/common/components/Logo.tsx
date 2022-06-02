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
    transform: translate(-15px, -12px);
    opacity: 0
  }
  to {
    transform: translate(28px, -15px);
    opacity: 1
  }
`

const SunCSS = css`
  animation: ${SunKeyFrames} 3s ease 1;
  transform: translate(28px, -15px);
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
                <svg width="29" height="31" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#fff" d="M0 0h29v31H0z"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M12.5635 7.1615c-.7113-.572-1.7329-.5692-2.4409.0069L.7004 14.8348C.257 15.1957 0 15.7333 0 16.3006v12.7995c0 1.0492.8619 1.8998 1.925 1.8998h18.9622c1.0632 0 1.9251-.8506 1.9251-1.8998V16.3072c0-.571-.2603-1.1118-.7089-1.4726l-9.5399-7.673Zm6.3986 20.0389v-9.9907l-7.6078-6.1191-7.5041 6.1059v10.0039H18.962Z" fill="url(#a)"/>
                    <path d="M29 4.0124c0 2.216-1.8177 4.0124-4.0598 4.0124-2.2422 0-4.0598-1.7964-4.0598-4.0124S22.698 0 24.9402 0C27.1823 0 29 1.7964 29 4.0124Z" fill="#FDCF5A"/>
                    <defs>
                        <linearGradient id="a" x1="0" y1="18.8671" x2="18.2733" y2="27.9744" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#4CD174"/><stop offset="1" stopColor="#6DB8F2"/>
                        </linearGradient>
                    </defs>
                </svg>
            </LogoWrapper>
        )
    }

    return (
        <LogoWrapper onClick={onClick}>
            <Image preview={false} css={SunCSS} src={'/logoSun.svg'}/>
            <Image preview={false} src={'/logoDoma.svg'}/>
        </LogoWrapper>
    )
}
