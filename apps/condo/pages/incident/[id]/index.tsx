// todo(DOMA-2567) add translates
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'

import { Button, Tag, Typography } from '@open-condo/ui'
import { useIntl } from '@open-condo/next/intl'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageHeader, PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { useRouter } from 'next/router'
import { Incident, IncidentProperty, IncidentTicketClassifier, IncidentChange } from '@condo/domains/ticket/utils/clientSchema'
import {
    Incident as IIncident,
    IncidentStatusType,
    SortIncidentChangesBy,
    IncidentChange as IIncidentChange,
} from '@app/condo/schema'
import { Col, Row } from 'antd'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import dayjs, { Dayjs } from 'dayjs'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { get } from 'lodash'
import { INCIDENT_STATUS_COLORS } from '@condo/domains/ticket/constants/incident'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { getAddressRender } from '@condo/domains/ticket/utils/clientSchema/Renders'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { useIncidentUpdateStatusModal } from '@condo/domains/ticket/hooks/useIncidentUpdateStatusModal'
import { ChangeHistory } from '@condo/domains/common/components/ChangeHistory'
import { useIncidentChangedFieldMessagesOf } from '@condo/domains/ticket/hooks/useIncidentChangedFieldMessagesOf'


interface IIncidentIdPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

type IncidentIdPageContentProps = {
    incident: IIncident
    refetchIncident
    incidentLoading: boolean
}

type IncidentContentProps = {
    incident: IIncident
}

type IncidentFieldProps = {
    incident: IIncident
}

const IncidentPropertiesField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const AddressLabel = 'AddressLabel'
    const AllPropertiesMessage = 'AllPropertiesMessage'
    const DeletedMessage = 'DeletedMessage'
    const LoadingMessage = 'LoadingMessage'

    const { objs: incidentProperties, loading } = IncidentProperty.useAllObjects({
        where: {
            incident: { id: incident.id },
            deletedAt: null,
        },
    })

    const renderPropertyScopeProperties = useMemo(() => {
        if (incident.hasAllProperties) {
            return AllPropertiesMessage
        }

        if (loading) {
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
    }, [incident.hasAllProperties, incidentProperties, loading])

    return (
        <Row>
            <PageFieldRow title={AddressLabel} ellipsis labelSpan={5}>
                {renderPropertyScopeProperties}
            </PageFieldRow>
        </Row>
    )
}

/**
 *
 * @param deadline Date in ISO format
 * @param isDefault
 * @param startWithDate Date in ISO format
 */
export const getTimeLeftMessageType: (props: {
    deadline?: string,
    isDefault?: boolean
    startWithDate?: string,
}) => 'warning' | 'danger' | null = ({ deadline, isDefault, startWithDate }) => {
    if (isDefault) return null
    const startWith = startWithDate ? dayjs(startWithDate) : dayjs()
    const timeLeft = deadline && dayjs.duration(dayjs(deadline).diff(startWith))
    if (timeLeft && timeLeft.asMilliseconds() < 0) return 'danger'
    if (timeLeft && timeLeft.asHours() < 24) return 'warning'
    return null
}

/**
 *
 * @param show
 * @param type 'warning' or 'danger'
 * @param deadline Date in ISO format
 * @param startWithDate Date in ISO format
 */
export const getTimeLeftMessage: (props: {
    show: boolean,
    deadline?: string,
    startWithDate?: string
}) => string = ({ show, deadline, startWithDate }) => {
    const TimeLeftMessage = 'time left'
    const OverdueMessage = 'overdue'

    if (!show || !deadline) return null

    const startWith = startWithDate ? dayjs(startWithDate) : dayjs()
    const timeLeft = deadline && dayjs.duration(dayjs(deadline).diff(startWith))
    if (timeLeft && timeLeft.asMilliseconds() < 0) {
        return OverdueMessage
    }
    if (timeLeft && timeLeft.asHours() < 24) {
        return `${TimeLeftMessage} ${timeLeft.format('HH:mm')}`
    }
    return null
}

const WORK_DATE_UPDATING_INTERVAL_IN_SECONDS = 1000 * 5 // every 10 seconds

const IncidentWorkDateField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const WorkDateLabel = 'workDateLabel'
    const DateFromMessage = 'from'
    const DateToMessage = 'to'

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
    }), [currentDate, incident.workFinish, isActual])

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
            <PageFieldRow title={WorkDateLabel} ellipsis labelSpan={5}>
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
    const ClassifierLabel = 'ClassifierLabel'
    const LoadingMessage = 'LoadingMessage'

    const { loading, objs: incidentClassifiers } = IncidentTicketClassifier.useAllObjects({
        where: {
            incident: { id: incident.id },
            deletedAt: null,
        },
    })

    const place = useMemo(
        () => incidentClassifiers.length > 0 && get(incidentClassifiers, ['0', 'classifier', 'place', 'name']),
        [incidentClassifiers])
    const categories = useMemo(
        () => incidentClassifiers
            .map(item => get(item, 'classifier.category.name'))
            .join(', '),
        [incidentClassifiers])
    const problems = useMemo(
        () => incidentClassifiers
            .map(item => get(item, 'classifier.problem.name'))
            .filter(Boolean)
            .join(', '),
        [incidentClassifiers])

    const renderClassifiers = useMemo(() => {
        if (loading) {
            return LoadingMessage
        }

        if (incidentClassifiers.length < 0) {
            return '-'
        }

        return (
            <Typography.Text>
                <Typography.Text strong>
                    {place}
                </Typography.Text>
                {categories && <Typography.Text strong>
                    &nbsp;» {categories}
                </Typography.Text>}
                {problems && <Typography.Text strong type='secondary'>
                    &nbsp;» {problems}
                </Typography.Text>}
            </Typography.Text>
        )
    }, [categories, incidentClassifiers.length, loading, place, problems])

    return (
        <Row>
            <PageFieldRow title={ClassifierLabel} ellipsis labelSpan={5}>
                {renderClassifiers}
            </PageFieldRow>
        </Row>
    )
}

