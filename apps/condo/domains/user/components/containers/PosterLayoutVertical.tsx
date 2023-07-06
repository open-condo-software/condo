import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import React, { CSSProperties } from 'react'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Poster } from '@condo/domains/common/components/Poster'
import { colors } from '@condo/domains/common/constants/style'

import {
    ChildrenWrapper,
    Layout,
    MobileHeader,
    PageContent,
    PosterWrapperFullHeight,
    ReCaptchaContainer,
} from './styles'


interface IPosterLayoutProps {
    Header?: React.ReactElement
    Footer?: React.ReactElement
    layoutBgColor?: string
    layoutBgImage?: { poster: string, placeholder: string }
}

const IMAGE_STYLE: CSSProperties = { maxWidth: '300px', maxHeight: '300px', height: '100%', width: 'auto' }
const IMAGE_WRAPPER_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '50%' }
const POSTER_CONTENT_STYLE: CSSProperties = { padding: '24px', height: '100%', display: 'flex', flexFlow: 'column', justifyContent: 'space-between' }

export const PosterLayoutVertical: React.FC<IPosterLayoutProps> = ({ children, Header, Footer, layoutBgColor, layoutBgImage }) => {
    const { breakpoints } = useLayoutContext()

    const LAYOUT_STYLE = { backgroundColor: layoutBgColor }
    const BG_POSTER = layoutBgImage ? layoutBgImage.poster : '/authPoster.png'
    const BG_POSTER_PLACEHOLDER = layoutBgImage ? layoutBgImage.placeholder : '/authPosterPlaceholder.png'

    return (
        <Layout style={LAYOUT_STYLE}>
            <Row align='stretch' justify={breakpoints.TABLET_LARGE ? 'space-between' : 'center'}>
                <Col span={24}>
                    {Header}
                </Col>
                <Col span={24}>
                    <PosterWrapperFullHeight>
                        <Poster
                            Footer={Footer}
                            src={BG_POSTER}
                            placeholderSrc={BG_POSTER_PLACEHOLDER}
                            imageStyle={IMAGE_STYLE}
                            imageWrapperStyle={IMAGE_WRAPPER_STYLE}
                            posterContentStyle={POSTER_CONTENT_STYLE}
                        />
                    </PosterWrapperFullHeight>
                </Col>
                <Col span={24}>
                    <PageContent>
                        <ReCaptchaContainer id='ReCaptchaContainer'/>
                        <ChildrenWrapper isSmall={!breakpoints.TABLET_LARGE}>
                            {children}
                        </ChildrenWrapper>
                    </PageContent>
                </Col>
                {Footer}
            </Row>
        </Layout>
    )
}
