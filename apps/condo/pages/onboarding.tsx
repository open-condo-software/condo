import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useOnBoardingContext } from '@condo/domains/onboarding/components/OnBoardingContext'
import { OnBoardingStepItem } from '@condo/domains/onboarding/components/OnBoardingStepItem'
import { useIntl } from '@core/next/intl'
import { Col, Row, Skeleton, Space, Typography } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { useServiceSubscriptionWelcomePopup } from '../domains/subscription/hooks/useServiceSubscriptionWelcomePopup'

interface IOnBoardingIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const OnBoardingPage: IOnBoardingIndexPage = () => {
    const intl = useIntl()
    const router = useRouter()
    const Title = intl.formatMessage({ id: 'onboarding.title' })
    const SubTitle = intl.formatMessage({ id: 'onboarding.subtitle' })
    const { onBoardingSteps = [], onBoarding, refetchOnBoarding } = useOnBoardingContext()
    const {
        ServiceSubscriptionWelcomePopup,
        isServiceSubscriptionWelcomePopupVisible,
    } = useServiceSubscriptionWelcomePopup()

    useEffect(() => {
        refetchOnBoarding()
    }, [refetchOnBoarding])

    useEffect(() => {
        if (get(onBoarding, 'completed', false)) {
            router.push('/')
        }
    }, [onBoarding])

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
                                    <Typography.Title level={1}>{Title}</Typography.Title>
                                    <Typography.Paragraph>{SubTitle}</Typography.Paragraph>
                                </Space>
                            </Col>
                            <Col span={24}>
                                {onBoardingSteps.length > 0 && !get(onBoarding, 'completed')
                                    ? (
                                        <Row gutter={[0, 0]}>
                                            {onBoardingSteps.sort((leftStep, rightStep) => leftStep.order > rightStep.order ? 1 : -1)
                                                .map((step) => {
                                                    const { title, description, iconView, stepAction, type, id } = step

                                                    if (!type) {
                                                        return null
                                                    }

                                                    return (
                                                        <Col lg={16} md={24} key={id}>
                                                            <OnBoardingStepItem
                                                                action={stepAction}
                                                                icon={iconView}
                                                                type={type}
                                                                title={title}
                                                                description={description}
                                                            />
                                                        </Col>
                                                    )
                                                })}
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
            {
                isServiceSubscriptionWelcomePopupVisible && (
                    <ServiceSubscriptionWelcomePopup/>
                )
            }
        </>
    )
}

export default OnBoardingPage
