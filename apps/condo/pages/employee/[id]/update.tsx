import { ArrowLeftOutlined } from '@ant-design/icons'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { colors } from '@condo/domains/common/constants/style'
import { EmployeeProfileForm } from '@condo/domains/organization/components/EmployeeProfileForm'

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

const HeaderAction = () => {
    const intl = useIntl()
    const BackButtonLabel = intl.formatMessage({ id: 'Back' })
    const { query } = useRouter()

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={`/employee/${get(query, 'id')}/`}
        >
            {BackButtonLabel}
        </LinkWithIcon>
    )
}

EmployeeUpdatePage.headerAction = <HeaderAction/>

export default EmployeeUpdatePage
