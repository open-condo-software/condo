import {
    Incident as IIncident,
    IncidentStatusType,
    SortIncidentChangesBy,
    IncidentChange as IIncidentChange,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import dayjs  from 'dayjs'
import { get } from 'lodash'
import uniq from 'lodash/uniq'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Tag, Typography } from '@open-condo/ui'

import { ChangeHistory } from '@condo/domains/common/components/ChangeHistory'
import { HistoricalChange } from '@condo/domains/common/components/ChangeHistory/HistoricalChange'
import { PageHeader, PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { getTimeLeftMessage, getTimeLeftMessageType } from '@condo/domains/common/utils/date.utils'
import { IncidentReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import {
    INCIDENT_STATUS_COLORS,
    INCIDENT_WORK_TYPE_EMERGENCY,
    INCIDENT_WORK_TYPE_SCHEDULED,
} from '@condo/domains/ticket/constants/incident'
import { useIncidentChangedFieldMessagesOf } from '@condo/domains/ticket/hooks/useIncidentChangedFieldMessagesOf'
import { useIncidentUpdateStatusModal } from '@condo/domains/ticket/hooks/useIncidentUpdateStatusModal'
import { Incident, IncidentProperty, IncidentClassifierIncident, IncidentChange } from '@condo/domains/ticket/utils/clientSchema'
import { getAddressRender } from '@condo/domains/ticket/utils/clientSchema/Renders'
import { UserNameField } from '@condo/domains/user/components/UserNameField'


export interface IIncidentIdPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

type IncidentContentProps = {
    incident: IIncident
    withOrganization?: boolean
}

type IncidentIdPageContentProps = {
    incident: IIncident
    refetchIncident
    incidentLoading: boolean
    withOrganization?: boolean
}

type IncidentFieldProps = {
    incident: IIncident
}

const LABEL_SPAN_COMMON = 5

const IncidentPropertiesField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'incident.fields.properties.label' })
    const AllPropertiesMessage = intl.formatMessage({ id: 'incident.fields.properties.allSelected' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const { objs: incidentProperties, allDataLoaded } = IncidentProperty.useAllObjects({
        where: {
            incident: { id: incident.id },
            deletedAt: null,
        },
    })

    const renderPropertyScopeProperties = useMemo(() => {
        if (incident.hasAllProperties) {
            return AllPropertiesMessage
        }

        if (!allDataLoaded) {
            return LoadingMessage
        }

        // TODO(DOMA-2567) refactor duplicate in '@condo/pages/settings/propertyScope/[id]/index.tsx'
        return incidentProperties.map(({ property }) => {
            const isDeleted = Boolean(get(property, 'deletedAt'))
            const propertyMessage = getAddressRender(property, null, DeletedMessage)

            return (
                <div
                    key={property.id}
                >
                    {
                        isDeleted ? (
                            <>
                                {propertyMessage}
                            </>
                        ) : (
                            <Typography.Link
                                href={`/property/${get(property, 'id')}`}
                            >
                                {propertyMessage}
                            </Typography.Link>
                        )
                    }
                </div>
            )
        })
    }, [AllPropertiesMessage, DeletedMessage, LoadingMessage, allDataLoaded, incident.hasAllProperties, incidentProperties])

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

    const { objs: incidentClassifiers, allDataLoaded } = IncidentClassifierIncident.useAllObjects({
        where: {
            incident: { id: incident.id },
            deletedAt: null,
        },
    })
    const categories = useMemo(
        () => uniq(incidentClassifiers
            .map(item => get(item, 'classifier.category.name')))
            .join(', '),
        [incidentClassifiers])
    const problems = useMemo(
        () => uniq(incidentClassifiers
            .map(item => get(item, 'classifier.problem.name'))
            .filter(Boolean))
            .join(', '),
        [incidentClassifiers])

    const renderClassifiers = useMemo(() => {
        if (!allDataLoaded) {
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
    }, [HaveNotMessage, LoadingMessage, allDataLoaded, categories, incidentClassifiers.length, problems])

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
                <Typography.Text type={!get(incident, 'textForResident') ? 'secondary' : null}>
                    {get(incident, 'textForResident') || HaveNotMessage}
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
                <Typography.Text type={!get(incident, 'organization.name') ? 'secondary' : null}>
                    {get(incident, 'organization.name') || HaveNotMessage}
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
const PAGE_HEADER_STYLE: React.CSSProperties = { paddingBottom: 20 }

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

    const { incident, refetchIncident, incidentLoading, withOrganization } = props

    const router = useRouter()
    const { link } = useOrganization()

    const isActual = incident.status === IncidentStatusType.Actual
    const canManageIncidents = useMemo(() => get(link, ['role', 'canManageIncidents'], false), [link])

    const {
        objs: incidentChanges,
        loading: incidentChangesLoading,
        count: incidentChangesCount,
        refetch: refetchIncidentChanges,
    } = IncidentChange.useObjects({
        where: { incident: { id: incident.id } },
        sortBy: [SortIncidentChangesBy.CreatedAtDesc],
    }, {
        fetchPolicy: 'network-only',
    })

    const afterStatusUpdate = useCallback(async () => {
        await refetchIncident()
        await refetchIncidentChanges()
    }, [refetchIncident, refetchIncidentChanges])

    const { handleOpen, IncidentUpdateStatusModal } = useIncidentUpdateStatusModal({ incident, afterUpdate: afterStatusUpdate })

    const handleEditIncident = useCallback(async () => {
        await router.push(`/incident/${incident.id}/update`)
    }, [incident.id, router])

    const createdAt = useMemo(() => dayjs(incident.createdAt).format('DD.MM.YYYY, HH:mm'), [incident.createdAt])
    const createdBy = useMemo(() => get(incident, ['createdBy']), [incident])

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
                                <Col span={24}>
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
                                        <IIncidentChange>
                                        items={incidentChanges}
                                        loading={incidentChangesLoading}
                                        total={incidentChangesCount}
                                        title={ChangeHistoryTitle}
                                        useChangedFieldMessagesOf={useIncidentChangedFieldMessagesOf}
                                        HistoricalChange={HistoricalChange}
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
                                            disabled={incidentLoading}
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
                                ]}
                            />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const IncidentIdPage: IIncidentIdPage = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const ErrorPageTitle = intl.formatMessage({ id: 'incident.id.error.title' })

    const router = useRouter()

    const { query: { id } } = router as { query: { [key: string]: string } }

    const {
        loading: incidentLoading,
        obj: incident,
        error,
        refetch,
    } = Incident.useObject({ where: { id } })

    if (!incident || error) {
        return (
            <LoadingOrErrorPage
                title={ErrorPageTitle}
                loading={incidentLoading}
                error={error && ServerErrorMessage}
            />
        )
    }

    return (
        <IncidentIdPageContent
            incident={incident}
            refetchIncident={refetch}
            incidentLoading={incidentLoading}
        />
    )
}

IncidentIdPage.requiredAccess = IncidentReadPermissionRequired

export default IncidentIdPage
