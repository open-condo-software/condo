import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useOnBoardingContext } from '@condo/domains/onboarding/components/OnBoardingContext'
import { OnBoardingStepItem, OnBoardingStepType } from '@condo/domains/onboarding/components/OnBoardingStepItem'
import { useIntl } from '@core/next/intl'
import { Col, Row, Skeleton, Space, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'
import { useNoOrganizationToolTip } from '../domains/onboarding/hooks/useNoOrganizationToolTip'
import { useServiceSubscriptionWelcomePopup } from '../domains/subscription/hooks/useServiceSubscriptionWelcomePopup'

interface IOnBoardingIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const GUTTER_TITLE: [Gutter, Gutter] = [0, 40]
const GUTTER_BODY: [Gutter, Gutter] = [0, 0]

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

    const { wrapElementIntoNoOrganizationToolTip } = useNoOrganizationToolTip()

    useEffect(() => {
        refetchOnBoarding()
    }, [refetchOnBoarding])

    useEffect(() => {
        if (get(onBoarding, 'completed', false)) {
            router.push('/')
        }
    }, [onBoarding])

    const sortedOnBoardingSteps = useMemo(() => {
        return onBoardingSteps.sort((leftStep, rightStep) => {
            return leftStep.order > rightStep.order ? 1 : -1
        })
    }, [onBoardingSteps])

    return (
        <>
            <Head>
                <title>{Title}</title>
            </Head>
            <PageWrapper>
                <AuthRequired>
                    <PageContent>
                        <Row gutter={GUTTER_TITLE}>
                            <Col span={24}>
                                <Space direction={'vertical'} size={24}>
                                    <Typography.Title level={1}>{Title}</Typography.Title>
                                    <Typography.Paragraph>{SubTitle}</Typography.Paragraph>
                                </Space>
                            </Col>
                            <Col span={24}>
                                {onBoardingSteps.length > 0 && !get(onBoarding, 'completed')
                                    ? (
                                        <Row gutter={GUTTER_BODY}>
                                            {sortedOnBoardingSteps.map((step) => {
                                                const { title, description, iconView, stepAction, type, id } = step

                                                if (!type) {
                                                    return null
                                                }

                                                const content = (
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

                                                return type === OnBoardingStepType.DISABLED
                                                    ? wrapElementIntoNoOrganizationToolTip({
                                                        element: content,
                                                        placement: 'topLeft',
                                                    })
                                                    : content
                                            })
                                            }
                                        </Row>
                                    )
                                    : (
                                        <>
                                            <Skeleton active/>
                                            <Skeleton active/>
                                            <Skeleton active/>
                                            <Skeleton active/>
                                        </>
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
