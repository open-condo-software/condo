import Head from 'next/head'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { UpdateEmployeeForm } from '@condo/domains/organization/components/EmployeeForm/UpdateEmployeeForm'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'

export const EmployeeUpdatePage = () => {
    const intl = useIntl()
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.UpdateTitle' })

    return (
        <>
            <Head>
                <title>{ UpdateEmployeeMessage }</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <UpdateEmployeeForm/>
                </PageContent>
            </PageWrapper>
        </>
    )
}

EmployeeUpdatePage.headerAction = (
    <ReturnBackHeaderAction
        descriptor={{ id: 'Back' }}
        path={(id) => `/employee/${id}/`}
    />
)

EmployeeUpdatePage.requiredAccess = OrganizationRequired

export default EmployeeUpdatePage
