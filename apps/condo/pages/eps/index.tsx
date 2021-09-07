import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { Form, Button, Space, Typography } from 'antd'
import { RightCircleOutlined } from '@ant-design/icons'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'
import Error from 'next/error'
import Editor, { useMonaco } from '@monaco-editor/react'
import {
    GROUP_LIST_XML,
    SERVICE_LIST,
    CHECK_PAY,
} from '@condo/domains/billing/constants/eps'



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
            defaultValue=''
            defaultLanguage='xml'
            theme={'vs-dark'}
        />
    )
}

const EpsPage = () => {
    const intl = useIntl()
    const EpsTitle = intl.formatMessage({ id:'menu.EPS' })

    const monacoInput = useMonaco()


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
                    <Space size={40} direction={'vertical'} style={{ width: '100%' }}>
                        <Typography.Paragraph>
                            <Space size={40} style={{ width: '100%' }}>
                                <Button type="dashed">group_list</Button>
                                <Button type="dashed">service_list</Button>
                                <Button type="dashed">check_pay</Button>
                                <Button type="dashed">order_pay</Button>
                                <Button type="primary"><RightCircleOutlined /></Button>
                            </Space>
                        </Typography.Paragraph>
                        <Editor
                            height="50vh"
                            defaultValue=''
                            defaultLanguage='xml'
                            theme={'vs-dark'}
                        />
                    </Space>
                </PageContent>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}

EpsPage.headerAction = <TitleHeaderAction descriptor={{ id:'menu.EPS' }}/>
EpsPage.requiredAccess = OrganizationRequired

export default EpsPage