const IncidentWorkTypeField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const WorkTypeLabel = 'WorkTypeLabel'
    const WorkTypeEmergencyMessage = 'WorkTypeEmergencyMessage'
    const WorkTypeScheduledMessage = 'WorkTypeScheduledMessage'

    const workTypes = useMemo(() => {
        const types = []
        if (incident.isEmergency) {
            types.push(WorkTypeEmergencyMessage)
        }
        if (incident.isScheduled) {
            types.push(WorkTypeScheduledMessage)
        }

        return types.join(', ')
    }, [incident.isEmergency, incident.isScheduled])

    return (
        <Row>
            <PageFieldRow title={WorkTypeLabel} ellipsis labelSpan={5}>
                <Typography.Text >
                    {workTypes}
                </Typography.Text>
            </PageFieldRow>
        </Row>
    )
}

const IncidentDetailsField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const DetailsLabel = 'DetailsLabel'

    return (
        <Row>
            <PageFieldRow title={DetailsLabel} ellipsis labelSpan={5}>
                <Typography.Text>{incident.details}</Typography.Text>
            </PageFieldRow>
        </Row>
    )
}

const IncidentTextForResidentField: React.FC<IncidentFieldProps> = ({ incident }) => {
    const TextForResidentLabel = 'TextForResidentLabel'
    const HaveNotMessage = 'HaveNotMessage'

    return (
        <Row>
            <PageFieldRow title={TextForResidentLabel} ellipsis labelSpan={5}>
                <Typography.Text type={!incident.textForResident ? 'secondary' : null}>
                    {incident.textForResident || HaveNotMessage}
                </Typography.Text>
            </PageFieldRow>
        </Row>
    )
}

const IncidentContent: React.FC<IncidentContentProps> = (props) => {
    const { incident } = props

    return (
        <Row gutter={[0, 24]}>
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

const IncidentIdPageContent: React.FC<IncidentIdPageContentProps> = (props) => {
    const { incident, refetchIncident, incidentLoading } = props

    const intl = useIntl()
    const PageTitle = 'Отключение №' + incident.number
    const DateMessage = 'Дата создания ' + dayjs(incident.createdAt).format('DD.MM.YYYY, HH:mm')
    const AuthorMessage = 'автор'
    const ActualMessage = 'ActualMessage'
    const NotActualMessage = 'NotActualMessage'
    const EditLabel = 'EditLabel'
    const MakeNotActualLabel = 'MakeNotActualLabel'
    const MakeActualLabel = 'MakeActualLabel'
    const ChangeHistoryTitle = 'История изменений'

    const router = useRouter()

    const isActual = incident.status === IncidentStatusType.Actual

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

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader style={{ paddingBottom: 20 }} title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <PageContent>
                    {IncidentUpdateStatusModal}
                    <Row gutter={[0, 60]}>
                        <Col span={24} lg={24} xl={22}>
                            <Row gutter={[0, 24]}>
                                <Col span={24}>
                                    <Typography.Text type='secondary' size='small'>{DateMessage}, {AuthorMessage} </Typography.Text>
                                    <UserNameField user={get(incident, ['createdBy'])}>
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
                                        {isActual ? ActualMessage : NotActualMessage}
                                    </Tag>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24} lg={24} xl={22}>
                            <IncidentContent incident={incident} />
                        </Col>
                        <ActionBar>
                            <Button
                                disabled={incidentLoading}
                                type='primary'
                                children={isActual ? MakeActualLabel : MakeNotActualLabel}
                                onClick={handleOpen}
                            />
                            <Button
                                disabled={incidentLoading}
                                type='secondary'
                                children={EditLabel}
                                onClick={handleEditIncident}
                            />
                        </ActionBar>
                        <Col span={24} lg={24} xl={22}>
                            <ChangeHistory
                                <IIncidentChange>
                                items={incidentChanges}
                                loading={incidentChangesLoading}
                                total={incidentChangesCount}
                                title={ChangeHistoryTitle}
                                useChangedFieldMessagesOf={useIncidentChangedFieldMessagesOf}
                                Diff={(props) => <p {...props}></p>}
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

    const router = useRouter()

    const { query: { id } } = router as { query: { [key: string]: string } }

    const {
        loading: incidentLoading,
        obj: incident,
        error,
        refetch,
    } = Incident.useObject({ where: { id } })

    if (incidentLoading && !incident) {
        const PageTitle = 'Отключение'

        return (
            <LoadingOrErrorPage
                title={PageTitle}
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

IncidentIdPage.requiredAccess = OrganizationRequired

export default IncidentIdPage
