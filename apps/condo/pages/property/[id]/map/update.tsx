/** @jsx jsx */
import { jsx } from '@emotion/react'
import { Row, Col, RowProps } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tour } from '@open-condo/ui'

import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { CustomScrollbarCss } from '@condo/domains/property/components/panels/Builder/BuildingPanelCommon'
import CreatePropertyMapForm from '@condo/domains/property/components/PropertyMapForm/CreatePropertyMapForm'

const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]

const CreatePropertyMapPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.EditPropertyMapTitle' })
    const { query: { id, next } } = useRouter()

    const isValidNextUrl = next && !Array.isArray(next) && isSafeUrl(next)

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
                                <CreatePropertyMapForm id={id as string} next={isValidNextUrl ? next : undefined} />
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
