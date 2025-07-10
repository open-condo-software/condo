import { Col, Row } from 'antd'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { UpdateEmployeeForm } from '@condo/domains/organization/components/EmployeeForm/UpdateEmployeeForm'
import { EmployeesReadAndManagePermissionRequired } from '@condo/domains/organization/components/PageAccess'

export const EmployeeUpdatePage: PageComponentType = () => {
    const intl = useIntl()
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.UpdateTitle' })

    return (
        <>
            <Head>
                <title>{UpdateEmployeeMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[12, 40]}>
                        <Col span={24}>
                            <Typography.Title
                                level={1}
                            >
                                {UpdateEmployeeMessage}
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <UpdateEmployeeForm/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

EmployeeUpdatePage.requiredAccess = EmployeesReadAndManagePermissionRequired

export default EmployeeUpdatePage
