import { Col } from 'antd'
import getConfig from 'next/config'
import React from 'react'

import { FormattedMessage, useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { colors } from '@condo/domains/common/constants/style'

type AgreementTextProps = {
    tabIndexes?: {
        termsOfUse: number
        consentLink: number
        privacyPolicyLink: number
    }
}

export const AgreementText: React.FC<AgreementTextProps> = ({ tabIndexes }): React.ReactElement => {
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
                        <Typography.Paragraph type='secondary' size='small'>
                            <FormattedMessage
                                id='pages.auth.register.info.PersonalDataProcessingConsent'
                                values={{
                                    termsOfUse: (
                                        <Typography.Link
                                            style={ { color: colors.black } }
                                            target='_blank'
                                            href={termsOfUseUrl}
                                            rel='noreferrer'
                                            tabIndex={tabIndexes?.termsOfUse}
                                        >
                                            {TermsOfUseContent}
                                        </Typography.Link>
                                    ),
                                    consentLink: (
                                        <Typography.Link
                                            style={ { color: colors.black } }
                                            target='_blank'
                                            href={dataProcessingConsentUrl}
                                            rel='noreferrer'
                                            tabIndex={tabIndexes?.consentLink}
                                        >
                                            {ConsentContent}
                                        </Typography.Link>
                                    ),
                                    privacyPolicyLink: (
                                        <Typography.Link
                                            style={ { color: colors.black } }
                                            target='_blank'
                                            href={privacyPolicyUrl}
                                            rel='noreferrer'
                                            tabIndex={tabIndexes?.privacyPolicyLink}
                                        >
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