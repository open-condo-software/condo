import { Image } from 'antd'
import React, { CSSProperties } from 'react'
import ProgressiveImage from 'react-progressive-image'

interface IPoster {
    src: string
    delay?: number
    placeholderSrc?: string
    placeholderColor?: string
    backgroundPosition?: string
    Header?: React.ReactElement
    Footer?: React.ReactElement
    imageStyle?: CSSProperties
    imageWrapperStyle?: CSSProperties
    posterContentStyle?: CSSProperties
}

export const Poster: React.FC<IPoster> = (props) => {
    const {
        src,
        placeholderSrc,
        delay = 500,
        Header,
        Footer,
        imageStyle,
        imageWrapperStyle,
        posterContentStyle,
    } = props

    return (
        // TODO: migrate to something more up to date
        // @ts-expect-error children is not defined in package type defs
        <ProgressiveImage src={src} placeholder={placeholderSrc} delay={delay}>
            {(src) => (
                <div style={posterContentStyle}>
                    {Header}
                    <Image
                        wrapperStyle={imageWrapperStyle}
                        style={imageStyle}
                        src={src}
                        preview={false}
                    />
                    {Footer}
                </div>
            )}
        </ProgressiveImage>
    )
}
