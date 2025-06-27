import cookie from 'js-cookie'
import getConfig from 'next/config'
import React, { useState, useCallback } from 'react'

import { ChevronDown, ChevronUp } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Button, Space } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import styles from './CookieAgreement.module.css'


const { publicRuntimeConfig: { privacyPolicyUrl } } = getConfig()

const COOKIE_AGREEMENT_KEY = 'cookieAgreementAccepted'

export const CookieAgreement: React.FC = () => {
    const intl = useIntl()
    const CookieAgreementTitleMsg = intl.formatMessage({ id: 'component.CookieAgreement.title' })
    const CookieAgreementDescriptionMsg = intl.formatMessage({ id: 'component.CookieAgreement.description' })
    const CookieExpandActionMsg = intl.formatMessage({ id: 'component.CookieAgreement.action.expand' })
    const CookieAcceptActionMsg = intl.formatMessage({ id: 'component.CookieAgreement.action.accept' })

    const { breakpoints } = useLayoutContext()
    const desktopMode = !!breakpoints?.DESKTOP_SMALL

    const [displayMore, setDisplayMore] = useState(false)
    const [accepted, setAccepted] = useState(cookie.get(COOKIE_AGREEMENT_KEY) || false)

    const toggleMoreText = () => {
        setDisplayMore(prevState => !prevState)
    }

    const acceptCookieAgreement = useCallback(() => {
        cookie.set(COOKIE_AGREEMENT_KEY, true)
        setAccepted(true)
    }, [])

    if (accepted) {
        return null
    }

    return (
        <div className={styles.cookieAgreement}>
            <Space className={styles.cookieAgreementContent} direction={desktopMode ? 'horizontal' : 'vertical'} size={desktopMode ? 20 : 16}>
                <Space direction='vertical' size={8} align={desktopMode ? 'start' : 'center'}>
                    <Space direction={desktopMode ? 'horizontal' : 'vertical'} align={desktopMode ? 'start' : 'center'} size={8}>
                        <Typography.Paragraph>{CookieAgreementTitleMsg}</Typography.Paragraph>
                        <span className={styles.cookieAgreementMore}>
                            <Typography.Link
                                onClick={toggleMoreText}
                                size='large'
                            >
                                {CookieExpandActionMsg}
                                {
                                    displayMore
                                        ? <ChevronUp size='small'/>
                                        : <ChevronDown size='small'/>
                                }
                            </Typography.Link>
                        </span>
                    </Space>
                    {
                        displayMore && (
                            <Typography.Paragraph>
                                <Typography.Text type='secondary' size='medium'>{CookieAgreementDescriptionMsg} </Typography.Text>
                                {
                                    privacyPolicyUrl && (
                                        <Typography.Text type='secondary' size='medium'>
                                            {CookieExpandActionMsg} <Typography.Link href={privacyPolicyUrl} target='_blank'>{privacyPolicyUrl}</Typography.Link>
                                        </Typography.Text>
                                    ) 
                                }
                            </Typography.Paragraph>
                        )
                    }
                </Space>
                <Button type='primary' onClick={acceptCookieAgreement}>
                    {CookieAcceptActionMsg}
                </Button>
            </Space>
        </div>
    )
}