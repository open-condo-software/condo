/** @jsx jsx */
import { jsx } from '@emotion/react'
import { Row, Col, RowProps } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tour } from '@open-condo/ui'

import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { CustomScrollbarCss } from '@condo/domains/property/components/panels/Builder/BuildingPanelCommon'
import CreatePropertyMapForm from '@condo/domains/property/components/PropertyMapForm/CreatePropertyMapForm'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'

const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]

const CreatePropertyMapPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.EditPropertyMapTitle' })
    const { query: { id } } = useRouter()

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={PAGE_ROW_GUTTER} css={CustomScrollbarCss}>
                        <Col span={24}>
                            <Tour.Provider>
                                <CreatePropertyMapForm id={id as string} />
                            </Tour.Provider>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreatePropertyMapPage.requiredAccess = OrganizationRequired

export default CreatePropertyMapPage

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
