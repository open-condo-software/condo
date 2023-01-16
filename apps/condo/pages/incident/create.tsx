// todo(DOMA-2567) add translates
import React from 'react'
import Head from 'next/head'

import { Typography } from '@open-condo/ui'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageHeader, PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { IncidentForm } from '@condo/domains/ticket/components/IncidentForm'


interface ICreateIncidentPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const CreateIncidentPageContent: React.FC = () => {
    const PageTitle = 'Новая запись'

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <PageContent>
                    <IncidentForm />
                </PageContent>
            </PageWrapper>
        </>
    )
}

const CreateIncidentPage: ICreateIncidentPage = () => {
    return <CreateIncidentPageContent />
}

CreateIncidentPage.requiredAccess = OrganizationRequired

export default CreateIncidentPage
