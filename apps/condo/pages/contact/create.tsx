import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { CreateContactForm } from '@condo/domains/contact/components/CreateContactForm'
import { ContactsReadAndManagePermissionRequired } from '@condo/domains/contact/components/PageAccess'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuthOrRedirect } from '@/lib/auth'
import { prefetchOrganizationEmployee } from '@/lib/organization'
import { extractSSRState } from '@/lib/ssr'


interface ICreateContactPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const CreateContactPage: ICreateContactPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'contact.AddContact' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[12, 40]}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{PageTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <CreateContactForm/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateContactPage.requiredAccess = ContactsReadAndManagePermissionRequired

export default CreateContactPage

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    const { activeEmployee } = await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
}
