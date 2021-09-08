import React, { useState, useCallback } from 'react'
import Head from 'next/head'
import { Button, Space, Typography, Row, Col } from 'antd'
import { RightCircleOutlined } from '@ant-design/icons'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { FeatureFlagRequired } from '@condo/domains/common/components/containers/FeatureFlag'
import Error from 'next/error'
import Editor from '@monaco-editor/react'
import {
    GROUP_LIST_XML,
    SERVICE_LIST_XML,
    CHECK_PAY_XML,
} from '@condo/domains/billing/constants/eps'
import { useMutation } from '@core/next/apollo'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { EPS_REQUEST_MUTATION } from '@condo/domains/billing/gql'
import getConfig from 'next/config'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

const {
    publicRuntimeConfig: { epsConfig },
} = getConfig()

const EpsPage = () => {
    const intl = useIntl()
    const EpsTitle = intl.formatMessage({ id:'menu.EPS' })

    const [inputValue, setInputValue] = useState('')
    const [outputValue, setOutputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const [requestEps] = useMutation(EPS_REQUEST_MUTATION)

    const onRunButtonClick = useCallback((inputValue) => {
        setIsLoading(true)
        setOutputValue('')
        const data = { dv: 1, sender: getClientSideSenderInfo(), xml: inputValue }
        return runMutation({
            mutation: requestEps,
            variables: {
                data,
            },
            onCompleted: ({ data }) => {
                setOutputValue(data.result.xml)
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
        }).catch(() => {
            setIsLoading(false)
        })
    }, [intl, requestEps])

    const setInputXml = (xml) => {
        for (const key in epsConfig) {
            xml = xml.split(`{{${key}}}`).join(epsConfig[key])
        }
        setInputValue(xml)
    }

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
                    <Row gutter={[10, 40]}>
                        <Col span={24}>
                            <Typography.Paragraph>
                                <Space size={40} style={{ width: '100%' }}>
                                    <Button type={'dashed'} onClick={() => setInputXml(GROUP_LIST_XML)}>group_list</Button>
                                    <Button type={'dashed'} onClick={() => setInputXml(SERVICE_LIST_XML)}>service_list</Button>
                                    <Button type={'dashed'} onClick={() => setInputXml(CHECK_PAY_XML)}>check_pay</Button>
                                    <Button loading={isLoading} shape={'circle'} onClick={() => onRunButtonClick(inputValue)} >
                                        {
                                            !isLoading && <RightCircleOutlined />
                                        }
                                    </Button>
                                </Space>
                            </Typography.Paragraph>
                        </Col>
                        <Col span={12}>
                            <Editor
                                height="50vh"
                                defaultValue=''
                                defaultLanguage='xml'
                                theme={'vs-dark'}
                                options={{ minimap: { enabled: false } }}
                                onChange={setInputValue}
                                value={inputValue}
                            />
                        </Col>
                        <Col span={12}>
                            <Editor
                                height="50vh"
                                defaultValue=''
                                defaultLanguage='xml'
                                theme={'vs-dark'}
                                options={{ minimap: { enabled: false } }}
                                value={outputValue}
                            />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </FeatureFlagRequired>
    )
}

EpsPage.headerAction = <TitleHeaderAction descriptor={{ id:'menu.EPS' }}/>
EpsPage.requiredAccess = OrganizationRequired

export default EpsPage
