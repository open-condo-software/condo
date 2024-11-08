import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { EmployeeRoleForm } from '@condo/domains/organization/components/EmployeeRoleForm'
import { EmployeeRolesReadAndManagePermissionRequired } from '@condo/domains/settings/components/PageAccess'


const UpdateEmployeeRolePage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.employeeRole.update.title' })

    const router = useRouter()

    const { query: { id } } = router as { query: { [key: string]: string } }

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
                    <EmployeeRoleForm id={id} />
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdateEmployeeRolePage.requiredAccess = EmployeeRolesReadAndManagePermissionRequired

export default UpdateEmployeeRolePage
