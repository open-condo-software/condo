import { Col, Row, Typography } from 'antd'
import Head from 'next/head'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { UpdateEmployeeForm } from '@condo/domains/organization/components/EmployeeForm/UpdateEmployeeForm'
import { EmployeesReadAndManagePermissionRequired } from '@condo/domains/organization/components/PageAccess'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'

const TITLE_STYLES: CSSProperties = { margin: 0, fontWeight: 'bold' }

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

EmployeeUpdatePage.requiredAccess = EmployeesReadAndManagePermissionRequired

export default EmployeeUpdatePage

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
