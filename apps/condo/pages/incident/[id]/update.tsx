import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageHeader, PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { IncidentForm } from '@condo/domains/ticket/components/IncidentForm'
import { IncidentReadAndManagePermissionRequired } from '@condo/domains/ticket/components/PageAccess'

export interface IUpdateIncidentPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const UpdateIncidentPageContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'incident.update.title' })

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

UpdateIncidentPage.requiredAccess = IncidentReadAndManagePermissionRequired

export default UpdateIncidentPage
