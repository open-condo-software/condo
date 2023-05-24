import { Col, Image, Row } from 'antd'
import React, { CSSProperties } from 'react'
import ProgressiveImage from 'react-progressive-image'

import { useLayoutContext } from './LayoutContext'

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
const IMAGE_STYLE: CSSProperties = { maxWidth: '300px', maxHeight: '300px', height: '100%', width: 'auto' }
const IMAGE_WRAPPER_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '50%' }

export const Poster: React.FC<IPoster> = (props) => {
    const {
        src,
        placeholderSrc,
        delay = 500,
        Header,
        Footer,
    } = props

    const { breakpoints } = useLayoutContext()

    return (
        <ProgressiveImage src={src} placeholder={placeholderSrc} delay={delay}>
            {(src) => (
                <>
                    {
                        breakpoints.TABLET_LARGE && (
                            <div style={POSTER_CONTENT_STYLE}>
                                {Header}
                                <Image
                                    wrapperStyle={IMAGE_WRAPPER_STYLE}
                                    style={IMAGE_STYLE}
                                    src={src}
                                    preview={false}
                                />
                                {Footer}
                            </div>
                        )
                    }
                </>
            )}
        </ProgressiveImage>
    )
}
