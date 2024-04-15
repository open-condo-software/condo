import { Col, Row, Switch, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { SwitchChangeEventHandler } from 'antd/lib/switch'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isBoolean from 'lodash/isBoolean'
import getConfig from 'next/config'
import Head from 'next/head'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Edit, Info } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { LocaleContext, useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Select, Tooltip } from '@open-condo/ui'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { FeatureFlagsController } from '@condo/domains/common/components/containers/FeatureFlag'
import { HOLDING_TYPE } from '@condo/domains/organization/constants/common'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import { UserOrganizationsList } from '@condo/domains/user/components/UserOrganizationsList'
import { User } from '@condo/domains/user/utils/clientSchema'

import type { OrganizationEmployeeWhereInput } from '@app/condo/schema'

const ROW_GUTTER_BIG: [Gutter, Gutter] = [0, 60]
const ROW_GUTTER_MID: [Gutter, Gutter] = [0, 40]
const ROW_GUTTER_SMALL: [Gutter, Gutter] = [0, 24]

const {
    publicRuntimeConfig: {
        telegramEmployeeBotName,
    },
} = getConfig()

interface IUserInfoPageContentProps {
    organizationEmployeesQuery: { where: OrganizationEmployeeWhereInput },
}

export const UserInfoPageContent: React.FC<IUserInfoPageContentProps> = ({ organizationEmployeesQuery }) => {
    const intl = useIntl()
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const PasswordMessage = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const InterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.profile.interfaceLanguage' })
    const ChooseInterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.profile.chooseInterfaceLanguage' })
    const EmployeeTelegramTitle = intl.formatMessage({ id: 'pages.condo.profile.employeeTelegramBot.title' })
    const EmployeeTelegramTooltipMessage = intl.formatMessage({ id: 'pages.condo.profile.employeeTelegramBot.description' })
    const EmployeeTelegramOpenMessage = intl.formatMessage({ id: 'pages.condo.profile.employeeTelegramBot.open' })
    const GlobalHintsTitle = intl.formatMessage({ id: 'pages.condo.profile.globalHints' })
    const RuTitle = intl.formatMessage({ id: 'language.russian.withFlag' })
    const EnTitle = intl.formatMessage({ id: 'language.english-us.withFlag' })

    const [showGlobalHints, setShowGlobalHints] = useState<boolean>(false)

    const { user, refetch } = useAuth()
    const userOrganization = useOrganization()
    const { breakpoints } = useLayoutContext()

    const updateUser = User.useUpdate({})

    const name = get(user, 'name')
    const email = get(user, 'email', '')
    const phone = get(user, 'phone')
    const initialShowGlobalHints = get(user, 'showGlobalHints')

    const possibleLocalesOptions = useMemo(() => ([
        { label: RuTitle, value: 'ru' },
        { label: EnTitle, value: 'en' },
    ]), [EnTitle, RuTitle])

    const handleLocaleChange = useCallback((setLocale) => async (newLocale) => {
        await updateUser({ locale: newLocale }, { id: user.id })
        setLocale(newLocale)
    }, [user.id])

    const updateGlobalHints = useMemo(() => debounce(async (checked) => {
        try {
            await updateUser({ showGlobalHints: checked }, { id: user.id })
            refetch()
        } catch (e) {
            console.error('Failed to update field "showGlobalHints"')
        }
    }, 400), [user.id])

    const handleGlobalHintsChange: SwitchChangeEventHandler = useCallback(async (checked) => {
        setShowGlobalHints(checked)
        await updateGlobalHints(checked)
    }, [updateGlobalHints])

    useEffect(() => {
        refetch()
    }, [])

    useEffect(() => {
        if (isBoolean(initialShowGlobalHints)) {
            setShowGlobalHints(initialShowGlobalHints)
        }
    }, [initialShowGlobalHints])

    return (
        <>
            <Head>
                <title>{name}</title>
            </Head>
            <FeatureFlagsController/>
            <PageWrapper>
                <PageContent>
                    <Row gutter={ROW_GUTTER_BIG}>
                        <Col span={24}>
                            <Row gutter={ROW_GUTTER_MID} justify='center'>
                                <Col xs={10} lg={3}>
                                    <UserAvatar borderRadius={24}/>
                                </Col>
                                <Col xs={24} lg={20} offset={!breakpoints.TABLET_LARGE ? 0 : 1}>
                                    <Row gutter={ROW_GUTTER_BIG}>
                                        <Col span={24}>
                                            <Row gutter={ROW_GUTTER_MID}>
                                                <Col span={24}>
                                                    <Typography.Title
                                                        level={1}
                                                        style={{ margin: 0, fontWeight: 'bold' }}
                                                    >
                                                        {name}
                                                    </Typography.Title>
                                                </Col>
                                                <Col span={24}>
                                                    <Row gutter={ROW_GUTTER_SMALL}>
                                                        <Col lg={5} xs={10}>
                                                            <Typography.Text type='secondary'>
                                                                {PhoneMessage}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col lg={18} xs={10} offset={1}>
                                                            <NotDefinedField value={phone}/>
                                                        </Col>
                                                        {
                                                            email && <>
                                                                <Col lg={5} xs={10}>
                                                                    <Typography.Text type='secondary'>
                                                                        {EmailMessage}
                                                                    </Typography.Text>
                                                                </Col>
                                                                <Col lg={18} xs={10} offset={1}>
                                                                    <NotDefinedField value={email}/>
                                                                </Col>
                                                            </>
                                                        }
                                                        <Col lg={5} xs={10}>
                                                            <Typography.Text type='secondary'>
                                                                {PasswordMessage}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col lg={18} xs={10} offset={1}>
                                                            <NotDefinedField value='******'/>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col span={24}>
                                            {
                                                userOrganization
                                                    ? (<UserOrganizationsList
                                                        userOrganization={userOrganization}
                                                        organizationEmployeesQuery={organizationEmployeesQuery}
                                                    />)
                                                    : null
                                            }
                                        </Col>
                                        {
                                            telegramEmployeeBotName && (
                                                <Col span={24}>
                                                    <Row>
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
                                                            <Typography.Link href={`https://t.me/${telegramEmployeeBotName}`} target='_blank'>
                                                                {EmployeeTelegramOpenMessage}
                                                            </Typography.Link>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            )
                                        }
                                        <Col span={24}>
                                            <Row gutter={ROW_GUTTER_MID}>
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
                                        <Col span={24}>
                                            <Row gutter={ROW_GUTTER_MID}>
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
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <ActionBar
                                actions={[
                                    <Link key='update' href='/user/update'>
                                        <Button
                                            type='primary'
                                            icon={<Edit size='medium'/>}
                                        >
                                            {UpdateMessage}
                                        </Button>
                                    </Link>,
                                ]}
                            />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const UserInfoPage: React.FC & { requiredAccess?: React.FC } = () => {
    const { user } = useAuth()
    const userId = useMemo(() => get(user, 'id', null), [user])
    const organizationEmployeesQuery = useMemo(() => ({
        where: {
            user: { id: userId },
            isAccepted: true,
            organization: { type_not: HOLDING_TYPE },
        },
    }), [userId])

    return (
        <UserInfoPageContent organizationEmployeesQuery={organizationEmployeesQuery}/>
    )
}

UserInfoPage.requiredAccess = AuthRequired

export default UserInfoPage
