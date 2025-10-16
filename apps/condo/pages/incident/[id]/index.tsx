import {
    GetFullIncidentPropertiesByIncidentIdQuery,
    GetIncidentByIdQuery,
    GetIncidentChangesByIncidentIdQuery,
    GetIncidentClassifierIncidentByIncidentIdQuery,
    useGetFullIncidentPropertiesByIncidentIdQuery,
    useGetIncidentByIdQuery,
    useGetIncidentChangesByIncidentIdQuery,
    useGetIncidentClassifierIncidentByIncidentIdQuery,
} from '@app/condo/gql'
import { IncidentStatusType, IncidentWorkTypeType } from '@app/condo/schema'
import { Col, notification, Row, RowProps } from 'antd'
import dayjs from 'dayjs'
import uniq from 'lodash/uniq'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Tag, Typography } from '@open-condo/ui'

import { FLOW_TYPES } from '@condo/domains/ai/constants'
import { useAIConfig, useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { ChangeHistory } from '@condo/domains/common/components/ChangeHistory'
import { HistoricalChange } from '@condo/domains/common/components/ChangeHistory/HistoricalChange'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { PageComponentType } from '@condo/domains/common/types'
import { getTimeLeftMessage, getTimeLeftMessageType } from '@condo/domains/common/utils/date.utils'
import { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { AnalyticalNewsSources } from '@condo/domains/news/constants/sources'
import { IncidentReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import {
    INCIDENT_STATUS_COLORS,
    INCIDENT_WORK_TYPE_EMERGENCY,
    INCIDENT_WORK_TYPE_SCHEDULED,
} from '@condo/domains/ticket/constants/incident'
import { useIncidentChangedFieldMessagesOf } from '@condo/domains/ticket/hooks/useIncidentChangedFieldMessagesOf'
import {
    useIncidentUpdateStatusModal,
    UseIncidentUpdateStatusModalType,
} from '@condo/domains/ticket/hooks/useIncidentUpdateStatusModal'
import { getAddressRender } from '@condo/domains/ticket/utils/clientSchema/Renders'
import { UserNameField } from '@condo/domains/user/components/UserNameField'


type IncidentContentProps = {
    incident: GetIncidentByIdQuery['incident']
    withOrganization?: boolean
}

type IncidentIdPageContentProps = {
    incident: GetIncidentByIdQuery['incident']
    refetchIncident
    incidentLoading: boolean
    withOrganization?: boolean
    withNewsGeneration?: boolean
}

type IncidentFieldProps = {
    incident: GetIncidentByIdQuery['incident']
}

const LABEL_SPAN_COMMON = 5

const IncidentPropertiesField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'incident.fields.properties.label' })
    const AllPropertiesMessage = intl.formatMessage({ id: 'incident.fields.properties.allSelected' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const { persistor } = useCachePersistor()

    const {
        data: incidentPropertiesData,
        loading: incidentPropertiesLoading,
    } = useGetFullIncidentPropertiesByIncidentIdQuery({
        variables: {
            incidentId: incident.id,
        },
        skip: !incident.id || !persistor,
    })
    const incidentProperties = useMemo(() => incidentPropertiesData?.incidentProperties?.filter(Boolean) || [], [incidentPropertiesData?.incidentProperties])

    const renderPropertyScopeProperties = useMemo(() => {
        if (incident.hasAllProperties) {
            return AllPropertiesMessage
        }

        if (incidentPropertiesLoading) {
            return LoadingMessage
        }

        // TODO(DOMA-2567) refactor duplicate in '@condo/pages/settings/propertyScope/[id]/index.tsx'
        return incidentProperties.map((incidentProperty, index) => {
            const property = incidentProperty?.property
            const propertyMessage = property ? getAddressRender(property, null, DeletedMessage) : ''

            return (
                <div
                    key={property?.id || index}
                >
                    {
                        !property ? (
                            <>
                                {propertyMessage}
                            </>
                        ) : (
                            <Typography.Link
                                href={`/property/${property?.id || ''}`}
                            >
                                {propertyMessage}
                            </Typography.Link>
                        )
                    }
                </div>
            )
        })
    }, [AllPropertiesMessage, DeletedMessage, LoadingMessage, incidentPropertiesLoading, incident.hasAllProperties, incidentProperties])

    return (
        <Row>
            <PageFieldRow title={AddressLabel} ellipsis labelSpan={LABEL_SPAN_COMMON}>
                {renderPropertyScopeProperties}
            </PageFieldRow>
        </Row>
    )
}

const WORK_DATE_UPDATING_INTERVAL_IN_SECONDS = 1000 * 5 // every 10 seconds

const IncidentWorkDateField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const intl = useIntl()
    const WorkDateLabel = intl.formatMessage({ id: 'incident.fields.workDate.label' })
    const DateFromMessage = intl.formatMessage({ id: 'incident.fields.workDate.from' }).toLowerCase()
    const DateToMessage = intl.formatMessage({ id: 'incident.fields.workDate.to' }).toLowerCase()
    const OverdueMessage = intl.formatMessage({ id: 'incident.fields.workDate.overdue' }).toLowerCase()
    const TimeLeftMessage = intl.formatMessage({ id: 'incident.fields.workDate.timeLeft' }).toLowerCase()

    const [currentDate, setCurrentDate] = useState<string>(dayjs().toISOString())

    const isActual = incident.status === IncidentStatusType.Actual
    const workStart = useMemo(() => dayjs(incident.workStart).format('D.MM.YYYY HH:mm'), [incident.workStart])
    const workFinish = useMemo(() => incident.workFinish ? dayjs(incident.workFinish).format('D.MM.YYYY HH:mm') : null, [incident.workFinish])

    const timeLeftMessageType = useMemo(() => getTimeLeftMessageType({
        deadline: incident.workFinish,
        startWithDate: currentDate,
        isDefault: !isActual,
    }), [currentDate, incident.workFinish, isActual])

    const renderTimeLeftMessage = useMemo(() => getTimeLeftMessage({
        show: isActual,
        deadline: incident.workFinish,
        startWithDate: currentDate,
        OverdueMessage,
        TimeLeftMessage,
    }), [OverdueMessage, TimeLeftMessage, currentDate, incident.workFinish, isActual])

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentDate(dayjs().toISOString())
        }, WORK_DATE_UPDATING_INTERVAL_IN_SECONDS)
        return () => {
            clearInterval(interval)
        }
    }, [])

    return (
        <Row>
            <PageFieldRow title={WorkDateLabel} ellipsis labelSpan={LABEL_SPAN_COMMON}>
                <Typography.Text>
                    {DateFromMessage}&nbsp;
                    <Typography.Text strong>
                        {workStart}&nbsp;
                    </Typography.Text>
                    {
                        workFinish ? (
                            <>
                                {DateToMessage}&nbsp;
                                <Typography.Text strong type={timeLeftMessageType}>
                                    {workFinish}
                                </Typography.Text>
                                {
                                    renderTimeLeftMessage && (
                                        <Typography.Text strong type={timeLeftMessageType}>
                                            &nbsp;({renderTimeLeftMessage})
                                        </Typography.Text>
                                    )
                                }
                            </>
                        ) : null
                    }
                </Typography.Text>
            </PageFieldRow>
        </Row>
    )
}

