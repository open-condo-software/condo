import { Col, Row, Switch } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { SwitchChangeEventHandler } from 'antd/lib/switch'
import debounce from 'lodash/debounce'
import isBoolean from 'lodash/isBoolean'
import getConfig from 'next/config'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Info } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { LocaleContext, useIntl } from '@open-condo/next/intl'
import { Select, Tooltip, Typography } from '@open-condo/ui'

import { User } from '@condo/domains/user/utils/clientSchema'


const ROW_GUTTER_BIG: [Gutter, Gutter] = [0, 60]
const ROW_GUTTER_MID: [Gutter, Gutter] = [0, 40]
const ROW_GUTTER_SMALL: [Gutter, Gutter] = [0, 24]

const {
    publicRuntimeConfig: {
        telegramEmployeeBotName,
    },
} = getConfig()


export const UserSettingsContent: React.FC = () => {
    const intl = useIntl()
    const InterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.profile.interfaceLanguage' })
    const ChooseInterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.profile.chooseInterfaceLanguage' })
    const EmployeeTelegramTitle = intl.formatMessage({ id: 'pages.condo.profile.employeeTelegramBot.title' })
    const EmployeeTelegramTooltipMessage = intl.formatMessage({ id: 'pages.condo.profile.employeeTelegramBot.description' })
    const EmployeeTelegramOpenMessage = intl.formatMessage({ id: 'pages.condo.profile.employeeTelegramBot.open' })
    const GlobalHintsTitle = intl.formatMessage({ id: 'pages.condo.profile.globalHints' })
    const CompanyName = intl.formatMessage({ id: 'CompanyName' })
    const HasMarketingConsentTitle = intl.formatMessage({ id: 'pages.condo.profile.hasMarketingConsent' }, { company: CompanyName })
    const DisabledHasMarketingConsentTooltip = intl.formatMessage({ id: 'pages.condo.profile.hasMarketingConsent.disabled.tooltip' })

    const RuTitle = intl.formatMessage({ id: 'language.russian.withFlag' })
    const EnTitle = intl.formatMessage({ id: 'language.english-us.withFlag' })
    const EsTitle = intl.formatMessage({ id: 'language.spanish-es.withFlag' })

    const [showGlobalHints, setShowGlobalHints] = useState<boolean>(false)
    const [hasMarketingConsent, setMarketingConsent] = useState<boolean>(false)

    const { user, refetch } = useAuth()

    const updateUser = User.useUpdate({})

    const initialShowGlobalHints = user?.showGlobalHints || false
    const initialMarketingConsent = user?.hasMarketingConsent || false

    const possibleLocalesOptions = useMemo(() => ([
        { label: RuTitle, value: 'ru' },
        { label: EnTitle, value: 'en' },
        { label: EsTitle, value: 'es' },
    ]), [EnTitle, RuTitle, EsTitle])

    const handleLocaleChange = useCallback((setLocale) => async (newLocale) => {
        await updateUser({ locale: newLocale }, { id: user.id })
        setLocale(newLocale)
    }, [user.id])

    const updateUserInfo = useMemo(() => debounce(async (checked: boolean, fieldName: 'showGlobalHints' | 'hasMarketingConsent') => {
        try {
            await updateUser({ [fieldName]: checked }, { id: user.id })
            refetch()
        } catch (e) {
            console.error(`Failed to update field "${fieldName}"`)
        }
    }, 400), [user.id])

    const handleGlobalHintsChange: SwitchChangeEventHandler = useCallback(async (checked) => {
        setShowGlobalHints(checked)
        await updateUserInfo(checked, 'showGlobalHints')
    }, [updateUserInfo])

    const handleMarketingConsentChange: SwitchChangeEventHandler = useCallback(async (checked) => {
        setMarketingConsent(checked)
        await updateUserInfo(checked, 'hasMarketingConsent')
    }, [updateUserInfo])

    useEffect(() => {
        if (isBoolean(initialShowGlobalHints)) {
            setShowGlobalHints(initialShowGlobalHints)
        }
    }, [initialShowGlobalHints])

    useEffect(() => {
        if (isBoolean(initialMarketingConsent)) {
            setMarketingConsent(initialMarketingConsent)
        }
    }, [initialShowGlobalHints])

    return (
        <Row gutter={ROW_GUTTER_BIG}>
            <Col span={24}>
                <Row gutter={ROW_GUTTER_MID} justify='center'>
                    <Col span={24}>
                        <Row gutter={ROW_GUTTER_BIG}>
                            <Col span={24}>
                                <Row gutter={ROW_GUTTER_SMALL}>
                                    <Col span={24}>
                                        <Row gutter={ROW_GUTTER_MID} align='middle'>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {GlobalHintsTitle}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={5} offset={1}>
                                                <Switch
                                                    checked={showGlobalHints}
                                                    onChange={handleGlobalHintsChange}
                                                    disabled={!user}
                                                />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col span={24}>
                                        <Row gutter={ROW_GUTTER_MID} align='middle'>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {HasMarketingConsentTitle}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={5} offset={1}>
                                                <Tooltip title={!user?.email ? DisabledHasMarketingConsentTooltip : null}>
                                                    <Switch
                                                        checked={hasMarketingConsent}
                                                        onChange={handleMarketingConsentChange}
                                                        disabled={!user?.email}
                                                    />
                                                </Tooltip>
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col span={24}>
                                        <Row gutter={ROW_GUTTER_SMALL} align='middle'>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {InterfaceLanguageTitle}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={7} xl={5} offset={1}>
                                                <LocaleContext.Consumer>
                                                    {({ locale, setLocale }) => {
                                                        return (
                                                            <Select
                                                                options={possibleLocalesOptions}
                                                                value={locale}
                                                                placeholder={ChooseInterfaceLanguageTitle}
                                                                onChange={handleLocaleChange(setLocale)}
                                                            />
                                                        )
                                                    }}
                                                </LocaleContext.Consumer>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>

                            {
                                telegramEmployeeBotName && (
                                    <Col span={24}>
                                        <Row align='middle'>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    <span style={{ marginRight: 8 }}>
                                                        {EmployeeTelegramTitle}
                                                    </span>
                                                    <Tooltip title={EmployeeTelegramTooltipMessage}>
                                                        <span style={{ verticalAlign: 'middle' }}>
                                                            <Info size='small' />
                                                        </span>
                                                    </Tooltip>
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={18} xs={10} offset={1}>
                                                <Typography.Link
                                                    href={`https://t.me/${telegramEmployeeBotName}`}
                                                    target='_blank'
                                                    id='employee-telegram-bot'
                                                >
                                                    {EmployeeTelegramOpenMessage}
                                                </Typography.Link>
                                            </Col>
                                        </Row>
                                    </Col>
                                )
                            }
                        </Row>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}
