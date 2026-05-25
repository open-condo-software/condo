import { Layout, Row, Col } from 'antd'
import getConfig from 'next/config'
import React from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'

import { UI_LEGAL_INFO } from '@condo/domains/common/constants/featureflags'
import { SecondaryLink } from '@condo/domains/user/components/auth/SecondaryLink'

import styles from './Footer.module.css'


interface FooterConfig {
    [locale: string]: {
        privacyPolicyLink?: string
    }
}

const { publicRuntimeConfig: { footerConfig } } = getConfig() as { publicRuntimeConfig: { footerConfig: FooterConfig } }

export const Footer: React.FC = () => {
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const isLegalInfoEnabled = useFlag(UI_LEGAL_INFO)
    const privacyPolicyText = intl.formatMessage({ id: 'PrivacyPolicy' })

    const localizedFooterConfig = footerConfig?.[intl?.locale] || null

    return isLegalInfoEnabled && localizedFooterConfig && (
        <Layout.Footer
            className={styles.footer}
        >
            <Row justify='end'>
                {
                    localizedFooterConfig?.privacyPolicyLink &&
                    <Col>
                        <SecondaryLink
                            size='small'
                            href={localizedFooterConfig?.privacyPolicyLink}
                            target='_blank'
                        >
                            {privacyPolicyText}
                        </SecondaryLink>
                    </Col>
                }
            </Row>
        </Layout.Footer>
    )
}
