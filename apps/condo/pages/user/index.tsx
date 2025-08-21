import { OrganizationTypeType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import Head from 'next/head'
import React, { useEffect, useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { TabItem, Typography } from '@open-condo/ui'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TabsPageContent } from '@condo/domains/common/components/TabsPageContent'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { UserInfoContent, type UserInfoContentProps } from '@condo/domains/user/components/UserInfoContent'
import { UserSettingsContent } from '@condo/domains/user/components/UserSettingsContent'

import styles from './index.module.css'


const ROW_GUTTER_BIG: [Gutter, Gutter] = [0, 60]

type UserInfoPageContentProps = {
    useAllOrganizationEmployee: UserInfoContentProps['useAllOrganizationEmployee']
}

const USER_TABS = {
    INFO: 'INFO',
    SETTINGS: 'SETTINGS',
}
const AVAILABLE_TABS = [USER_TABS.INFO, USER_TABS.SETTINGS]

export const UserInfoPageContent: React.FC<UserInfoPageContentProps> = ({ useAllOrganizationEmployee }) => {
    const intl = useIntl()
    const UserInfoTitle = intl.formatMessage({ id: 'pages.condo.profile.tabs.info' })
    const UserSettingsTitle = intl.formatMessage({ id: 'pages.condo.profile.tabs.settings' })

    const { user, refetch } = useAuth()

    const name = get(user, 'name')

    useEffect(() => {
        refetch()
    }, [])

    const userInfoTabs = useMemo<Array<TabItem>>(() => [
        {
            key: USER_TABS.INFO,
            label: UserInfoTitle,
            children: <UserInfoContent useAllOrganizationEmployee={useAllOrganizationEmployee} />,
        },
        {
            key: USER_TABS.SETTINGS,
            label: UserSettingsTitle,
            children: <UserSettingsContent />,
        },
    ], [UserInfoTitle, UserSettingsTitle, useAllOrganizationEmployee])

    return (
        <>
            <Head>
                <title>{name}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={ROW_GUTTER_BIG}>
                        <Col span={24}>
                            <Typography.Title
                                level={1}
                            >
                                {name}
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <TabsPageContent
                                tabItems={userInfoTabs}
                                availableTabs={AVAILABLE_TABS}
                                tabsClassName={styles.customTabs}
                            />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const useAllOrganizationEmployee = () => {
    const { user } = useAuth()
    const userId = useMemo(() => get(user, 'id', null), [user])

    return OrganizationEmployee.useAllObjects({
        where: {
            user: { id: userId },
            isAccepted: true,
            organization: { type_not: OrganizationTypeType.Holding },
        },
    }, { skip: !userId })
}

const UserInfoPage: PageComponentType = () => {
    return (
        <UserInfoPageContent useAllOrganizationEmployee={useAllOrganizationEmployee}/>
    )
}

UserInfoPage.requiredAccess = AuthRequired

export default UserInfoPage
