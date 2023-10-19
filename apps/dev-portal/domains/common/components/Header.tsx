import { Dropdown } from 'antd'
import { setCookie } from 'cookies-next'
import { Montserrat } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Globe } from '@open-condo/icons'
import { Space } from '@open-condo/ui'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { LOCALES } from '@/domains/common/constants/locales'

import { AuthHeaderAction } from './auth/AuthAction'
import styles from './Header.module.css'

const logoFont = Montserrat({
    subsets: ['latin', 'cyrillic'],
    style: ['normal'],
    weight: '600',
})

export const Header: React.FC = () => {
    const intl = useIntl()
    const ServiceShortTitle = intl.formatMessage({ id: 'global.service.name.short' })
    const router = useRouter()

    const handleLocaleChange = useCallback(({ key }: { key: string }) => {
        setCookie('NEXT_LOCALE', key, { path: '/' })
        router.push(router.asPath,  router.asPath, { locale: key })
    }, [router])

    return (
        <header className={styles.header}>
            <Space direction='horizontal' size={40}>
                <Link href='/' className={styles.logoContainer} locale={router.locale}>
                    <div className={styles.logoImageWrapper}>
                        <Image className={styles.logo} src='/logo.svg' alt='Logo' fill priority draggable={false}/>
                    </div>
                    <span
                        className={`${logoFont.className} ${styles.logoText}`}
                    >
                        {ServiceShortTitle}
                    </span>
                </Link>
                <Space direction='horizontal' size={20}>
                    <Typography.Title level={4} type='secondary'>Документация</Typography.Title>
                    <Typography.Title level={4} type='secondary'>Мои приложения</Typography.Title>
                </Space>
            </Space>
            <Space direction='horizontal' align='center' size={20}>
                <Dropdown
                    menu={{
                        items: LOCALES.map(locale => ({
                            key: locale,
                            label: intl.formatMessage({ id: `global.lang.${locale}` }),
                        })),
                        onSelect: handleLocaleChange,
                        selectable: true,
                        defaultSelectedKeys: [intl.locale],
                    }}
                    placement='bottom'
                >
                    <span className={styles.dropoutWrapper}>
                        <Globe size='large' color={colors.gray['7']}/>
                    </span>
                </Dropdown>
                <AuthHeaderAction/>
            </Space>
        </header>
    )
}