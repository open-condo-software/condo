// todo(DOMA-2567) add translates
import React from 'react'
import Head from 'next/head'

import { Typography } from '@open-condo/ui'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageHeader, PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { IncidentForm } from '@condo/domains/ticket/components/IncidentForm'
import { useRouter } from 'next/router'


interface IUpdateIncidentPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const UpdateIncidentPageContent: React.FC = () => {
    const PageTitle = 'Редактировать запись'

    const router = useRouter()

    const { query: { id } } = router as { query: { [key: string]: string } }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <PageContent>
                    <IncidentForm id={id} />
                </PageContent>
            </PageWrapper>
        </>
    )
}

const UpdateIncidentPage: IUpdateIncidentPage = () => {
    return <UpdateIncidentPageContent />
}

UpdateIncidentPage.requiredAccess = OrganizationRequired

export default UpdateIncidentPage
