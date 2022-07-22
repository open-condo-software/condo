import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useOnBoardingContext } from '@condo/domains/onboarding/components/OnBoardingContext'
import { OnBoardingStepItem, OnBoardingStepType } from '@condo/domains/onboarding/components/OnBoardingStepItem'
import { useNoOrganizationToolTip } from '@condo/domains/onboarding/hooks/useNoOrganizationToolTip'
import {
    useServiceSubscriptionWelcomePopup,
} from '@condo/domains/subscription/hooks/useServiceSubscriptionWelcomePopup'
import { useIntl } from '@core/next/intl'
import { Col, Row, Skeleton, Space, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import some from 'lodash/some'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'
import { WelcomePopup } from '@condo/domains/onboarding/components/WelcomePopup'
import { useOrganization } from '@core/next/organization'
import { SBBOL_IMPORT_NAME } from '@condo/domains/organization/integrations/sbbol/common'

interface IOnBoardingIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const GUTTER_TITLE: [Gutter, Gutter] = [0, 40]
const GUTTER_BODY: [Gutter, Gutter] = [0, 0]

const OnBoardingPage: IOnBoardingIndexPage = () => {
    const intl = useIntl()
    const Title = intl.formatMessage({ id: 'onboarding.title' })
    const SubTitle = intl.formatMessage({ id: 'onboarding.subtitle' })

    const router = useRouter()
    const { onBoardingSteps = [], onBoarding, refetchOnBoarding, isLoading } = useOnBoardingContext()
    const { wrapElementIntoNoOrganizationToolTip } = useNoOrganizationToolTip()
    const { organization } = useOrganization()
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

    const sortedOnBoardingSteps = useMemo(() => {
        return onBoardingSteps.sort((leftStep, rightStep) => {
            return leftStep.order > rightStep.order ? 1 : -1
        })
    }, [onBoardingSteps])

    const organizationImportRemoteSystem = get(organization, 'importRemoteSystem')
    const [createOrganizationStep, ...otherSteps] = sortedOnBoardingSteps

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
            {
                !isLoading && organizationImportRemoteSystem === SBBOL_IMPORT_NAME && !some(otherSteps, 'completed') && (
                    <WelcomePopup />
                )
            }
        </>
    )
}

export default OnBoardingPage
