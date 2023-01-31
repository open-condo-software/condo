import {
    IncidentWhereInput,
    Incident as IIncident,
    IncidentTicketClassifierWhereInput,
    IncidentStatusType,
    TicketClassifier as ITicketClassifier, TicketClassifierWhereInput,
} from '@app/condo/schema'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React, { ComponentProps, useCallback, useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Alert } from '@open-condo/ui'

import { IncidentProperty, IncidentTicketClassifier, Incident } from '@condo/domains/ticket/utils/clientSchema'


type Gutters = ComponentProps<typeof Row>['gutter']

const INCIDENTS_GUTTER: Gutters = [0, 24]
const DESCRIPTION_GUTTER: Gutters = [0, 14]

type IncidentHintsProps = {
    propertyId: string
    organizationId: string
    classifier?: ITicketClassifier
    dateISO?: string
    onlyActual?: boolean
}

const formatDate = (date?: string) => {
    if (!date) return '…'
    return dayjs(date).format('DD.MM.YYYY HH.mm')
}

export const IncidentHints: React.FC<IncidentHintsProps> = (props) => {
    const intl = useIntl()
    const MoreLabel = intl.formatMessage({ id: 'incident.hints.more.label' })

    const { propertyId, dateISO, classifier, organizationId, onlyActual = false } = props

    // Logic:
    //
    // 1 - search IncidentProperties by propertyId
    //
    // 2 - search Incidents by IncidentProperties and date
    //
    // 3.1 - show Incidents
    //
    // 3.2.1 - search IncidentTicketClassifiers by classifierIds and incidentIds
    // 3.2.2 - filter Incidents by IncidentTicketClassifiers
    // 3.2.2 - show Incidents

    const [incidents, setIncidents] = useState<IIncident[]>([])

    const { refetch: refetchAllIncidentProperties } = IncidentProperty.useAllObjects({}, { skip: true })
    const { refetch: refetchIncidents } = Incident.useObjects({}, { skip: true })
    const { refetch: refetchAllIncidentTicketClassifiers } = IncidentTicketClassifier.useAllObjects({}, { skip: true })

    const fetchIncidentProperties = useCallback(async (propertyId: string) => {
        const res = await refetchAllIncidentProperties({
            where: {
                property: {
                    id: propertyId,
                    deletedAt: null,
                },
                deletedAt: null,
            },
        })

        return get(res, 'data.objs', [])
    }, [])

    const fetchIncidents = useCallback(async (incidentIds: string[], organizationId: string, dateISO?: string) => {
        const whereAND: IncidentWhereInput[] = [
            {
                OR: [
                    { id_in: incidentIds },
                    { hasAllProperties: true },
                ],
            },
        ]

        if (dateISO) {
            whereAND.push({
                OR: [
                    {
                        AND: [
                            { workStart_lte: dateISO },
                            { workFinish_gte: undefined },
                        ],
                    },
                    {
                        AND: [
                            { workStart_lte: dateISO },
                            { workFinish_gte: dateISO },
                        ],
                    },
                ],
            })
        }

        const where: IncidentWhereInput = {
            organization: { id: organizationId },
            AND: whereAND,
        }

        if (onlyActual) {
            where.status = IncidentStatusType.Actual
        }

        const res = await refetchIncidents({ where })

        return get(res, 'data.objs', [])
    }, [onlyActual])

    const fetchIncidentTicketClassifiers = useCallback(async (incidentIds: string[], classifier?: ITicketClassifier) => {
        if (incidentIds.length < 1) {
            return []
        }

        const where: IncidentTicketClassifierWhereInput = {
            incident: { id_in: incidentIds },
            deletedAt: null,
        }

        if (classifier) {
            const placeId = get(classifier, 'place.id')
            const categoryId = get(classifier, 'category.id')
            const problemId = get(classifier, 'problem.id')
            const classifierWhere: TicketClassifierWhereInput = {}
            if (placeId) {
                classifierWhere.place = { id: placeId }
            }
            if (categoryId) {
                classifierWhere.category = { id: categoryId }
            }
            if (problemId) {
                classifierWhere.problem = { id: problemId }
            }
            where.classifier = classifierWhere
        }

        const res = await refetchAllIncidentTicketClassifiers({
            where,
        })

        return get(res, 'data.objs', [])
    }, [])

    const getIncidents = useCallback(async (propertyId: string, organizationId: string, classifier?: ITicketClassifier, dateISO?: string) => {
        const incidentProperties = await fetchIncidentProperties(propertyId)
        const incidents = await fetchIncidents(incidentProperties.map(item => item.incident.id), organizationId, dateISO)
        const incidentTicketClassifiers = await fetchIncidentTicketClassifiers(incidents.map(item => item.id), classifier)
        const incidentIdsFormIncidentClassifiers = incidentTicketClassifiers.map(item => item.incident.id)
        const filteredIncidents = incidents.filter((incident) => incidentIdsFormIncidentClassifiers.includes(incident.id))
        setIncidents(filteredIncidents)
    }, [fetchIncidentProperties, fetchIncidentTicketClassifiers, fetchIncidents])

    useEffect(() => {
        getIncidents(propertyId, organizationId, classifier, dateISO)
    }, [propertyId, dateISO, classifier, getIncidents, organizationId])

    return (
        <Row gutter={INCIDENTS_GUTTER}>
            {
                incidents.map(incident => (
                    <Col span={24} key={incident.id}>
                        <Alert
                            showIcon
                            type='warning'
                            description={
                                <Row gutter={DESCRIPTION_GUTTER}>
                                    <Col span={24}>
                                        <Row>
                                            <Col span={24}>
                                                <Typography.Text strong>
                                                    {`${String(incident.details).substring(0, 100)}…`}
                                                </Typography.Text>
                                            </Col>
                                            <Col span={24}>
                                                <Typography.Text>
                                                    {formatDate(incident.workStart)} — {formatDate(incident.workFinish)}
                                                </Typography.Text>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Typography.Link
                                            href={`/incident/${incident.id}`}
                                            size='large'
                                            target='_blank'
                                        >
                                            {MoreLabel}
                                        </Typography.Link>
                                    </Col>
                                </Row>
                            }
                        />
                    </Col>
                ))
            }
        </Row>
    )
}
