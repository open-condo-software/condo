import styled from '@emotion/styled'
import { Layout, theme, Dropdown } from 'antd'
import { setCookie } from 'cookies-next'
import { LOCALES } from 'domains/common/constants/locales'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Globe } from '@open-condo/icons'
import { Space } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

const STATIC_HEADER_STYLES: CSSProperties = {
    padding: '12px 32px',
    boxSizing: 'border-box',
    height: 'auto',
    borderBottom: `1px solid ${colors.gray['3']}`,
    lineHeight: 'inherit',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
}

const LOGO_IMAGE_STYLES: CSSProperties = {
    objectFit: 'contain',
    objectPosition: 'left',
}

const LogoContainer = styled.div`
  position: relative;
  width: 304px;
  height: 28px;
`

const DropoutIconWrapper = styled.span`
  cursor: pointer;
`

export const Header: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()

    const { token: { colorBgContainer } } = theme.useToken()

    const handleLocaleChange = useCallback(({ key }: { key: string }) => {
        setCookie('NEXT_LOCALE', key)
        router.push(router.asPath,  router.asPath, { locale: key })
    }, [router])

    return (
        <Layout.Header style={{ ...STATIC_HEADER_STYLES, background: colorBgContainer }}>
            <div style={{
                position: 'relative',
                width: 304,
                height: 28,
            }}>
                <Image src='/logo.svg' alt='Logo' fill style={LOGO_IMAGE_STYLES} priority/>
            </div>
            {/*<LogoContainer>*/}
            {/*    */}
            {/*</LogoContainer>*/}
            <Space direction='horizontal' align='end' size={24}>
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
                    <DropoutIconWrapper>
                        <Globe size='large' color={colors.gray['7']}/>
                    </DropoutIconWrapper>
                </Dropdown>
            </Space>
        </Layout.Header>
    )
}