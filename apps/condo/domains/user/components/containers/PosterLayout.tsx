import React from 'react'
import { Col, Row, Typography } from 'antd'
import { Poster } from '@condo/domains/common/components/Poster'
import { colors } from '@condo/domains/common/constants/style'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useIntl, FormattedMessage } from '@condo/next/intl'
import { ChildrenWrapper, Footer, Layout, PageContent, PosterWrapper, ReCaptchaContainer } from './styles'
import { AuthHeader } from './AuthHeader'

interface IPosterLayoutProps {
    headerAction: React.ReactElement
    layoutBgColor?: string
    layoutBgImage?: { poster: string, placeholder: string }
}
const TYPOGRAPHY_CONTACT_STYLE: React.CSSProperties = { color: colors.textSecondary }
const ROW_STYLE = { margin: '65px 0 65px', justifyContent: 'center' }
const RE_CAPTCHA_PARAGRAPH = { color: colors.textSecondary, width: '100%' }
const FOOTER_ROW_STYLE = { width: '45%', justifyContent: 'stretch' }

export const PosterLayout: React.FC<IPosterLayoutProps> = ({ children, headerAction, layoutBgColor, layoutBgImage }) => {
    const { isSmall } = useLayoutContext()
    const intl = useIntl()
    const LAYOUT_STYLE = { backgroundColor: layoutBgColor }
    const BG_POSTER = layoutBgImage ? layoutBgImage.poster : '/authPoster.png'
    const BG_POSTER_PLACEHOLDER = layoutBgImage ? layoutBgImage.placeholder : '/authPosterPlaceholder.png'
    const PrivacyPolicy = intl.formatMessage({ id: 'pages.auth.register.info.PrivacyPolicyContent' })
    const TermsOfService = intl.formatMessage({ id: 'pages.auth.register.info.termsOfService' })

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
                    <Footer isSmall={isSmall} >
                        <Row style={FOOTER_ROW_STYLE}>
                            <Row>
                                <Typography.Link
                                    href={`mailto:${SUPPORT_EMAIL}`}
                                    style={TYPOGRAPHY_CONTACT_STYLE}
                                >
                                    {SUPPORT_EMAIL}
                                </Typography.Link>
                                {', '}
                                <Typography.Link
                                    href={`tel:${SUPPORT_PHONE}`}
                                    style={TYPOGRAPHY_CONTACT_STYLE}
                                >
                                    {SUPPORT_PHONE}
                                </Typography.Link>
                            </Row>
                            <Typography.Paragraph style={RE_CAPTCHA_PARAGRAPH}>
                                <FormattedMessage
                                    id='pages.auth.register.info.RecaptchaPrivacyPolicyContent'
                                    values={{
                                        PrivacyPolicy: (
                                            <Typography.Link
                                                style={{ color: colors.black }}
                                                target='_blank'
                                                href='//policies.google.com/privacy'
                                                rel='noreferrer'>
                                                {PrivacyPolicy}
                                            </Typography.Link>
                                        ),
                                        TermsOfService: (
                                            <Typography.Link
                                                style={{ color: colors.black }}
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