const IncidentClassifiersField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const intl = useIntl()
    const ClassifierLabel = intl.formatMessage({ id: 'incident.fields.classifier.label' })
    const HaveNotMessage = intl.formatMessage({ id: 'incident.fields.classifier.empty' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const { persistor } = useCachePersistor()

    const {
        data: incidentClassifierIncidentsData,
        loading: incidentClassifierIncidentLoading,
    } = useGetIncidentClassifierIncidentByIncidentIdQuery({
        variables: {
            incidentId: incident.id,
        },
        skip: !incident.id || !persistor,
    })
    const incidentClassifiers = useMemo(() => incidentClassifierIncidentsData?.incidentClassifierIncident?.filter(Boolean) || [], [incidentClassifierIncidentsData?.incidentClassifierIncident])

    const categories = useMemo(
        () => uniq(incidentClassifiers
            .map(item => item?.classifier?.category?.name))
            .join(', '),
        [incidentClassifiers])
    const problems = useMemo(
        () => uniq(incidentClassifiers
            .map(item => item?.classifier?.problem?.name)
            .filter(Boolean))
            .join(', '),
        [incidentClassifiers])

    const renderClassifiers = useMemo(() => {
        if (incidentClassifierIncidentLoading) {
            return LoadingMessage
        }

        if (incidentClassifiers.length < 0) {
            return HaveNotMessage
        }

        return (
            <Typography.Text>
                {categories && <Typography.Text strong>
                    {categories}
                </Typography.Text>}
                {problems && <Typography.Text strong type='secondary'>
                    &nbsp;» {problems}
                </Typography.Text>}
            </Typography.Text>
        )
    }, [HaveNotMessage, LoadingMessage, incidentClassifierIncidentLoading, categories, incidentClassifiers.length, problems])

    return (
        <Row>
            <PageFieldRow title={ClassifierLabel} ellipsis labelSpan={LABEL_SPAN_COMMON}>
                {renderClassifiers}
            </PageFieldRow>
        </Row>
    )
}

const IncidentWorkTypeField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const intl = useIntl()
    const WorkTypeLabel = intl.formatMessage({ id: 'incident.fields.workType.label' })
    const WorkTypeEmergencyLabel = intl.formatMessage({ id: 'incident.workType.emergency' })
    const WorkTypeScheduledLabel = intl.formatMessage({ id: 'incident.workType.scheduled' })
    const HaveNotMessage = intl.formatMessage({ id: 'incident.fields.workType.empty' })

    const workTypeLabels = useMemo(() => ({
        [INCIDENT_WORK_TYPE_SCHEDULED]: WorkTypeScheduledLabel,
        [INCIDENT_WORK_TYPE_EMERGENCY]: WorkTypeEmergencyLabel,
    }), [WorkTypeEmergencyLabel, WorkTypeScheduledLabel])

    return (
        <Row>
            <PageFieldRow title={WorkTypeLabel} ellipsis labelSpan={LABEL_SPAN_COMMON}>
                <Typography.Text>
                    {incident.workType && workTypeLabels[incident.workType] || HaveNotMessage}
                </Typography.Text>
            </PageFieldRow>
        </Row>
    )
}

