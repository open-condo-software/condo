import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { Form, Button } from 'antd'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Typography } from 'antd'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'
import Error from 'next/error'

import Editor, { useMonaco } from '@monaco-editor/react'



const CodePage = (props) => {
    const monaco = useMonaco()

    useEffect(() => {
        if (monaco) {
            console.log('here is the monaco isntance:', monaco)
        }
    }, [monaco])
    return (
        <Editor
            height="50vh"
            defaultValue='<a></a>'
            defaultLanguage='xml'
            theme={'vs-dark'}
        />
    )
}

const BillingPage = () => {
    const intl = useIntl()
    const EpsTitle = intl.formatMessage({ id:'menu.EPS' })

    return (
        <FeatureFlagRequired name={'eps'} fallback={<Error statusCode={404}/>}>
            <Head>
                <title>
                    {EpsTitle}
                </title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{EpsTitle}</Typography.Title>}/>
                <PageContent>
                    <CodePage />
                    <CodePage />
                </PageContent>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}

BillingPage.headerAction = <TitleHeaderAction descriptor={{ id:'menu.Billing' }}/>
BillingPage.requiredAccess = OrganizationRequired

export default BillingPage
