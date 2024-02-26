import { SortTourStepsBy, TourStep as TourStepType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import { get } from 'lodash'
import isEmpty from 'lodash/isEmpty'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { ArrowLeft, PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, CardButtonProps, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import {
    STEP_TRANSITIONS,
    FIRST_LEVEL_STEPS,
    SECOND_LEVEL_STEPS,
    CREATE_PROPERTY_STEP_TYPE,
    CREATE_PROPERTY_MAP_STEP_TYPE,
    CREATE_TICKET_STEP_TYPE,
    NOTIFY_RESIDENTS_ABOUT_TICKETS_STEP_TYPE,
    UPLOAD_RECEIPTS_STEP_TYPE,
    NOTIFY_RESIDENTS_ABOUT_PAYMENTS_STEP_TYPE,
    CREATE_METER_READINGS_STEP_TYPE,
    NOTIFY_RESIDENTS_ABOUT_METER_READINGS_STEP_TYPE,
    VIEW_RESIDENT_APP_GUIDE_STEP_TYPE,
    CREATE_NEWS_STEP_TYPE,
    TODO_STEP_STATUS,
} from '@condo/domains/onboarding/constants/steps'
import { useTourContext } from '@condo/domains/onboarding/contexts/TourContext'
import { TourStep } from '@condo/domains/onboarding/utils/clientSchema'


const APP_IMAGE_STYLES: CSSProperties = { width: '120px', paddingTop: '6px' }

const TODO_STEP_ROUTE = {
    [CREATE_PROPERTY_STEP_TYPE]: '/property',
    [CREATE_PROPERTY_MAP_STEP_TYPE]: '/property',
    [CREATE_TICKET_STEP_TYPE]: '/ticket',
    [NOTIFY_RESIDENTS_ABOUT_TICKETS_STEP_TYPE]: '/tour/guide', //TODO(DOMA-8500): update url after guide page will completed
    [UPLOAD_RECEIPTS_STEP_TYPE]: '/billing',
    [NOTIFY_RESIDENTS_ABOUT_PAYMENTS_STEP_TYPE]: '/tour/guide',
    [CREATE_METER_READINGS_STEP_TYPE]: '/meter',
    [NOTIFY_RESIDENTS_ABOUT_METER_READINGS_STEP_TYPE]: '/tour/guide',
    [VIEW_RESIDENT_APP_GUIDE_STEP_TYPE]: '/tour/guide',
    [CREATE_NEWS_STEP_TYPE]: '/news',
}

const COMPLETED_STEP_LINK: Record<typeof SECOND_LEVEL_STEPS[number], CardButtonProps['header']['mainLink']> = {
    [CREATE_PROPERTY_STEP_TYPE]: {
        LinkWrapper: Link,
        label: 'Добавить еще',
        href: '/property/create',
        AfterIcon: PlusCircle,
    },
    // [CREATE_PROPERTY_MAP_STEP_TYPE]: '/property',
    // [CREATE_TICKET_STEP_TYPE]: '/ticket',
    // [NOTIFY_RESIDENTS_ABOUT_TICKETS_STEP_TYPE]: '/tour/guide',
    // [UPLOAD_RECEIPTS_STEP_TYPE]: '/billing',
    // [NOTIFY_RESIDENTS_ABOUT_PAYMENTS_STEP_TYPE]: '/tour/guide',
    // [CREATE_METER_READINGS_STEP_TYPE]: '/meter',
    // [NOTIFY_RESIDENTS_ABOUT_METER_READINGS_STEP_TYPE]: '/tour/guide',
    // [VIEW_RESIDENT_APP_GUIDE_STEP_TYPE]: '/tour/guide',
    // [CREATE_NEWS_STEP_TYPE]: '/news',
}

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
`

const AppCardsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;

  .condo-card {
    flex-grow: 1;
  }
`

const CardVideo = () => {
    const intl = useIntl()
    const CardVideoTitle = intl.formatMessage({ id: 'tour.cardVideo.title' })
    const CardVideoDescription = intl.formatMessage({ id: 'tour.cardVideo.description' })

    return (
        <Card hoverable>
            <Space size={24} direction='vertical'>
                <div style={{ borderRadius: '12px', overflow: 'hidden', height: '254px', width: '100%' }}>
                    <iframe width='100%' height='100%'
                        src='https://www.youtube.com/embed/xNRJwmlRBNU?si=iryPQNp7dhipnWC-'
                        title='YouTube video player' frameBorder='0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                        allowFullScreen>
                    </iframe>
                </div>
                <Space size={8} direction='vertical'>
                    <Typography.Title level={2}>{CardVideoTitle}</Typography.Title>
                    <Typography.Paragraph type='secondary'>{CardVideoDescription}</Typography.Paragraph>
                </Space>
            </Space>
        </Card>
    )
}

const BackLink = () => {
    const intl = useIntl()
    const BackMessage = intl.formatMessage({ id: 'Back' })

    const { setActiveTourStep } = useTourContext()
    const handleLinkClick = useCallback(() => setActiveTourStep(null), [setActiveTourStep])

    return (
        <Link href='/tour'>
            <Typography.Link onClick={handleLinkClick}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <ArrowLeft size='small'/>
                    {BackMessage}
                </div>
            </Typography.Link>
        </Link>
    )
}

type TourStepCardProps = {
    step: TourStepType
    steps: TourStepType[]
    onClick: () => void
}

const TourStepCard: React.FC<TourStepCardProps> = (props) => {
    const { step, steps, onClick } = props
    const stepType = useMemo(() => step.type, [step.type])
    const stepStatus = useMemo(() => step.status, [step.status])

    const intl = useIntl()
    const CardTitle = intl.formatMessage({ id: `tour.step.${stepType}.todo.title` })

    const innerStepsTypes = useMemo(() => STEP_TRANSITIONS[stepType] || [], [stepType])
    const innerStepsStatuses = useMemo(() => innerStepsTypes
        .map(type => steps.find(otherStep => otherStep.type === type))
        .filter(Boolean)
        .map(step => step.status)
    , [innerStepsTypes, steps])
    const innerSteps = useMemo(() => isEmpty(innerStepsStatuses) ? [stepStatus] : innerStepsStatuses,
        [innerStepsStatuses, stepStatus])
    const isDisabledStatus = useMemo(() => stepStatus === 'disabled', [stepStatus])
    const isInnerTodoStep = useMemo(() =>
        SECOND_LEVEL_STEPS.includes(stepType) && stepStatus === 'todo',
    [stepStatus, stepType])
    const bodyDescription = useMemo(() =>
        SECOND_LEVEL_STEPS.includes(stepType) &&
            (stepStatus === 'todo' || stepStatus === 'waiting') &&
            intl.formatMessage({ id: `tour.step.${stepType}.${stepStatus}.description` })
    , [intl, stepStatus, stepType])
    const headerLink = useMemo(() =>
        SECOND_LEVEL_STEPS.includes(stepType) &&
            stepStatus === 'completed' &&
            COMPLETED_STEP_LINK[stepType]
    , [stepStatus, stepType])

    return (
        <Card.CardButton
            header={{
                progressIndicator: { disabled: isDisabledStatus, steps: innerSteps },
                headingTitle: CardTitle,
                mainLink: headerLink,
            }}
            body={bodyDescription && {
                description: bodyDescription,
            }}
            onClick={onClick}
            disabled={isDisabledStatus}
            accent={isInnerTodoStep}
        />
    )
}

const TourPageContent = () => {
    const intl = useIntl()
    const TourSubtitle = intl.formatMessage({ id: 'tour.subtitle' })
    const TourDescription = intl.formatMessage({ id: 'tour.description' })
    const ResidentAppCardTitle = intl.formatMessage({ id: 'tour.residentAppCard.title' })
    const TechnicAppCardTitle = intl.formatMessage({ id: 'tour.technicAppCard.title' })

    const router = useRouter()
    const { organization, isLoading } = useOrganization()
    const { activeTourStep, setActiveTourStep } = useTourContext()

    const { objs: tourSteps, loading: stepsLoading } = TourStep.useObjects({
        where: {
            organization: { id: get(organization, 'id') },
        },
        sortBy: [SortTourStepsBy.OrderAsc],
    }, { skip: isLoading || !organization })

    const firstLevelSteps = useMemo(
        () => tourSteps.filter(step => FIRST_LEVEL_STEPS.includes(step.type)),
        [tourSteps])
    const secondLevelSteps = useMemo(() => {
        if (!get(activeTourStep, 'firstLevel')) return []
        const secondLevelStepsTypes = STEP_TRANSITIONS[get(activeTourStep, 'firstLevel')]

        return tourSteps.filter(step => secondLevelStepsTypes.includes(step.type))
    }, [activeTourStep, tourSteps])
    const stepsToRender = useMemo(
        () => !isEmpty(secondLevelSteps) ? secondLevelSteps : firstLevelSteps,
        [firstLevelSteps, secondLevelSteps])

    const handleStepCardClick = useCallback(async (step) => {
        const type = step.type
        const status = step.status

        setActiveTourStep(type)

        if (TODO_STEP_ROUTE[type] && status === TODO_STEP_STATUS) {
            await router.push(TODO_STEP_ROUTE[type])
        }
    }, [router, setActiveTourStep])

    if (isLoading || stepsLoading) {
        return <Loader size='large'/>
    }

    return (
        <Row justify='space-between'>
            <Col span={13}>
                <TourWrapper>
                    <Space size={32} direction='vertical'>
                        {!isEmpty(secondLevelSteps) && <BackLink/>}
                        <Space size={8} direction='vertical'>
                            <Typography.Title level={2}>{TourSubtitle}</Typography.Title>
                            <Typography.Paragraph type='secondary'>{TourDescription}</Typography.Paragraph>
                        </Space>
                        <Space size={4} direction='vertical' className='tour-steps-wrapper'>
                            {
                                stepsToRender.map((step) => (
                                    <TourStepCard
                                        key={step.id}
                                        step={step}
                                        steps={tourSteps}
                                        onClick={() => handleStepCardClick(step)}
                                    />
                                ))
                            }
                        </Space>
                    </Space>
                </TourWrapper>
            </Col>
            <Col span={10}>
                <Space size={24} direction='vertical'>
                    <CardVideo/>
                    <AppCardsWrapper>
                        <Card.CardButton
                            header={{
                                emoji: [{ symbol: '👩' }, { symbol: '👨' }],
                                headingTitle: ResidentAppCardTitle,
                            }}
                            body={{ image: { src: '/onboarding/tourResidentCard.webp', style: APP_IMAGE_STYLES } }}
                        />
                        <Card.CardButton
                            header={{
                                emoji: [{ symbol: '🧑‍🔧' }, { symbol: '🔧' }],
                                headingTitle: TechnicAppCardTitle,
                            }}
                            body={{ image: { src: '/onboarding/tourTechnicCard.webp', style: APP_IMAGE_STYLES } }}
                        />
                    </AppCardsWrapper>
                </Space>
            </Col>
        </Row>
    )
}

const TourPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'tour.title' })

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

export default TourPage