import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { ContactRoleForm } from '@condo/domains/contact/components/contactRoles/ContactRoleForm'
import { SettingsReadPermissionRequired } from '@condo/domains/settings/components/PageAccess'



const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]

const CreateContactRolePage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'ContactRoles.createRoleTitle' })

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
                            <ContactRoleForm/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateContactRolePage.requiredAccess = SettingsReadPermissionRequired

export default CreateContactRolePage
