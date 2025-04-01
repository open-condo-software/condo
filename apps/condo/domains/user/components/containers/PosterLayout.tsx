import { Image } from 'antd'
import React, { useCallback } from 'react'
import ProgressiveImage from 'react-progressive-image'

import { LayoutWithPoster, PosterProps as DefaultPosterProps } from '@condo/domains/common/components/containers/LayoutWithPoster'

import './PosterLayout.css'


type PosterProps = DefaultPosterProps & { image: { main: string, placeholder?: string } }

type PosterLayoutProps = {
    image: PosterProps['image']
    headerAction?
}

const Poster: React.FC<PosterProps> = ({ Footer, Header, image }) => {
    return (
        <div className='common-poster'>
            <div className='common-layout-header'>
                {Header}
            </div>

            <div className='common-layout-image'>
                <ProgressiveImage src={image.main} placeholder={image?.placeholder}>
                    {(src) => (
                        <Image src={src} preview={false} />
                    )}
                </ProgressiveImage>
            </div>

            <div className='common-layout-footer'>
                {Footer}
            </div>
        </div>
    )
}

export const PosterLayout: React.FC<PosterLayoutProps> = ({
    children,
    headerAction,
    image,
}) => {
    const PosterComponent = useCallback((props: DefaultPosterProps) => {
        return <Poster {...props} image={image} key='poster-layout' />
    }, [image])

    return (
        <LayoutWithPoster
            children={children}
            headerAction={headerAction}
            Poster={PosterComponent}
        />
    )
}
