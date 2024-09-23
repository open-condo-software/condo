import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { IPage } from '@condo/domains/common/types'
import { EmployeeRoleForm } from '@condo/domains/organization/components/EmployeeRoleForm'
import { EmployeeRolesReadAndManagePermissionRequired } from '@condo/domains/settings/components/PageAccess'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'


const CreateEmployeeRolePage: IPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.employeeRole.create.title' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader>
                    <Typography.Title>{PageTitle}</Typography.Title>
                </PageHeader>
                <PageContent>
                    <EmployeeRoleForm />
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateEmployeeRolePage.requiredAccess = EmployeeRolesReadAndManagePermissionRequired

export default CreateEmployeeRolePage

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const user = await prefetchAuth(client)

    if (!user) {
        return {
            unstable_redirect: {
                destination: '/auth/signin',
                permanent: false,
            },
        }
    }

    return extractSSRState(client, req, res, {
        props: {},
    })
}
