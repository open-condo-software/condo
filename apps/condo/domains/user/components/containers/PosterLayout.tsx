import React from 'react'
import { Col, Row, Typography } from 'antd'
import { FormattedMessage } from 'react-intl'

import { Poster } from '@condo/domains/common/components/Poster'
import { colors } from '@condo/domains/common/constants/style'
import { Button } from '@condo/domains/common/components/Button'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { ChildrenWrapper, Footer, Layout, PageContent, PosterWrapper } from './styles'
import { AuthHeader } from './AuthHeader'
import { marginLeft } from 'html2canvas/dist/types/css/property-descriptors/margin'

interface IPosterLayoutProps {
    layoutBgColor?: string
}

const FOOTER_STYLES: React.CSSProperties = {
    backgroundColor: 'inherit',
    marginTop: 5,
    position: 'fixed',
    bottom: '8%',
    marginLeft: '5%',
}

const ROW_STYLE = { margin: '65px 0 65px' }

export const PosterLayout: React.FC<IPosterLayoutProps> = ({ children,  layoutBgColor }) => {
    const { isSmall } = useLayoutContext()

    const LAYOUT_STYLE = { backgroundColor: layoutBgColor }
    const CHILDREN_COL_PUSH = isSmall ? 0 : 4
    const CHILDREN_COL_PULL = isSmall ? 0 : 6
    const FOOTER_COL_PUSH = isSmall ? 0 : 4
    const FOOTER_COL_PULL = isSmall ? 0 : 6

    return (
        <Layout style={LAYOUT_STYLE}>
            <Row align={'stretch'}>
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
                                <Col lg={15} md={24} push={CHILDREN_COL_PUSH} pull={CHILDREN_COL_PULL}>
                                    {children}
                                </Col>
                            </Row>
                        </ChildrenWrapper>
                    </PageContent>
                </Col>
                <Col lg={12} md={24}>
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