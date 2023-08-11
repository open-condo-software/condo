import { Col, Row, Typography } from 'antd'
import Head from 'next/head'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { UpdateEmployeeForm } from '@condo/domains/organization/components/EmployeeForm/UpdateEmployeeForm'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const TITLE_STYLES: CSSProperties = { margin: 0, fontWeight: 'bold' }

export const EmployeeUpdatePage = () => {
    const intl = useIntl()
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.updateTitle' })

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
                                style={TITLE_STYLES}
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
