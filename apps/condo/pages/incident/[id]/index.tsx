// todo(DOMA-2567) add translates
import React from 'react'
import Head from 'next/head'

import { Typography } from '@open-condo/ui'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'


interface IIncidentIdPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const IncidentIdPageContent: React.FC = () => {
    const PageTitle = 'Отключение №23'

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <TablePageContent>
                    Test
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const IncidentIdPage: IIncidentIdPage = () => {
    return <IncidentIdPageContent />
}

IncidentIdPage.requiredAccess = OrganizationRequired

export default IncidentIdPage
