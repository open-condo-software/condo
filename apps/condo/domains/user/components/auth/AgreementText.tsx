import { Col } from 'antd'
import getConfig from 'next/config'
import React from 'react'

import { FormattedMessage, useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { SecondaryLink } from './SecondaryLink'


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
    const ConsentContent = intl.formatMessage( { id: 'pages.auth.register.info.dataProcessingContent' } )
    const PrivacyPolicyContent = intl.formatMessage( { id: 'pages.auth.register.info.PrivacyPolicyContent' } )
    const TermsOfUseContent = intl.formatMessage( { id: 'pages.auth.register.info.termsOfUseContent' } )

    return (
        <>
            {true &&
                (
                    <Col span={24}>
                        <Typography.Paragraph type='secondary' size='small'>
                            <FormattedMessage
                                id='pages.auth.register.info.PersonalDataProcessingConsent'
                                values={{
                                    termsOfUse: (
                                        <SecondaryLink
                                            target='_blank'
                                            href={termsOfUseUrl}
                                            rel='noreferrer'
                                            tabIndex={tabIndexes?.termsOfUse}
                                        >
                                            {TermsOfUseContent}
                                        </SecondaryLink>
                                    ),
                                    consentLink: (
                                        <SecondaryLink
                                            target='_blank'
                                            href={dataProcessingConsentUrl}
                                            rel='noreferrer'
                                            tabIndex={tabIndexes?.consentLink}
                                        >
                                            {ConsentContent}
                                        </SecondaryLink>
                                    ),
                                    privacyPolicyLink: (
                                        <SecondaryLink
                                            target='_blank'
                                            href={privacyPolicyUrl}
                                            rel='noreferrer'
                                            tabIndex={tabIndexes?.privacyPolicyLink}
                                        >
                                            {PrivacyPolicyContent}
                                        </SecondaryLink>
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