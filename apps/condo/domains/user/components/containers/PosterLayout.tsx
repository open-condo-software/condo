import React from 'react'
import { Col, Row, Typography } from 'antd'

import { Poster } from '@condo/domains/common/components/Poster'
import { colors } from '@condo/domains/common/constants/style'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { ChildrenWrapper, Footer, Layout, PageContent, PosterWrapper } from './styles'
import { AuthHeader } from './AuthHeader'

interface IPosterLayoutProps {
    headerAction: React.ReactElement
    layoutBgColor?: string
}

const FOOTER_STYLES: React.CSSProperties = {
    backgroundColor: 'inherit',
    marginTop: 5,
    position: 'fixed',
    bottom: '8%',
    marginLeft: '5%',
}

const ROW_STYLE = { margin: '65px 0 65px', justifyContent: 'center' }

export const PosterLayout: React.FC<IPosterLayoutProps> = ({ children, headerAction, layoutBgColor }) => {
    const { isSmall } = useLayoutContext()

    const LAYOUT_STYLE = { backgroundColor: layoutBgColor }

    return (
        <Layout style={LAYOUT_STYLE}>
            <Row align={'stretch'} justify={'center'}>
                <AuthHeader headerAction={headerAction}/>
                <Col lg={12} md={24} hidden={isSmall}>
                    <PosterWrapper>
                        <Poster
                            src={'/authPoster.png'}
                            placeholderSrc={'/authPosterPlaceholder.png'}
                            placeholderColor={colors.black}
                        />
                    </PosterWrapper>
                </Col>
                <Col lg={12} md={24}>
                    <PageContent isSmall={isSmall}>
                        <ChildrenWrapper isSmall={isSmall}>
                            <Row style={ROW_STYLE}>
                                <Col span={24}>
                                    {children}
                                </Col>
                            </Row>
                        </ChildrenWrapper>
                    </PageContent>
                </Col>
                <Col span={24}>
                    <Footer isSmall={isSmall} style={FOOTER_STYLES}>
                        <Typography.Link
                            href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}
                        </Typography.Link>,
                        <Typography.Link
                            href={`tel:${SUPPORT_PHONE}`}>{SUPPORT_PHONE}
                        </Typography.Link>
                    </Footer>
                </Col>
            </Row>
        </Layout>
    )
}