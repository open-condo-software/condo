import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { CreateEmployeeForm } from '@condo/domains/organization/components/EmployeeForm/CreateEmployeeForm'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import {
    EmployeesReadAndInvitePermissionRequired,
} from '@condo/domains/organization/components/PageAccess'


const CreateEmployeePage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'employee.AddEmployee' })
        
    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageContent>
                        <Row gutter={[12, 40]}>
                            <Col span={24}>
                                <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                            </Col>
                            <Col span={24}>
                                <CreateEmployeeForm />
                            </Col>
                        </Row>
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

CreateEmployeePage.requiredAccess = EmployeesReadAndInvitePermissionRequired

export default CreateEmployeePage