const IncidentDetailsField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const intl = useIntl()
    const DetailsLabel = intl.formatMessage({ id: 'incident.fields.details.label' })

    return (
        <Row>
            <PageFieldRow title={DetailsLabel} ellipsis labelSpan={LABEL_SPAN_COMMON}>
                <Typography.Text>{incident.details}</Typography.Text>
            </PageFieldRow>
        </Row>
    )
}

const IncidentTextForResidentField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const intl = useIntl()
    const TextForResidentLabel = intl.formatMessage({ id: 'incident.fields.textForResident.label' })
    const HaveNotMessage = intl.formatMessage({ id: 'incident.fields.textForResident.empty' })

    return (
        <Row>
            <PageFieldRow title={TextForResidentLabel} ellipsis labelSpan={LABEL_SPAN_COMMON}>
                <Typography.Text type={!incident?.textForResident ? 'secondary' : null}>
                    {incident?.textForResident || HaveNotMessage}
                </Typography.Text>
            </PageFieldRow>
        </Row>
    )
}

const IncidentOrganizationField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const intl = useIntl()
    const OrganizationLabel = intl.formatMessage({ id: 'incident.fields.organization.label' })
    const HaveNotMessage = intl.formatMessage({ id: 'incident.fields.organization.empty' })

    return (
        <Row>
            <PageFieldRow title={OrganizationLabel} ellipsis labelSpan={LABEL_SPAN_COMMON}>
                <Typography.Text type={!incident?.organization?.name ? 'secondary' : null}>
                    {incident?.organization?.name || HaveNotMessage}
                </Typography.Text>
            </PageFieldRow>
        </Row>
    )
}

