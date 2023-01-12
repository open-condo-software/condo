// todo(DOMA-2567) add translates
import React from 'react'
import Head from 'next/head'

import { Typography } from '@open-condo/ui'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'


interface IUpdateIncidentPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const UpdateIncidentPageContent: React.FC = () => {
    const PageTitle = 'Редактировать запись'

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

const UpdateIncidentPage: IUpdateIncidentPage = () => {
    return <UpdateIncidentPageContent />
}

UpdateIncidentPage.requiredAccess = OrganizationRequired

export default UpdateIncidentPage
