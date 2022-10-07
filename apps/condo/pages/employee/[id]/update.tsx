import { jsx } from '@emotion/react'
import { Col, Row, Typography } from 'antd'
import Head from 'next/head'
import React from 'react'
import { useIntl } from '@open-condo/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { UpdateEmployeeForm } from '@condo/domains/organization/components/EmployeeForm/UpdateEmployeeForm'

export const EmployeeUpdatePage = () => {
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
                                style={{ margin: 0, fontWeight: 'bold' }}
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

EmployeeUpdatePage.requiredAccess = OrganizationRequired

export default EmployeeUpdatePage
