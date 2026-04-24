import { Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { PropertyScopeForm } from '@condo/domains/scope/components/PropertyScopeForm'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'


const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]

const UpdatePropertyScopePage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.editPropertyScope' })

    const { query } = useRouter()

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={BIG_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <PropertyScopeForm id={query.id as string}/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdatePropertyScopePage.requiredAccess = SettingsReadPermissionRequired

export default UpdatePropertyScopePage
