import React from 'react'
import Head from 'next/head'
import { Typography } from 'antd'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '../../domains/organization/components/OrganizationRequired'

const SettingsPage =  () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Settings' })
    return (
        <>
            <Head>
                <title>
                    {PageTitle}
                </title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitle}</Typography.Title>}/>
            </PageWrapper>
            <OrganizationRequired>
                <PageContent>

                </PageContent>
            </OrganizationRequired>
        </>
    )
}

SettingsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.Settings' }}/>

export default SettingsPage