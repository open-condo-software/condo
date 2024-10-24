import { Typography, Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { CSSProperties } from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'


import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState } from '@condo/domains/common/utils/next/ssr'
import { ContactRoleForm } from '@condo/domains/contact/components/contactRoles/ContactRoleForm'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'

import type { GetServerSideProps } from 'next'


const TITLE_STYLES: CSSProperties = { margin: 0 }
const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]

const UpdateContactRolePage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'ContactRoles.editing' })
    const { query } = useRouter()

    if (Array.isArray(query.id)) {
        return null
    }

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={BIG_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1} style={TITLE_STYLES}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <ContactRoleForm id={query.id as string}/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdateContactRolePage.requiredAccess = SettingsReadPermissionRequired

export default UpdateContactRolePage

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
}
