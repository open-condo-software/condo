import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { Col, Row, Skeleton, Space, Typography } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import get from 'lodash/get'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OnBoardingStepItem } from '@condo/domains/onboarding/components/OnBoardingStepItem'
import { useIntl } from '@core/next/intl'
import { useOnBoardingContext } from '@condo/domains/onboarding/components/OnBoardingContext'
import { useSubscriberFirstLoginModal } from '../domains/subscription/hooks/useSubscriberFirstLoginModal'
import { ServiceSubscription } from '../domains/subscription/utils/clientSchema'
import { ServiceSubscriptionTypeType } from '../schema'
import { useOrganization } from '@core/next/organization'
import dayjs from 'dayjs'

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
        SubscriberFirstLoginModal,
        isSubscriberFirstLoginModalVisible,
        setIsSubscriberFirstLoginModalVisible,
    } = useSubscriberFirstLoginModal()

    const { organization } = useOrganization()

    const today = dayjs().startOf('day').toISOString()

    const { objs: subscriptions, loading: subscriptionsLoading } = ServiceSubscription.useObjects({
        where: {
            organization: { id: organization && organization.id },
            type: ServiceSubscriptionTypeType.Sbbol,
            isTrial: true,
            finishAt_gte: today,
        },
    })

    useEffect(() => {
        if (subscriptions.length > 0 && !subscriptionsLoading && !isSubscriberFirstLoginModalVisible)
            setIsSubscriberFirstLoginModalVisible(true)
    }, [subscriptionsLoading])

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
                isSubscriberFirstLoginModalVisible && (
                    <SubscriberFirstLoginModal
                        subscription={subscriptions ? subscriptions[0] : null}
                    />
                )
            }
        </>
    )
}

export default OnBoardingPage
