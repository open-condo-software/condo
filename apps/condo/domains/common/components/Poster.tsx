import styled from '@emotion/styled'
import React, { CSSProperties, useMemo } from 'react'
import ProgressiveImage from 'react-progressive-image'

import { transitions } from '@condo/domains/common/constants/style'

import { useLayoutContext } from './LayoutContext'

interface IImageProps {
    src: string
    placeholderColor: string
}

export const PosterContainer = styled.div<IImageProps>`
  background: url(${({ src }) => src}) center no-repeat;
  width: 100%;
  height: 100%;
  transition: ${transitions.elevateTransition };
`

interface IPoster {
    src: string
    delay?: number
    placeholderSrc?: string
    placeholderColor?: string
    backgroundPosition?: string
    Header?: React.ReactElement
    Footer?: React.ReactElement
}

const POSTER_CONTENT_STYLE: CSSProperties = { padding: '24px', height: '100%', display: 'flex', flexFlow: 'column', justifyContent: 'space-between' }
const POSTER_CONTAINER_STYLE: CSSProperties = { backgroundSize: '60%' }

export const Poster: React.FC<IPoster> = (props) => {
    const {
        src,
        placeholderSrc,
        placeholderColor,
        delay = 500,
        Header,
        Footer,
    } = props

    const { breakpoints } = useLayoutContext()
    const posterContainerStyles = useMemo(() => !breakpoints.DESKTOP_SMALL ? POSTER_CONTAINER_STYLE : {}, [breakpoints.DESKTOP_SMALL])

    return (
        <ProgressiveImage src={src} placeholder={placeholderSrc} delay={delay}>
            {(src) => (
                <PosterContainer src={src} placeholderColor={placeholderColor} style={posterContainerStyles}>
                    {
                        breakpoints.TABLET_LARGE && (
                            <div style={POSTER_CONTENT_STYLE}>
                                {Header}
                                {Footer}
                            </div>
                        )
                    }
                </PosterContainer>
            )}
        </ProgressiveImage>
    )
}
