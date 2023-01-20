import { Col, Row, Typography } from 'antd'
import getConfig from 'next/config'
import React from 'react'

import { useIntl, FormattedMessage } from '@open-condo/next/intl'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Poster } from '@condo/domains/common/components/Poster'
import { colors } from '@condo/domains/common/constants/style'


import { AuthHeader } from './AuthHeader'
import { ChildrenWrapper, Footer, Layout, PageContent, PosterWrapper, ReCaptchaContainer } from './styles'

interface IPosterLayoutProps {
    headerAction: React.ReactElement
    layoutBgColor?: string
    layoutBgImage?: { poster: string, placeholder: string }
}
const TYPOGRAPHY_CONTACT_STYLE: React.CSSProperties = { color: colors.black }
const ROW_STYLE = { margin: '65px 0 65px', justifyContent: 'center' }
const FOOTER_STYLE = { width: '43%', justifyContent: 'stretch' }

const {
    publicRuntimeConfig: { HelpRequisites: { support_email: SUPPORT_EMAIL = null, support_phone: SUPPORT_PHONE = null } },
} = getConfig()

export const PosterLayout: React.FC<IPosterLayoutProps> = ({ children, headerAction, layoutBgColor, layoutBgImage }) => {
    const { isSmall } = useLayoutContext()
    const intl = useIntl()
    const PrivacyPolicy = intl.formatMessage({ id: 'pages.auth.register.info.PrivacyPolicyContent' })
    const TermsOfService = intl.formatMessage({ id: 'pages.auth.register.info.termsOfService' })
    const LAYOUT_STYLE = { backgroundColor: layoutBgColor }
    const BG_POSTER = layoutBgImage ? layoutBgImage.poster : '/authPoster.png'
    const BG_POSTER_PLACEHOLDER = layoutBgImage ? layoutBgImage.placeholder : '/authPosterPlaceholder.png'

    return (
        <Layout style={LAYOUT_STYLE}>
            <Row align='stretch' justify='center'>
                <AuthHeader headerAction={headerAction}/>
                <Col lg={12} md={24} hidden={isSmall}>
                    <PosterWrapper>
                        <Poster
                            src={BG_POSTER}
                            placeholderSrc={BG_POSTER_PLACEHOLDER}
                            placeholderColor={colors.black}
                        />
                    </PosterWrapper>
                </Col>
                <Col lg={12} md={24}>
                    <PageContent isSmall={isSmall}>
                        <ReCaptchaContainer id='ReCaptchaContainer'/>
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
                    <Footer isSmall={isSmall} style={FOOTER_STYLE}>
                        <Row>
                            {SUPPORT_EMAIL && SUPPORT_PHONE && <Row>
                                <Typography.Paragraph type='secondary' >
                                    <Typography.Link
                                        href={`mailto:${SUPPORT_EMAIL}`}
                                        style={TYPOGRAPHY_CONTACT_STYLE}
                                    >
                                        {SUPPORT_EMAIL}
                                    </Typography.Link>
                                    ,&nbsp;
                                    <Typography.Link
                                        href={`tel:${SUPPORT_PHONE}`}
                                        style={TYPOGRAPHY_CONTACT_STYLE}
                                    >
                                        {SUPPORT_PHONE}
                                    </Typography.Link>
                                </Typography.Paragraph>
                            </Row>}
                            <Typography.Paragraph type='secondary' >
                                <FormattedMessage
                                    id='pages.auth.register.info.RecaptchaPrivacyPolicyContent'
                                    values={{
                                        PrivacyPolicy: (
                                            <Typography.Link
                                                style={TYPOGRAPHY_CONTACT_STYLE}
                                                target='_blank'
                                                href='//policies.google.com/privacy'
                                                rel='noreferrer'>
                                                {PrivacyPolicy}
                                            </Typography.Link>
                                        ),
                                        TermsOfService: (
                                            <Typography.Link
                                                style={TYPOGRAPHY_CONTACT_STYLE}
                                                target='_blank'
                                                href='//policies.google.com/terms'
                                                rel='noreferrer'>
                                                {TermsOfService}
                                            </Typography.Link>
                                        ),
                                    }}
                                />
                            </Typography.Paragraph>
                        </Row>
                    </Footer>
                </Col>
            </Row>
        </Layout>
    )
}