const INCIDENT_CONTENT_GUTTER: RowProps['gutter'] = [0, 24]

const IncidentContent: React.FC<IncidentContentProps> = (props) => {
    const { incident, withOrganization = false } = props

    return (
        <Row gutter={INCIDENT_CONTENT_GUTTER}>
            {withOrganization && (
                <Col span={24}>
                    <IncidentOrganizationField incident={incident}/>
                </Col>
            )}
            <Col span={24}>
                <IncidentPropertiesField incident={incident} />
            </Col>
            <Col span={24}>
                <IncidentWorkDateField incident={incident} />
            </Col>
            <Col span={24}>
                <IncidentClassifiersField incident={incident} />
            </Col>
            <Col span={24}>
                <IncidentWorkTypeField incident={incident} />
            </Col>
            <Col span={24}>
                <IncidentDetailsField incident={incident} />
            </Col>
            <Col span={24}>
                <IncidentTextForResidentField incident={incident} />
            </Col>
        </Row>
    )
}

const HEADER_CONTENT_GUTTER: RowProps['gutter'] = [0, 24]
const PAGE_CONTENT_GUTTER: RowProps['gutter'] = [0, 60]
const PAGE_HEADER_STYLE: React.CSSProperties = { padding: '0 0 20px 0 !important' }
const DATE_FORMAT = 'DD.MM.YYYY, HH:mm'

