import { useGetActiveSppBillingContextQuery } from '@app/condo/gql'
import { Layout, Row, Col, RowProps } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { ExternalLink } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space } from '@open-condo/ui'

import { UI_LEGAL_INFO } from '@condo/domains/common/constants/featureflags'
import { CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'
import { SecondaryLink } from '@condo/domains/user/components/auth/SecondaryLink'

import styles from './Footer.module.css'


interface FooterConfig {
    [locale: string]: {
        privacyPolicyLink?: string
    }
}

interface SbbolAuthConfig {
    host?: string
    port?: string
}

const parseUrl = (url?: string): URL | null => {
    if (!url) return null

    try {
        return new URL(url)
    } catch {
        return null
    }
}

const getValidatedSppFintechUrl = (
    rawSppFintechUrl?: string,
    sbbolAuthConfig?: SbbolAuthConfig,
): string => {
    if (!rawSppFintechUrl) return ''

    const baseSppFintechUrl = `${sbbolAuthConfig?.host || ''}:${sbbolAuthConfig?.port || ''}`
    if (!parseUrl(baseSppFintechUrl)) return ''

    try {
        const resolvedSppFintechUrl = new URL(rawSppFintechUrl, baseSppFintechUrl).toString()
        return parseUrl(resolvedSppFintechUrl)?.toString() || ''
    } catch {
        return ''
    }
}

const { publicRuntimeConfig: { footerConfig, sppConfig, sppFintechUrl, sbbolAuthConfig } } = getConfig() as {
    publicRuntimeConfig: {
        footerConfig: FooterConfig
        sppConfig?: {
            BillingIntegrationId?: string
        }
        sppFintechUrl?: string
        sbbolAuthConfig?: SbbolAuthConfig
    }
}

const ITEMS_GUTTER: RowProps['gutter'] = [16, 0]

export const Footer: React.FC = () => {
    const router = useRouter()
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const userOrganization = useOrganization()
    const isLegalInfoEnabled = useFlag(UI_LEGAL_INFO)
    const privacyPolicyText = intl.formatMessage({ id: 'PrivacyPolicy' })
    const SppReturnLinkText = intl.formatMessage({ id: 'pages.billing.footer.sppFintechLink' })
    const orgId = userOrganization?.organization?.id || null
    const sppBillingId = sppConfig?.BillingIntegrationId || null
    const currentPath = router.asPath.split('?')[0]
    const isBillingPage = currentPath === '/billing' || currentPath.startsWith('/billing/')
    const resolvedSppFintechUrl = getValidatedSppFintechUrl(sppFintechUrl, sbbolAuthConfig)

    const localizedFooterConfig = footerConfig?.[intl?.locale] || null
    const { data } = useGetActiveSppBillingContextQuery({
        variables: {
            organization: { id: orgId },
            integration: { id: sppBillingId },
            status: CONTEXT_FINISHED_STATUS,
        },
        skip: !isBillingPage || !orgId || !sppBillingId,
    })
    const hasActiveSppBillingContext = Boolean(data?.contexts?.length)
    const shouldShowSppFintechLink = Boolean(isBillingPage && hasActiveSppBillingContext && resolvedSppFintechUrl)
    const shouldShowPrivacyPolicyLink = Boolean(isLegalInfoEnabled && localizedFooterConfig?.privacyPolicyLink)
    const shouldShowFooterLinks = shouldShowSppFintechLink || shouldShowPrivacyPolicyLink

    return (
        <Layout.Footer
            className={styles.footer}
        >
            {shouldShowFooterLinks && (
                <Row justify='end' gutter={ITEMS_GUTTER}>
                    {shouldShowSppFintechLink && (
                        <Col>
                            <SecondaryLink
                                size='small'
                                href={resolvedSppFintechUrl}
                                target='_blank'
                            >
                                <Space size={8}>
                                    <ExternalLink size='small' />
                                    {SppReturnLinkText}
                                </Space>
                            </SecondaryLink>
                        </Col>
                    )}
                    {shouldShowPrivacyPolicyLink && (
                        <Col>
                            <SecondaryLink
                                size='small'
                                href={localizedFooterConfig?.privacyPolicyLink}
                                target='_blank'
                            >
                                {privacyPolicyText}
                            </SecondaryLink>
                        </Col>
                    )}
                </Row>
            )}
        </Layout.Footer>
    )
}
