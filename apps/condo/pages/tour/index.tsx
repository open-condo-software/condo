import {
    useGetLastCreatedPropertyByOrganizationIdQuery,
    useGetTourStepsQuery,
} from '@app/condo/gql'
import { SortTourStepsBy, TourStepStatusType, TourStepTypeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row, RowProps } from 'antd'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import getConfig from 'next/config'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { ArrowLeft } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { CardVideo } from '@condo/domains/common/components/CardVideo'
import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import {
    PageContent,
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import { PageComponentType } from '@condo/domains/common/types'
import { ResidentAppCard, TechnicAppCard } from '@condo/domains/onboarding/components/TourPage/AppCards'
import { TourStepCard } from '@condo/domains/onboarding/components/TourPage/TourStepCard'
import {
    FIRST_LEVEL_STEPS,
    SECOND_LEVEL_STEPS,
    STEP_TRANSITIONS,
    TODO_STEP_STATUS,
} from '@condo/domains/onboarding/constants/steps'
import { useTourContext } from '@condo/domains/onboarding/contexts/TourContext'
import { useTourPageData } from '@condo/domains/onboarding/hooks/TourPage/useTourPageData'
import { TODO_STEP_CLICK_ROUTE } from '@condo/domains/onboarding/utils/clientSchema/constants'
import { SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'


const {
    publicRuntimeConfig,
} = getConfig()

const { tourVideoUrl, guideIntroduceAppBlock, guideAboutAppBlock } = publicRuntimeConfig

const TourWrapper = styled.div`
  background-color: ${colors.gray[1]};
  padding: 40px;
  border-radius: 12px;
  height: 100%;

  .tour-steps-wrapper {
    width: 100%;

    .condo-card {
      width: 100%;
    }
  }
  
  .tour-steps-complete-block {
    display: flex;
    width: 100%;
    justify-content: end;
    flex-direction: column;
    gap: 32px;
    
    & .complete-button-wrapper {
      display: flex;
      width: 100%;
      justify-content: end;
    }
  }
`

const CardsWrapper = styled.div<{ isSmallScreen: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 500px;
  width: 100%;
  
  & .tour-app-cards-wrapper {
    display: flex;
    flex-direction: ${({ isSmallScreen }) => isSmallScreen ? 'column' : 'row'};
    gap: 8px;
    width: 100%;

    .condo-card {
      flex-grow: 1;
    }
  }
`

const MAIN_GUTTER: RowProps['gutter'] = [0, 24]
const BACK_LINK_STYLES: CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center' }
const APP_CARDS_COL_STYLES: CSSProperties = { display: 'flex', justifyContent: 'center' }

const TourPageContent = () => {
    const intl = useIntl()
    const BackMessage = intl.formatMessage({ id: 'Back' })

    const router = useRouter()
    const { locale } = useIntl()
    const { organization, isLoading } = useOrganization()
    const { persistor } = useCachePersistor()
    const organizationId = organization?.id || null
    const { activeTourStep, setActiveTourStep, updateStepIfNotCompleted, syncLoading } = useTourContext()
    const handleBackClick = useCallback(() => setActiveTourStep(null), [setActiveTourStep])

    const {
        data: tourStepsData,
        loading: stepsLoading,
        refetch: refetchSteps,
    } = useGetTourStepsQuery({
        variables: {
            where: {
                organization: { id: organizationId },
            },
            sortBy: [SortTourStepsBy.OrderAsc],
        },
        skip: !organizationId || !persistor || isLoading || syncLoading,
    })
    const tourSteps = useMemo(() => tourStepsData?.tourSteps.filter(Boolean) || [], [tourStepsData?.tourSteps])

    const {
        data: propertyData,
    } = useGetLastCreatedPropertyByOrganizationIdQuery({
        variables: {
            organizationId,
        },
        skip: !organizationId || !persistor || isLoading || syncLoading,
    })
    const lastCreatedProperty = useMemo(() => propertyData?.properties.filter(Boolean)?.[0] || null, [propertyData?.properties])

    const firstLevelSteps = useMemo(
        () => tourSteps.filter(step => FIRST_LEVEL_STEPS.includes(step.type)),
        [tourSteps])
    const secondLevelSteps = useMemo(
        () => tourSteps.filter(step => SECOND_LEVEL_STEPS.includes(step.type)),
        [tourSteps])
    const activeStepInnerSteps = useMemo(() => {
        if (!activeTourStep) return []
        const secondLevelStepsTypes = STEP_TRANSITIONS[activeTourStep]

        return tourSteps.filter(step => secondLevelStepsTypes.includes(step.type))
    }, [activeTourStep, tourSteps])
    const isAllSecondStepsCompleted = useMemo(() => secondLevelSteps.every(step => step.status === TourStepStatusType.Completed), [secondLevelSteps])
    const isInnerStepsCompleted = useMemo(() => activeStepInnerSteps && activeStepInnerSteps.every(step => step.status === TourStepStatusType.Completed), [activeStepInnerSteps])
    const isCompletedState = activeTourStep ? isInnerStepsCompleted : isAllSecondStepsCompleted

    const stepsToRender = useMemo(() => !isEmpty(activeStepInnerSteps) ? activeStepInnerSteps : firstLevelSteps, [firstLevelSteps, activeStepInnerSteps])
    const {
        title, subtitle, description, onButtonClick, buttonLabel,
    } = useTourPageData({ isAllSecondStepsCompleted, isInnerStepsCompleted })

    const handleStepCardClick = useCallback(async (step) => {
        const type = step.type
        const status = step.status

        if (FIRST_LEVEL_STEPS.includes(type)) {
            setActiveTourStep(type)
        }

        if (TODO_STEP_CLICK_ROUTE[type] && status === TODO_STEP_STATUS) {
            let newRoute = TODO_STEP_CLICK_ROUTE[type]

            if (isFunction(newRoute)) {
                newRoute = newRoute({ lastCreatedPropertyId: lastCreatedProperty?.id })
            }
            if (typeof newRoute !== 'string') return

            if (type === TourStepTypeType.ViewResidentsAppGuide && typeof window !== 'undefined') {
                window.open(newRoute, '_blank')

                await updateStepIfNotCompleted(TourStepTypeType.ViewResidentsAppGuide)
                await refetchSteps()
            } else {
                await router.push(newRoute)
            }
        }
    }, [lastCreatedProperty, refetchSteps, router, setActiveTourStep, updateStepIfNotCompleted])

    const { breakpoints } = useLayoutContext()
    const isSmallScreen = useMemo(() => !breakpoints.DESKTOP_SMALL, [breakpoints.DESKTOP_SMALL])

    const isDisabledStep = useCallback(step => {
        if (FIRST_LEVEL_STEPS.includes(step.type) || step.status === TourStepStatusType.Completed) return false
        const firstTodoStep = stepsToRender.find(step => step.status === TourStepStatusType.Todo)
        if (firstTodoStep?.id !== step.id) return true
    }, [stepsToRender])

    const activeStepWithDefault = useMemo(() => activeTourStep || 'default', [activeTourStep])
    const CardVideoTitle = intl.formatMessage({ id: `tour.cardVideo.title.${activeStepWithDefault}` as FormatjsIntl.Message['ids'] })
    const CardVideoDescription = intl.formatMessage({ id: `tour.cardVideo.description.${activeStepWithDefault}` as FormatjsIntl.Message['ids'] })

    const videoUrl = useMemo(() => tourVideoUrl?.[locale]?.[activeStepWithDefault], [activeStepWithDefault, locale])

    if (isLoading || stepsLoading || syncLoading) {
        return <Loader size='large'/>
    }

    return (
        <Row justify='space-between' gutter={MAIN_GUTTER}>
            <Col span={isSmallScreen ? 24 : 13}>
                <TourWrapper>
                    <Space size={40} direction='vertical'>
                        {!isEmpty(activeStepInnerSteps) && (
                            <Link href='/tour'>
                                <Typography.Link onClick={handleBackClick}>
                                    <div style={BACK_LINK_STYLES}>
                                        <ArrowLeft size='small'/>
                                        {BackMessage}
                                    </div>
                                </Typography.Link>
                            </Link>
                        )}
                        <Space size={8} direction='vertical'>
                            <Typography.Title level={2}>{title}</Typography.Title>
                            <Typography.Paragraph type='secondary'>{subtitle}</Typography.Paragraph>
                        </Space>
                        <Space size={4} direction='vertical' className='tour-steps-wrapper'>
                            {
                                stepsToRender.map((step) => (
                                    <TourStepCard
                                        key={step.id}
                                        step={step}
                                        steps={tourSteps}
                                        onClick={() => handleStepCardClick(step)}
                                        disabled={isDisabledStep(step)}
                                    />
                                ))
                            }
                        </Space>
                        {
                            isCompletedState && (
                                <div className='tour-steps-complete-block'>
                                    {
                                        description && (
                                            <Typography.Text type='secondary'>
                                                {description}
                                            </Typography.Text>
                                        )
                                    }
                                    {
                                        buttonLabel && onButtonClick && (
                                            <div className='complete-button-wrapper'>
                                                <Button type='primary' onClick={onButtonClick}>
                                                    {buttonLabel}
                                                </Button>
                                            </div>
                                        )
                                    }
                                </div>
                            )
                        }
                    </Space>
                </TourWrapper>
            </Col>
            {
                (guideAboutAppBlock?.[locale] || guideIntroduceAppBlock?.[locale]) && (
                    <Col span={isSmallScreen ? 24 : 10} style={APP_CARDS_COL_STYLES}>
                        <CardsWrapper isSmallScreen={isSmallScreen}>
                            {
                                videoUrl && (
                                    <CardVideo
                                        src={videoUrl}
                                        title={CardVideoTitle}
                                        description={CardVideoDescription}
                                    />
                                )
                            }
                            <div className='tour-app-cards-wrapper'>
                                <ResidentAppCard/>
                                <TechnicAppCard/>
                            </div>
                        </CardsWrapper>
                    </Col>
                )
            }
        </Row>
    )
}

const TourPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'tour.title' })

    const { organization, isLoading } = useOrganization()

    if (!isLoading && organization?.type === SERVICE_PROVIDER_TYPE) {
        return <AccessDeniedPage />
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>}/>
                <PageContent>
                    <TourPageContent/>
                </PageContent>
            </PageWrapper>
        </>
    )
}

TourPage.requiredAccess = AuthRequired

export default TourPage
