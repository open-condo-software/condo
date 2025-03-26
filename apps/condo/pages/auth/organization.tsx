import { Col, Row } from 'antd'
import Head from 'next/head'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageComponentType } from '@condo/domains/common/types'
import { CreateOrganizationPageContent } from '@condo/domains/organization/components/CreateOrganizationPageContent'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'


const ORGANIZATION_FORM_WRAPPER_STYLES: CSSProperties = { maxWidth: '350px' }

const SignInPage: PageComponentType = () => {
    const intl = useIntl()
    const CreateOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })

    return (
        <>
            <Head><title>{CreateOrganizationTitle}</title></Head>
            <Row>
                <Col style={ORGANIZATION_FORM_WRAPPER_STYLES}>
                    <CreateOrganizationPageContent />
                </Col>
            </Row>
        </>
    )
}
SignInPage.container = AuthLayout
SignInPage.headerAction = <WelcomeHeaderTitle userType='staff'/>

export default SignInPage