import React from 'react'
import { Col, Row } from 'antd'
import { FormattedMessage } from 'react-intl'

import { Poster } from '@condo/domains/common/components/Poster'
import { colors } from '@condo/domains/common/constants/style'
import { Button } from '@condo/domains/common/components/Button'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { ChildrenWrapper, Footer, Layout, PageContent, PosterWrapper } from './styles'
import { AuthLayoutContextProvider } from './AuthLayoutContext'
import { AuthHeader } from './AuthHeader'

interface IPosterLayoutProps {
    headerAction: React.ReactElement,
    layoutBgColor?: string
}

export const PosterLayout: React.FC<IPosterLayoutProps> = ({ children, headerAction, layoutBgColor }) => {
    const { isSmall } = useLayoutContext()

    return (
        <Layout style={{ backgroundColor: layoutBgColor }}>
            <AuthHeader headerAction={headerAction}/>
            <Row align={'stretch'}>
                <Col lg={11} md={24} hidden={isSmall}>
                    <PosterWrapper>
                        <Poster
                            src={'/authPoster.png'}
                            placeholderSrc={'/authPosterPlaceholder.png'}
                            placeholderColor={colors.selago}
                        />
                    </PosterWrapper>
                </Col>
                <Col lg={13} md={24}>
                    <PageContent isSmall={isSmall}>
                        <ChildrenWrapper isSmall={isSmall}>
                            <Row>
                                <Col lg={14} md={24} push={isSmall ? 0 : 4} pull={isSmall ? 0 : 6}>
                                    <AuthLayoutContextProvider>
                                        {children}
                                    </AuthLayoutContextProvider>
                                </Col>
                            </Row>
                            <Footer isSmall={isSmall} style={{ backgroundColor: 'inherit' }}>
                                <Row>
                                    <Col lg={14} md={24} push={isSmall ? 0 : 4} pull={isSmall ? 0 : 6}>
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