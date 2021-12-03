import styled from '@emotion/styled'
import React from 'react'
import ProgressiveImage from 'react-progressive-image'
import { transitions, colors } from '@condo/domains/common/constants/style'

interface IImageProps {
    src: string
    placeholderColor: string
}

export const PosterContainer = styled.div<IImageProps>`
  background: url(${({ src }) => src}) no-repeat center center;
  background-color: ${({ placeholderColor }) => placeholderColor ? placeholderColor : colors.white};
  background-size: cover;
  width: 100%;
  height: 100%;
  transition: ${transitions.allDefault};
`

interface IPoster {
    src: string
    delay?: number
    placeholderSrc?: string
    placeholderColor?: string
    backgroundPosition?: string
}

export const Poster: React.FC<IPoster> = (props) => {
    const {
        src,
        placeholderSrc,
        placeholderColor,
        delay = 500,
    } = props

    return (
        <ProgressiveImage src={src} placeholder={placeholderSrc} delay={delay}>
            {(src) => (
                <PosterContainer src={src} placeholderColor={placeholderColor}/>
            )}
        </ProgressiveImage>
    )
}
