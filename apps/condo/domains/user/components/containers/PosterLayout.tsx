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

const PosterMobileFooter = styled.div`
  width: 95%;
  color: ${colors.gray};
  white-space: pre-line;
  font-size: 12px;
  line-height: 20px;
  background-color: inherit;
  margin-top: auto;
  padding-top: 40px;
`

const POSTER_WRAPPER_STUMB_STYLE: CSSProperties = { padding: '36px 0 36px 36px', height: '100vh' }
const POSTER_WRAPPER_COL_STYLE: CSSProperties = { position: 'fixed', left: '36px', top: '36px', bottom: '36px', width: '100%' }
const PAGE_WRAPPER_STYLE: CSSProperties = { minHeight: '100vh' }
const IMAGE_STYLE: CSSProperties = { maxWidth: '300px', maxHeight: '300px', height: '100%', width: 'auto' }
const IMAGE_WRAPPER_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '50%' }
const POSTER_CONTENT_STYLE: CSSProperties = { padding: '24px', height: '100%', display: 'flex', flexFlow: 'column', justifyContent: 'space-between' }

export const PosterLayout: React.FC<IPosterLayoutProps> = ({ children, Header, Footer, layoutBgColor, layoutBgImage }) => {
    const { breakpoints } = useLayoutContext()

    const LAYOUT_STYLE = { backgroundColor: layoutBgColor }
    const BG_POSTER = layoutBgImage ? layoutBgImage.poster : '/authPoster.webp'
    const BG_POSTER_PLACEHOLDER = layoutBgImage ? layoutBgImage.placeholder : '/authPosterPlaceholder.png'
    const pageWrapperStyle = !breakpoints.TABLET_LARGE && PAGE_WRAPPER_STYLE

    return (
        <Layout style={LAYOUT_STYLE}>
            <Row align='stretch' justify={breakpoints.TABLET_LARGE ? 'space-between' : 'center'} style={pageWrapperStyle}>
                {
                    Header && !breakpoints.TABLET_LARGE && (
                        <Col span={24}>
                            <MobileHeader>
                                {Header}
                            </MobileHeader>
                        </Col>
                    )
                }
                <Col md={12} sm={24} hidden={!breakpoints.TABLET_LARGE} style={POSTER_WRAPPER_STUMB_STYLE} />
                <Col md={12} sm={24} hidden={!breakpoints.TABLET_LARGE} style={POSTER_WRAPPER_COL_STYLE}>
                    <PosterWrapperFullHeight>
                        <Poster
                            Header={breakpoints.TABLET_LARGE && Header}
                            Footer={breakpoints.TABLET_LARGE && Footer}
                            src={BG_POSTER}
                            placeholderSrc={BG_POSTER_PLACEHOLDER}
                            imageStyle={IMAGE_STYLE}
                            imageWrapperStyle={IMAGE_WRAPPER_STYLE}
                            posterContentStyle={POSTER_CONTENT_STYLE}
                        />
                    </PosterWrapperFullHeight>
                </Col>
                <Col md={11} sm={24}>
                    <PageContent>
                        <ReCaptchaContainer id='ReCaptchaContainer'/>
                        <ChildrenWrapper isSmall={!breakpoints.TABLET_LARGE}>
                            {children}
                        </ChildrenWrapper>
                    </PageContent>
                </Col>
                {
                    Footer && !breakpoints.TABLET_LARGE && (
                        <PosterMobileFooter>
                            {Footer}
                        </PosterMobileFooter>
                    )
                }
            </Row>
        </Layout>
    )
}
