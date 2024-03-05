import { SortTourStepsBy, TourStep as TourStepType, TourStepTypeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import { get } from 'lodash'
import isEmpty from 'lodash/isEmpty'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { ArrowLeft, PlusCircle, Building, ExternalLink } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Card, CardButtonProps, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import {
    PageContent,
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import {
    STEP_TRANSITIONS,
    FIRST_LEVEL_STEPS,
    SECOND_LEVEL_STEPS,
    CREATE_PROPERTY_STEP_TYPE,
    CREATE_PROPERTY_MAP_STEP_TYPE,
    CREATE_TICKET_STEP_TYPE,
    UPLOAD_RECEIPTS_STEP_TYPE,
    CREATE_METER_READINGS_STEP_TYPE,
    VIEW_RESIDENT_APP_GUIDE_STEP_TYPE,
    CREATE_NEWS_STEP_TYPE,
    TODO_STEP_STATUS,
} from '@condo/domains/onboarding/constants/steps'
import { useTourContext } from '@condo/domains/onboarding/contexts/TourContext'
import { useSyncSteps } from '@condo/domains/onboarding/hooks/useSyncSteps'
import { TourStep } from '@condo/domains/onboarding/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'


const APP_IMAGE_STYLES: CSSProperties = { width: 'inherit', maxWidth: '120px', paddingTop: '6px' }

const TODO_STEP_ROUTE = {
    [CREATE_PROPERTY_STEP_TYPE]: '/property',
    [CREATE_PROPERTY_MAP_STEP_TYPE]: '/property',
    [CREATE_TICKET_STEP_TYPE]: '/ticket',
    [UPLOAD_RECEIPTS_STEP_TYPE]: '/billing',
    [CREATE_METER_READINGS_STEP_TYPE]: '/meter',
    [VIEW_RESIDENT_APP_GUIDE_STEP_TYPE]: 'https://drive.google.com/file/d/1mV4A_d8Wzzl-REe73OdoeHEngmnJi9NE/view',
    [CREATE_NEWS_STEP_TYPE]: '/news',
}

const COMPLETED_STEP_DATA = {
    [CREATE_PROPERTY_STEP_TYPE]: {
        title: 'Вы добавили дом',
        link: {
            LinkWrapper: Link,
            label: 'Добавить еще',
            href: '/property/create',
            AfterIcon: PlusCircle,
        },
    },
    [CREATE_PROPERTY_MAP_STEP_TYPE]: {
        title: 'Вы добавили шахматку',
        link: {
            LinkWrapper: Link,
            label: 'Открыть список',
            href: '/property',
            AfterIcon: Building,
        },
    },
    [CREATE_TICKET_STEP_TYPE]: {
        title: 'Вы создали заявку',
        link: {
            LinkWrapper: Link,
            label: 'Добавить еще',
            href: '/ticket/create',
            AfterIcon: PlusCircle,
        },
    },
    [VIEW_RESIDENT_APP_GUIDE_STEP_TYPE]: {
        title: 'Вы посмотрели гайд для управляющих организаций',
        link: {
            label: 'Смотреть снова',
            href: 'https://drive.google.com/file/d/1mV4A_d8Wzzl-REe73OdoeHEngmnJi9NE/view',
            AfterIcon: ExternalLink,
            openInNewTab: true,
        },
    },
    [CREATE_NEWS_STEP_TYPE]: {
        title: 'Вы опубликовали новость',
        link: {
            LinkWrapper: Link,
            label: 'Добавить еще',
            href: '/ticket/create',
            AfterIcon: PlusCircle,
        },
    },
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
    const completedStepLink = useMemo(() =>
        SECOND_LEVEL_STEPS.includes(stepType) && stepStatus === 'completed' && get(COMPLETED_STEP_DATA, [stepType, 'link'])
    , [stepStatus, stepType])
    const completedStepTitle = useMemo(() =>
        SECOND_LEVEL_STEPS.includes(stepType) && stepStatus === 'completed' &&  get(COMPLETED_STEP_DATA, [stepType, 'title'])
    , [stepStatus, stepType])

    return (
        <Card.CardButton
            header={{
                progressIndicator: { disabled: isDisabledStatus, steps: innerSteps },
                headingTitle: completedStepTitle || CardTitle,
                mainLink: completedStepLink,
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
    const BackMessage = intl.formatMessage({ id: 'Back' })

    const router = useRouter()
    const { organization, isLoading } = useOrganization()
    const organizationId = get(organization, 'id')
    const { activeTourStep, setActiveTourStep, updateStepIfNotCompleted } = useTourContext()
    const handleBackClick = useCallback(() => setActiveTourStep(null), [setActiveTourStep])

    const { objs: tourSteps, loading: stepsLoading, refetch: refetchSteps } = TourStep.useObjects({
        where: {
            organization: { id: organizationId },
        },
        sortBy: [SortTourStepsBy.OrderAsc],
    }, { skip: isLoading || !organizationId })

    const firstLevelSteps = useMemo(
        () => tourSteps.filter(step => FIRST_LEVEL_STEPS.includes(step.type)),
        [tourSteps])

    const secondLevelSteps = useMemo(
        () => tourSteps.filter(step => SECOND_LEVEL_STEPS.includes(step.type)),
        [tourSteps])

    const activeStepInnerSteps = useMemo(() => {
        if (!get(activeTourStep, 'firstLevel')) return []
        const secondLevelStepsTypes = STEP_TRANSITIONS[get(activeTourStep, 'firstLevel')]

        return tourSteps.filter(step => secondLevelStepsTypes.includes(step.type))
    }, [activeTourStep, tourSteps])

    const stepsToRender = useMemo(
        () => !isEmpty(activeStepInnerSteps) ? activeStepInnerSteps : firstLevelSteps,
        [firstLevelSteps, activeStepInnerSteps])

    const syncLoading = useSyncSteps({ refetchSteps, organizationId })

    const handleStepCardClick = useCallback(async (step) => {
        const type = step.type
        const status = step.status

        setActiveTourStep(type)

        if (TODO_STEP_ROUTE[type] && status === TODO_STEP_STATUS) {
            if (type === TourStepTypeType.ViewResidentsAppGuide) {
                window.open(TODO_STEP_ROUTE[type], '_blank')
                await updateStepIfNotCompleted(TourStepTypeType.ViewResidentsAppGuide)
                await refetchSteps()
            } else {
                await router.push(TODO_STEP_ROUTE[type])
            }
        }
    }, [refetchSteps, router, setActiveTourStep, updateStepIfNotCompleted])

    const isAllSecondStepsCompleted = useMemo(() => secondLevelSteps.every(step => step.status === 'completed'), [secondLevelSteps])
    const isInnerStepsCompleted = useMemo(() => activeStepInnerSteps &&
        activeStepInnerSteps.every(step => step.status === 'completed'
        ), [activeStepInnerSteps])
    const isCompletedState = isAllSecondStepsCompleted || isInnerStepsCompleted

    const pageData = useMemo(() => ({
        default: {
            todo: {
                title: TourSubtitle,
                subtitle: TourDescription,
            },
            completed: {
                title: 'Вы настроили Дома́ — поздравляем!',
                subtitle: 'Платформа готова для работы над задачами вашего бизнеса',
                button: {
                    label: 'Открыть гайд',
                    onClick: () => {
                        window.open('https://drive.google.com/file/d/1mV4A_d8Wzzl-REe73OdoeHEngmnJi9NE/view', '_blank')
                    },
                },
                description: 'Рекомендуем время от времени открывать гайд и напоминать жителям о функциях мобильного приложения с помощью готовых шаблонов. Чем больше жителей скачают его и начнут пользоваться, тем больше процессов получится автоматизировать.',
            },
        },
        ticket: {
            todo: {
                title: 'Оптимизировать работу с заявками',
                subtitle: 'Когда выполните все задачи из списка, жители смогут отправлять заявки через мобильное приложение, а вы увидите их на платформе.',
            },
            completed: {
                title: 'Вы оптимизировали работу с заявками',
                subtitle: 'Теперь жители могут отправлять заявки через мобильное приложение, а вы увидите их на платформе',
                button: {
                    label: 'Выбрать другую задачу',
                    onClick: handleBackClick,
                },
            },
        },
        billing: {
            todo: {
                title: 'Снизить дебиторскую задолженность',
                subtitle: 'По статистике, 83% пользователей платформы Doma.ai снизили дебиторскую задолженность на 50% и более',
            },
            completed: {
                title: 'Вы поработали над снижением дебеторской задолжности',
                subtitle: 'Теперь жители могут оплачивать квитанции, а вы — следить за поступлениями',
                button: {
                    label: 'Выбрать другую задачу',
                    onClick: handleBackClick,
                },
            },
        },
        meter: {
            todo: {
                title: 'Упростить работу с показаниями счетчиков',
                subtitle: 'Когда выполните все задачи из списка, жители смогут отправлять показания через мобильное приложение, а вы увидите их на платформе',
            },
            completed: {
                title: 'Вы упростили работу с показаниями счетчиков',
                subtitle: 'Теперь жители могут передавать показания счетчиков, а вы — получать их на платформе',
                button: {
                    label: 'Выбрать другую задачу',
                    onClick: handleBackClick,
                },
            },
        },
        resident: {
            todo: {
                title: 'Выстроить отношения с жителями',
                subtitle: 'Когда выполните все задачи из списка, жители смогут отправлять показания и заявки через мобильное приложение. Вы увидите их на платформе и получите возможность сообщать жителям важные новости.',
            },
            completed: {
                title: 'Вы выстроили отношения с жителями',
                subtitle: 'Хз, ничего не поменялось. Новости теперь жители видеть могут',
                button: {
                    label: 'Выбрать другую задачу',
                    onClick: handleBackClick,
                },
            },
        },
    }), [TourDescription, TourSubtitle, handleBackClick])

    const firstLevelPath = get(activeTourStep, 'firstLevel') || 'default'
    const secondLevelPath = useMemo(() => {
        if (firstLevelPath === 'default') {
            return isAllSecondStepsCompleted ? 'completed' : 'todo'
        }

        return isInnerStepsCompleted ? 'completed' : 'todo'
    }, [firstLevelPath, isAllSecondStepsCompleted, isInnerStepsCompleted])
    const pathToData = [firstLevelPath, secondLevelPath]

    const title = get(pageData, [...pathToData, 'title'])
    const subtitle = get(pageData, [...pathToData, 'subtitle'])
    const buttonLabel = get(pageData, [...pathToData, 'button', 'label'])
    const onButtonClick = get(pageData, [...pathToData, 'button', 'onClick'])
    const description = get(pageData, [...pathToData, 'description'])

    const { breakpoints } = useLayoutContext()
    const isMiddleScreen = useMemo(() => !breakpoints.DESKTOP_SMALL, [breakpoints.DESKTOP_SMALL])

    if (isLoading || stepsLoading || syncLoading) {
        return <Loader size='large'/>
    }

    return (
        <Row justify='space-between' gutter={[0, 24]}>
            <Col span={isMiddleScreen ? 24 : 13}>
                <TourWrapper>
                    <Space size={32} direction='vertical'>
                        {!isEmpty(activeStepInnerSteps) && (
                            <Link href='/tour'>
                                <Typography.Link onClick={handleBackClick}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            <Col span={isMiddleScreen ? 24 : 10} style={{ display: 'flex', justifyContent: 'center' }}>
                <CardsWrapper isSmallScreen={isMiddleScreen}>
                    <CardVideo/>
                    <div className='tour-app-cards-wrapper'>
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
                    </div>
                </CardsWrapper>
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