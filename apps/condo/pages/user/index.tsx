import { EditFilled } from '@ant-design/icons'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { LocaleContext, useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Select } from '@open-condo/ui'

import { Button } from '@condo/domains/common/components/Button'
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

export const UserInfoPageContent = ({ organizationEmployeesQuery }) => {
    const intl = useIntl()
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const PasswordMessage = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const InterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.profile.interfaceLanguage' })
    const ChooseInterfaceLanguageTitle = intl.formatMessage({ id: 'pages.condo.profile.chooseInterfaceLanguage' })
    const RuTitle = intl.formatMessage({ id: 'language.russian.withFlag' })
    const EnTitle = intl.formatMessage({ id: 'language.english-us.withFlag' })

    const { user, refetch } = useAuth()
    const userOrganization = useOrganization()
    const { isSmall } = useLayoutContext()

    useEffect(() => {
        refetch()
    }, [refetch])

    const name = get(user, 'name')
    const email = get(user, 'email', '')

    const possibleLocalesOptions = useMemo(() => ([
        { label: RuTitle, value: 'ru' },
        { label: EnTitle, value: 'en' },
    ]), [EnTitle, RuTitle])

    const updateUser = User.useUpdate({})

    const localeChangeHandler = useCallback((setLocale) => async (newLocale) => {
        await updateUser({ locale: newLocale }, { id: user.id })
        setLocale(newLocale)
    }, [updateUser, user.id])

    return (
        <>
            <Head>
                <title>{name}</title>
            </Head>
            <FeatureFlagsController/>
            <PageWrapper>
                <PageContent>
                    <Row gutter={ROW_GUTTER_MID} justify='center'>
                        <Col xs={10} lg={3}>
                            <UserAvatar borderRadius={24}/>
                        </Col>
                        <Col xs={24} lg={20} offset={ isSmall ? 0 : 1}>
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
                                                    <NotDefinedField value={get(user, 'phone')}/>
                                                </Col>
                                                {
                                                    email && <>
                                                        <Col lg={3} xs={10}>
                                                            <Typography.Text type='secondary'>
                                                                {EmailMessage}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col lg={19} xs={10} offset={2}>
                                                            <NotDefinedField value={get(user, 'email')}/>
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
                                        <Col span={24}>
                                            <Link href='/user/update'>
                                                <Button
                                                    color='green'
                                                    type='sberPrimary'
                                                    secondary
                                                    icon={<EditFilled />}
                                                >
                                                    {UpdateMessage}
                                                </Button>
                                            </Link>
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
                                                            onChange={localeChangeHandler(setLocale)}
                                                        />
                                                    )
                                                }}
                                            </LocaleContext.Consumer>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const UserInfoPage = () => {
    const { user } = useAuth()
    const userId = useMemo(() => get(user, 'id', null), [user])
    const organizationEmployeesQuery = useMemo(() => ({ where: { user: { id: userId }, isAccepted: true } }), [userId])

    return (
        <UserInfoPageContent organizationEmployeesQuery={organizationEmployeesQuery} />
    )
}

UserInfoPage.requiredAccess = AuthRequired

export default UserInfoPage
