import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageHeader, PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { IncidentForm } from '@condo/domains/ticket/components/IncidentForm'
import { IncidentReadAndManagePermissionRequired } from '@condo/domains/ticket/components/PageAccess'

export interface ICreateIncidentPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const CreateIncidentPageContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'incident.create.title' })

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

CreateIncidentPage.requiredAccess = IncidentReadAndManagePermissionRequired

export default CreateIncidentPage