export const IncidentIdPageContent: React.FC<IncidentIdPageContentProps> = (props) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'incident.id.title' })
    const DateMessage = intl.formatMessage({ id: 'incident.id.createdAt' })
    const AuthorMessage = intl.formatMessage({ id: 'incident.id.author' }).toLowerCase()
    const ActualLabel = intl.formatMessage({ id: 'incident.status.actual' })
    const NotActualLabel = intl.formatMessage({ id: 'incident.status.notActual' })
    const EditLabel = intl.formatMessage({ id: 'incident.id.edit.label' })
    const ChangeToActualLabel = intl.formatMessage({ id: 'incident.id.makeActual.label' })
    const ChangeToNotActualLabel = intl.formatMessage({ id: 'incident.id.makeNotActual.label' })
    const ChangeHistoryTitle = intl.formatMessage({ id: 'incident.id.changeHistory.title' })
    const GenerateNewsLabel = intl.formatMessage({ id: 'incident.id.generateNews.button.label' })
    const GenericErrorMessage = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })
    const GoToNewsMessage = intl.formatMessage({ id: 'incident.notification.button.goToNews' })
    const ReadyMessage = intl.formatMessage({ id: 'Ready' })
    const ChangesSavedMessage = intl.formatMessage({ id: 'ChangesSaved' })
    const AlsoCreateNewsMessage = intl.formatMessage({ id: 'incident.notification.description.alsoCreateNews' })
    const CreateNewsMessage = intl.formatMessage({ id: 'incident.notification.description.createNews' })

    const { incident, refetchIncident, incidentLoading, withOrganization, withNewsGeneration } = props

    const router = useRouter()
    const { employee } = useOrganization()
    const { persistor } = useCachePersistor()
    const isActual = incident.status === IncidentStatusType.Actual
    const canManageIncidents = useMemo(() => employee?.role?.canManageIncidents || false, [employee])
    const canManageNewsItems = useMemo(() => employee?.role?.canManageNewsItems || false, [employee])

    const { enabled: aiEnabled, features: { generateNewsByIncident: generateNewsByIncidentEnabled } } = useAIConfig()

    const [runGenerateNewsAIFlow, {
        loading: generateNewsLoading,
    }] = useAIFlow<{ title: string, body: string }>({
        flowType: FLOW_TYPES.GENERATE_NEWS_BY_INCIDENT,
        modelName: 'Incident',
        itemId: incident?.id || null,
    })

    const {
        data: incidentClassifierIncidentsData,
        loading: incidentClassifierIncidentLoading,
    } = useGetIncidentClassifierIncidentByIncidentIdQuery({
        variables: {
            incidentId: incident.id,
        },
        skip: !incident.id || !persistor,
    })
    const incidentClassifiers = useMemo(() => incidentClassifierIncidentsData?.incidentClassifierIncident?.filter(Boolean) || [], [incidentClassifierIncidentsData?.incidentClassifierIncident])

    const {
        data: incidentPropertiesData,
        loading: incidentPropertiesLoading,
    } = useGetFullIncidentPropertiesByIncidentIdQuery({
        variables: {
            incidentId: incident.id,
        },
        skip: !incident.id || !persistor,
    })
    const incidentProperties = useMemo(() => incidentPropertiesData?.incidentProperties?.filter(Boolean) || [], [incidentPropertiesData?.incidentProperties])

    const {
        data: incidentChangesData,
        loading: incidentChangesLoading,
        refetch: refetchIncidentChanges,
    } = useGetIncidentChangesByIncidentIdQuery({
        variables: {
            incidentId: incident.id,
        },
        skip: !incident.id || !persistor,
    })
    const incidentChanges = useMemo(() => incidentChangesData?.incidentChanges?.filter(Boolean) || [], [incidentChangesData?.incidentChanges])

    const getSuccessMessage = useCallback((description, newsInitialValue, source) => {
        return {
            message: (
                <Typography.Text strong>{ReadyMessage}</Typography.Text>
            ),
            description: (
                <Row gutter={[0, 16]}>
                    <Col span={24}>
                        <Typography.Text size='medium' type='secondary'>{description}</Typography.Text>
                    </Col>
                    {
                        newsInitialValue && (
                            <Col span={24}>
                                <Button
                                    type='primary'
                                    onClick={() => {
                                        window.open(`/news/create?initialValue=${encodeURIComponent(JSON.stringify(newsInitialValue))}&initialStep=${encodeURIComponent(JSON.stringify(1))}&source=${source}`, '_blank')
                                        notification.destroy()
                                    }}>
                                    {GoToNewsMessage}
                                </Button>
                            </Col>
                        )
                    }
                </Row>
            ),
            duration: 10,
        }
    }, [GoToNewsMessage, ReadyMessage])

    const generateNewsItem = useCallback(async (
        incident: GetIncidentByIdQuery['incident'],
        incidentClassifiers: GetIncidentClassifierIncidentByIncidentIdQuery['incidentClassifierIncident'],
        incidentProperties: GetFullIncidentPropertiesByIncidentIdQuery['incidentProperties'],
        source: AnalyticalNewsSources,
    ) => {
        const context = {
            selectedClassifiers: incidentClassifiers.map(incidentClassifier => ({
                problem: incidentClassifier?.classifier?.problem?.name,
                category: incidentClassifier?.classifier?.category?.name,
            })),
            details: incident.details,
            textForResident: incident.textForResident || '',
            workFinish: incident.workFinish ? dayjs(incident.workFinish).format(DATE_FORMAT) : '',
            workStart: incident.workStart ? dayjs(incident.workStart).format(DATE_FORMAT) : dayjs().format(DATE_FORMAT),
            workType: incident.workType || INCIDENT_WORK_TYPE_SCHEDULED,
            isFinished: incident.status === IncidentStatusType.NotActual,
        }

        const result = await runGenerateNewsAIFlow({ context })

        if (result.error) {
            notification.error({ message: result.localizedErrorText || GenericErrorMessage })
            return
        }

        let validBefore: string | undefined
        if (incident.workFinish) {
            validBefore = dayjs(incident.workFinish).toISOString()
        } else if (incident.workType === IncidentWorkTypeType.Emergency) {
            validBefore = dayjs().add(7, 'days').toISOString()
        }

        const initialValue = {
            title: result?.data?.title,
            body: result?.data?.body,
            propertyIds: incidentProperties
                .map(incidentProperty => incidentProperty.property.id)
                .filter((id) => Boolean(id)),
            hasAllProperties: incident.hasAllProperties,
            type: incident.workType === IncidentWorkTypeType.Emergency ? NEWS_TYPE_EMERGENCY : NEWS_TYPE_COMMON,
            ...(validBefore ? { validBefore } : undefined),
        }

        window.open(`/news/create?initialValue=${encodeURIComponent(JSON.stringify(initialValue))}&initialStep=${encodeURIComponent(JSON.stringify(1))}&source=${source}`, '_blank')

        return initialValue
    }, [GenericErrorMessage, runGenerateNewsAIFlow])

    const afterStatusUpdate: Parameters<UseIncidentUpdateStatusModalType>[0]['afterUpdate'] = useCallback(async (incident, generateNews) => {
        let initialNewsItemValue
        if (withNewsGeneration && aiEnabled && generateNewsByIncidentEnabled && generateNews) {
            initialNewsItemValue = await generateNewsItem(incident, incidentClassifiers, incidentProperties, AnalyticalNewsSources.INCIDENT_STATUS_AUTO)
        }

        let notificationDescription = ChangesSavedMessage
        if (initialNewsItemValue) {
            notificationDescription += ` ${AlsoCreateNewsMessage}`
        }
        notification.success(getSuccessMessage(notificationDescription, initialNewsItemValue, AnalyticalNewsSources.INCIDENT_STATUS_NOTIFY))

        refetchIncident()
        refetchIncidentChanges()
    }, [withNewsGeneration, getSuccessMessage, ChangesSavedMessage, AlsoCreateNewsMessage, generateNewsItem, refetchIncident, refetchIncidentChanges, incidentClassifiers, incidentProperties, aiEnabled, generateNewsByIncidentEnabled])

    const { handleOpen, IncidentUpdateStatusModal } = useIncidentUpdateStatusModal({ incident, afterUpdate: afterStatusUpdate, withNewsGeneration })

    const handleGenerateNews = useCallback(async () => {
        const initialNewsItemValue = await generateNewsItem(incident, incidentClassifiers, incidentProperties, AnalyticalNewsSources.INCIDENT_CARD_AUTO)
        if (initialNewsItemValue) {
            notification.success(getSuccessMessage(CreateNewsMessage, initialNewsItemValue, AnalyticalNewsSources.INCIDENT_CARD_NOTIFY))
        }
    }, [getSuccessMessage, CreateNewsMessage, generateNewsItem, incident, incidentClassifiers, incidentProperties])

    const handleEditIncident = useCallback(async () => {
        await router.push(`/incident/${incident.id}/update`)
    }, [incident.id, router])

    const createdAt = useMemo(() => dayjs(incident?.createdAt).format('DD.MM.YYYY, HH:mm'), [incident.createdAt])
    const createdBy = useMemo(() => incident?.createdBy, [incident])

    return (
        <>
            <Head>
                <title>{PageTitle}{incident.number}</title>
            </Head>
            <PageWrapper>
                <PageHeader style={PAGE_HEADER_STYLE} title={<Typography.Title>{PageTitle}{incident.number}</Typography.Title>} />
                <PageContent>
                    {IncidentUpdateStatusModal}
                    <Row gutter={PAGE_CONTENT_GUTTER}>
                        <Col span={24} lg={24} xl={22}>
                            <Row gutter={HEADER_CONTENT_GUTTER}>
                                <Col id='incident__create-info' span={24}>
                                    <Typography.Text type='secondary' size='small'>{DateMessage} {createdAt}, {AuthorMessage} </Typography.Text>
                                    <UserNameField user={createdBy}>
                                        {({ name, postfix }) => (
                                            <Typography.Text size='small'>
                                                {name}
                                                {postfix && <Typography.Text type='secondary' size='small' ellipsis>&nbsp;{postfix}</Typography.Text>}
                                            </Typography.Text>
                                        )}
                                    </UserNameField>
                                </Col>
                                <Col span={24}>
                                    <Tag
                                        bgColor={INCIDENT_STATUS_COLORS[incident.status].background}
                                        textColor={INCIDENT_STATUS_COLORS[incident.status].text}
                                    >
                                        {isActual ? ActualLabel : NotActualLabel}
                                    </Tag>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24} lg={24} xl={22}>
                            <IncidentContent incident={incident} withOrganization={withOrganization} />
                        </Col>
                        {
                            incidentChanges && (
                                <Col span={24} lg={24} xl={22}>
                                    <ChangeHistory
                                        <GetIncidentChangesByIncidentIdQuery['incidentChanges'][number]>
                                        items={incidentChanges}
                                        loading={incidentChangesLoading}
                                        total={incidentChanges.length}
                                        title={ChangeHistoryTitle}
                                        useChangedFieldMessagesOf={useIncidentChangedFieldMessagesOf}
                                        HistoricalChange={HistoricalChange}
                                        id='incident__change-history'
                                    />
                                </Col>
                            )
                        }
                        <Col span={24}>
                            <ActionBar
                                actions={[
                                    canManageIncidents && (
                                        <Button
                                            key='changeStatus'
                                            disabled={incidentLoading || incidentClassifierIncidentLoading || incidentPropertiesLoading}
                                            type='primary'
                                            children={isActual ? ChangeToNotActualLabel : ChangeToActualLabel}
                                            onClick={handleOpen}
                                            id={isActual ? 'changeStatusToNotActual' : 'changeStatusToActual'}
                                        />
                                    ),
                                    canManageIncidents && (
                                        <Button
                                            key='editIncident'
                                            disabled={incidentLoading}
                                            type='secondary'
                                            children={EditLabel}
                                            onClick={handleEditIncident}
                                            id='editIncident'
                                        />
                                    ),
                                    (withNewsGeneration && aiEnabled && generateNewsByIncidentEnabled && canManageNewsItems) && (
                                        <Button
                                            key='generateNews'
                                            disabled={generateNewsLoading || incidentClassifierIncidentLoading || incidentPropertiesLoading}
                                            loading={generateNewsLoading}
                                            type='secondary'
                                            children={GenerateNewsLabel}
                                            onClick={handleGenerateNews}
                                            id='generateNews'
                                        />
                                    ),
                                ]}
                            />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const IncidentIdPage: PageComponentType = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const ErrorPageTitle = intl.formatMessage({ id: 'incident.id.error.title' })

    const { query } = useRouter()
    const { persistor } = useCachePersistor()

    const incidentId = typeof query?.id === 'string' ? query?.id : null

    const {
        data: incidentData,
        loading: incidentLoading,
        error: incidentError,
        refetch: fetchIncidents,
    } = useGetIncidentByIdQuery({
        variables: {
            incidentId,
        },
        skip: !persistor || !incidentId,
    })
    const incident = useMemo(() => incidentData?.incident || null, [incidentData])

    if (!incident || incidentError) {
        return (
            <LoadingOrErrorPage
                title={ErrorPageTitle}
                loading={incidentLoading}
                error={incidentError && ServerErrorMessage}
            />
        )
    }

    return (
        <IncidentIdPageContent
            incident={incident}
            refetchIncident={fetchIncidents}
            incidentLoading={incidentLoading}
            withNewsGeneration
        />
    )
}

IncidentIdPage.requiredAccess = IncidentReadPermissionRequired

export default IncidentIdPage
