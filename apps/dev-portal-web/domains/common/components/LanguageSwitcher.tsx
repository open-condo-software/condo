import { Dropdown } from 'antd'
import { setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Globe } from '@open-condo/icons'
import { colors } from '@open-condo/ui/colors'

import { LOCALES } from '@/domains/common/constants/locales'

import styles from './LanguageSwitcher.module.css'

import type { DropdownProps } from 'antd'


type LanguageSwitcherProps = {
    dropdownPlacement: DropdownProps['placement']
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ dropdownPlacement }) => {
    const intl = useIntl()
    const router = useRouter()

    const handleLocaleChange = useCallback(({ key }: { key: string }) => {
        setCookie('NEXT_LOCALE', key, { path: '/' })
        router.push(router.asPath,  router.asPath, { locale: key })
    }, [router])

    return (
        <Dropdown
            menu={{
                items: LOCALES.map(locale => ({
                    key: locale,
                    label: intl.formatMessage({ id: `global.service.languages.${locale}` }),
                })),
                onSelect: handleLocaleChange,
                selectable: true,
                defaultSelectedKeys: [intl.locale],
            }}
            placement={dropdownPlacement}
        >
            <span className={styles.dropoutWrapper}>
                <Globe size='large' color={colors.gray['7']}/>
            </span>
        </Dropdown>
    )
}