import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { Col, Row, Skeleton, Space, Typography } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import get from 'lodash/get'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OnBoardingStepItem } from '@condo/domains/onboarding/components/OnBoardingStepItem'
import { useIntl } from '@core/next/intl'
import { useOnBoardingContext } from '../domains/onboarding/components/OnBoardingContext'
import { IPageInterface } from '../next-env'

const OnBoardingPage: IPageInterface = () => {
    const intl = useIntl()
    const router = useRouter()
    const Title = intl.formatMessage({ id: 'onboarding.title' })
    const SubTitle = intl.formatMessage({ id: 'onboarding.subtitle' })
    const { onBoardingSteps, onBoarding } = useOnBoardingContext()

    useEffect(() => {
        if (get(onBoarding, 'completed', false)) {
            router.push('/')
        }
    }, [onBoarding])

    const steps = [...onBoardingSteps]
        .sort((leftStep, rightStep) => leftStep.order > rightStep.order ? 1 : -1)
        .map((step) => {
            const { title, description, iconView, stepAction, type } = step

            return (
                <OnBoardingStepItem
                    action={stepAction}
                    icon={iconView}
                    type={type}
                    key={title}
                    title={title}
                    description={description}
                />
            )
        })

    return (
        <>
            <Head>
                <title>{Title}</title>
            </Head>
            <PageWrapper>
                <AuthRequired>
                    <PageContent>
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Space direction={'vertical'} size={24}>
                                    <Typography.Title level={1} style={{ margin: 0 }}>С чего начать?</Typography.Title>
                                    <Typography.Paragraph>{SubTitle}</Typography.Paragraph>
                                </Space>
                            </Col>
                            <Col span={24}>
                                {onBoardingSteps.length > 0
                                    ? (
                                        <Row gutter={[0, 0]}>
                                            {true}
                                            {steps}
                                        </Row>
                                    )
                                    : (
                                        <React.Fragment>
                                            <Skeleton active/>
                                            <Skeleton active/>
                                            <Skeleton active/>
                                            <Skeleton active/>
                                        </React.Fragment>
                                    )
                                }
                            </Col>
                        </Row>
                    </PageContent>
                </AuthRequired>
            </PageWrapper>
        </>
    )
}

export default OnBoardingPage
