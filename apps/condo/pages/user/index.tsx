import { Col, Row, Switch, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { SwitchChangeEventHandler } from 'antd/lib/switch'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isBoolean from 'lodash/isBoolean'
import Head from 'next/head'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Edit } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { LocaleContext, useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Select } from '@open-condo/ui'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { FeatureFlagsController } from '@condo/domains/common/components/containers/FeatureFlag'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import { UserOrganizationsList } from '@condo/domains/user/components/UserOrganizationsList'
import { User } from '@condo/domains/user/utils/clientSchema'

const ROW_GUTTER_BIG: [Gutter, Gutter] = [0, 60]
const ROW_GUTTER_MID: [Gutter, Gutter] = [0, 40]
const ROW_GUTTER_SMALL: [Gutter, Gutter] = [0, 24]

interface IUserInfoPageContentProps {
    organizationEmployeesQuery: { where: { user: { id: string }, isAccepted: boolean } },
}

export const UserInfoPageContent: React.FC<IUserInfoPageContentProps> = ({ organizationEmployeesQuery }) => {
    const intl = useIntl()
    const PhoneMessage = intl.formatMessage({ id: 'phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.eMail' })
    const PasswordMessage = intl.formatMessage({ id: 'auth.signin.field.password' })
    const UpdateMessage = intl.formatMessage({ id: 'edit' })
    const InterfaceLanguageTitle = intl.formatMessage({ id: 'profile.interfaceLanguage' })
    const ChooseInterfaceLanguageTitle = intl.formatMessage({ id: 'profile.chooseInterfaceLanguage' })
    const GlobalHintsTitle = intl.formatMessage({ id: 'profile.globalHints' })
    const RuTitle = intl.formatMessage({ id: 'language.russian.withFlag' })
    const EnTitle = intl.formatMessage({ id: 'language.englishUs.withFlag' })

    const locale = intl.locale

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
                                                        <Col lg={3} xs={10}>
                                                            <Typography.Text type='secondary'>
                                                                {PhoneMessage}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col lg={19} xs={10} offset={2}>
                                                            <NotDefinedField value={phone}/>
                                                        </Col>
                                                        {
                                                            email && <>
                                                                <Col lg={3} xs={10}>
                                                                    <Typography.Text type='secondary'>
                                                                        {EmailMessage}
                                                                    </Typography.Text>
                                                                </Col>
                                                                <Col lg={19} xs={10} offset={2}>
                                                                    <NotDefinedField value={email}/>
                                                                </Col>
                                                            </>
                                                        }
                                                        <Col lg={3} xs={10}>
                                                            <Typography.Text type='secondary'>
                                                                {PasswordMessage}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col lg={19} xs={10} offset={2}>
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
                                        <Col span={24}>
                                            <Row gutter={ROW_GUTTER_MID}>
                                                <Col lg={3} xs={10}>
                                                    <Typography.Text type='secondary'>
                                                        {InterfaceLanguageTitle}
                                                    </Typography.Text>
                                                </Col>
                                                <Col lg={5} offset={2}>
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
                                        {/* NOTE: At the moment, our support portal only works in 'ru' locale,*/}
                                        {/* so hints for other locales are hidden*/}
                                        {locale === 'ru' && (
                                            <Col span={24}>
                                                <Row gutter={ROW_GUTTER_MID}>
                                                    <Col lg={3} xs={10}>
                                                        <Typography.Text type='secondary'>
                                                            {GlobalHintsTitle}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col lg={5} offset={2}>
                                                        <Switch
                                                            checked={showGlobalHints}
                                                            onChange={handleGlobalHintsChange}
                                                            disabled={!user}
                                                        />
                                                    </Col>
                                                </Row>
                                            </Col>
                                        )}
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
    const organizationEmployeesQuery = useMemo(() => ({ where: { user: { id: userId }, isAccepted: true } }), [userId])

    return (
        <UserInfoPageContent organizationEmployeesQuery={organizationEmployeesQuery}/>
    )
}

UserInfoPage.requiredAccess = AuthRequired

export default UserInfoPage
