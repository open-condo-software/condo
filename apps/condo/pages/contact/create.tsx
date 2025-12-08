import { Row, Col } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { CreateContactForm } from '@condo/domains/contact/components/CreateContactForm'
import { ContactsReadAndManagePermissionRequired } from '@condo/domains/contact/components/PageAccess'


const CreateContactPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'contact.AddContact' })

    const router = useRouter()

    useEffect(() => {
        console.log('🟢 CreateContactPage mounted/updated', {
            pathname: router.pathname,
            asPath: router.asPath,
            route: router.route,
        })
    }, [router.pathname, router.asPath, router.route])

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[12, 40]}>
                        <Col span={24}>
                            <Typography.Title level={1}>{PageTitle}</Typography.Title>
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
