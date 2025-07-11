import { Layout, Row } from 'antd'
import classnames from 'classnames'
import getConfig from 'next/config'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import styles from './Footer.module.css'


const { publicRuntimeConfig: { footerConfig } } = getConfig()

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
            {
                localizedFooterConfig?.privacyPolicyLink &&
                <Row justify='end'>
                    <Typography.Link
                        size='small'
                        href={localizedFooterConfig?.privacyPolicyLink}
                        target='_blank'
                        style={{ color: colors.gray[7] }}
                    >
                        {privacyPolicyText}
                    </Typography.Link>
                </Row>
            }
        </Layout.Footer>
    )
}
