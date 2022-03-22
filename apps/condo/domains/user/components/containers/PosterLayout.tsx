import React from 'react'
import { Col, Row } from 'antd'
import { FormattedMessage } from 'react-intl'

import { Poster } from '@condo/domains/common/components/Poster'
import { colors } from '@condo/domains/common/constants/style'
import { Button } from '@condo/domains/common/components/Button'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { ChildrenWrapper, Footer, Layout, PageContent, PosterWrapper } from './styles'
import { AuthHeader } from './AuthHeader'

interface IPosterLayoutProps {
    headerAction: React.ReactElement,
    layoutBgColor?: string
}

const FOOTER_STYLES: React.CSSProperties = { backgroundColor: 'inherit', marginTop: 5, position: 'static' }
const ROW_STYLE = { marginTop: 65 }

export const PosterLayout: React.FC<IPosterLayoutProps> = ({ children, headerAction, layoutBgColor }) => {
    const { isSmall } = useLayoutContext()

    const LAYOUT_STYLE = { backgroundColor: layoutBgColor }
    const POSTER_WRAPPER_STYLE = { backgroundColor: colors.backgroundLightGrey }
    const CHILDREN_COL_PUSH = isSmall ? 0 : 4
    const CHILDREN_COL_PULL = isSmall ? 0 : 6
    const FOOTER_COL_PUSH = isSmall ? 0 : 4
    const FOOTER_COL_PULL = isSmall ? 0 : 6

    return (
        <Layout style={LAYOUT_STYLE}>
            <AuthHeader headerAction={headerAction}/>
            <Row align={'stretch'}>
                <Col lg={11} md={24} hidden={isSmall} style={POSTER_WRAPPER_STYLE}>
                    <PosterWrapper>
                        <Poster
                            src={'/authPoster.png'}
                            placeholderSrc={'/authPosterPlaceholder.png'}
                            placeholderColor={colors.black}
                        />
                    </PosterWrapper>
                </Col>
                <Col lg={13} md={24}>
                    <PageContent isSmall={isSmall}>
                        <ChildrenWrapper isSmall={isSmall}>
                            <Row style={ROW_STYLE}>
                                <Col lg={15} md={24} push={CHILDREN_COL_PUSH} pull={CHILDREN_COL_PULL}>
                                    {children}
                                </Col>
                            </Row>
                            <Footer isSmall={isSmall} style={FOOTER_STYLES}>
                                <Row>
                                    <Col lg={15} md={24} push={FOOTER_COL_PUSH} pull={FOOTER_COL_PULL}>
                                        <FormattedMessage
                                            id='FooterText'
                                            values={{
                                                email: <Button size={'small'} type={'inlineLink'} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Button>,
                                                phone: <Button size={'small'} type={'inlineLink'} href={`tel:${SUPPORT_PHONE}`}>{SUPPORT_PHONE}</Button>,
                                            }}
                                        />
                                    </Col>
                                </Row>
                            </Footer>
                        </ChildrenWrapper>
                    </PageContent>
                </Col>
            </Row>
        </Layout>
    )
}