import { Typography, Row, Col, RowProps } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PropertyForm } from '@condo/domains/property/components/PropertyForm'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'

interface IUpdatePropertyPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]

const UpdatePropertyPage: IUpdatePropertyPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.property.index.UpdatePropertyTitle' })
    const { query: { id } } = useRouter()

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={PAGE_ROW_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <PropertyForm id={id as string}/>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdatePropertyPage.requiredAccess = OrganizationRequired

export default UpdatePropertyPage

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
