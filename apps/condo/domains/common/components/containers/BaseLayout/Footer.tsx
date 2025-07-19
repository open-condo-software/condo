import { Layout, Row, Col } from 'antd'
import classnames from 'classnames'
import getConfig from 'next/config'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
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
    const privacyPolicyText = intl.formatMessage({ id: 'PrivacyPolicy' })

    const { breakpoints } = useLayoutContext()

    const localizedFooterConfig = footerConfig?.[intl?.locale] || null

    const footerClassName = useMemo(() => classnames(styles.footer, (!breakpoints.TABLET_LARGE ? styles.mobileFooter : styles.desktopFooter)), [breakpoints.TABLET_LARGE])

    return localizedFooterConfig && (
        <Layout.Footer
            className={footerClassName}
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
