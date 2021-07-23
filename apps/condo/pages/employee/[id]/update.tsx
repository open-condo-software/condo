import Head from 'next/head'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { EmployeeProfileForm } from '@condo/domains/organization/components/EmployeeProfileForm'
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
                <OrganizationRequired>
                    <PageContent>
                        <EmployeeProfileForm/>
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

EmployeeUpdatePage.headerAction = <ReturnBackHeaderAction
    descriptor={{ id: 'Back' }}
    path={(id) => `/employee/${id}/`}/>

export default EmployeeUpdatePage
