import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageHeader, PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState } from '@condo/domains/common/utils/next/ssr'
import { IncidentForm } from '@condo/domains/ticket/components/IncidentForm'
import { IncidentReadAndManagePermissionRequired } from '@condo/domains/ticket/components/PageAccess'

import type { GetServerSideProps } from 'next'


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

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
}
