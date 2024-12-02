import { Col, Typography } from 'antd'
import getConfig from 'next/config'
import React from 'react'

import { FormattedMessage, useIntl } from '@open-condo/next/intl'

import { colors } from '../../../common/constants/style'

const FORM_PARAGRAPH_STYLES: React.CSSProperties = {
    margin: '28px 0 12px',
    fontSize: '12px',
}

export const AgreementText = (): React.ReactElement => {
    const intl = useIntl()
    const { publicRuntimeConfig: { termsOfUseUrl, privacyPolicyUrl, dataProcessingConsentUrl } } = getConfig()
    const ConsentContent = intl.formatMessage( { id: 'pages.auth.register.info.ConsentContent' } )
    const PrivacyPolicyContent = intl.formatMessage( { id: 'pages.auth.register.info.PrivacyPolicyContent' } )
    const TermsOfUseContent = intl.formatMessage( { id: 'pages.auth.register.info.termsOfUseContent' } )

    return (
        <>
            {(termsOfUseUrl && privacyPolicyUrl && dataProcessingConsentUrl) &&
                (
                    <Col span={24}>
                        <Typography.Paragraph type='secondary' style={FORM_PARAGRAPH_STYLES}>
                            <FormattedMessage
                                id='pages.auth.register.info.PersonalDataProcessingConsent'
                                values={{
                                    termsOfUse: (
                                        <Typography.Link
                                            style={ { color: colors.black } }
                                            target='_blank'
                                            href={termsOfUseUrl}
                                            rel='noreferrer'
                                        >
                                            {TermsOfUseContent}
                                        </Typography.Link>
                                    ),
                                    consentLink: (
                                        <Typography.Link
                                            style={ { color: colors.black } }
                                            target='_blank'
                                            href={dataProcessingConsentUrl}
                                            rel='noreferrer'>
                                            {ConsentContent}
                                        </Typography.Link>
                                    ),
                                    privacyPolicyLink: (
                                        <Typography.Link
                                            style={ { color: colors.black } }
                                            target='_blank'
                                            href={privacyPolicyUrl}
                                            rel='noreferrer'>
                                            {PrivacyPolicyContent}
                                        </Typography.Link>
                                    ),
                                }}
                            />
                        </Typography.Paragraph>
                    </Col>
                )
            }
        </>
    )
}