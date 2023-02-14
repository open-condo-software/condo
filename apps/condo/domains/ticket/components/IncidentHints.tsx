import {
    Incident as IIncident,
    IncidentClassifier as IIncidentClassifier,
    IncidentClassifierIncidentWhereInput,
    IncidentClassifierWhereInput,
    IncidentStatusType,
    IncidentWhereInput,
    SortIncidentsBy,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React, { useCallback, useEffect, useState } from 'react'
import { IntlShape } from 'react-intl/src/types'

import { useIntl } from '@open-condo/next/intl'
import { Alert, Typography, TypographyParagraphProps } from '@open-condo/ui'

import { Incident, IncidentClassifierIncident, IncidentProperty } from '@condo/domains/ticket/utils/clientSchema'


const INCIDENTS_GUTTER: RowProps['gutter'] = [0, 24]
const DESCRIPTION_GUTTER: RowProps['gutter'] = [0, 14]
const DETAILS_ELLIPSIS_CONFIG: TypographyParagraphProps['ellipsis'] = { rows: 7 }

type classifierDataType = Pick<IIncidentClassifier, 'category' | 'problem'>

type IncidentHintsProps = {
    propertyId: string
    organizationId: string
    classifier?: classifierDataType
    dateISO?: string
}

type IncidentHintProps = {
    incident: IIncident
}

const formatDate = (intl: IntlShape, date?: string) => {
    if (!date) return '…'
    return dayjs(date).format('DD.MM.YYYY HH.mm')
}

const IncidentHint: React.FC<IncidentHintProps> = (props) => {
    const intl = useIntl()
    const MoreLabel = intl.formatMessage({ id: 'incident.hints.more.label' })

    const { incident } = props

    return (
        <Alert
            showIcon
            type='warning'
            description={
                <Row gutter={DESCRIPTION_GUTTER}>
                    <Col span={24}>
                        <Row>
                            <Col span={24}>
                                <Typography.Paragraph strong ellipsis={DETAILS_ELLIPSIS_CONFIG}>
                                    {get(incident, 'details', '')}
                                </Typography.Paragraph>
                            </Col>
                            <Col span={24}>
                                <Typography.Text>
                                    {formatDate(intl, incident.workStart)} — {formatDate(intl, incident.workFinish)}
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
    )
}

/**
 *
 * logic getting incident hints:
 *
 * 1 - search IncidentProperties by propertyId
 *
 * 2 - search Incidents
 *
 * 2.1 - search all actual Incidents by IncidentProperties and date
 *
 * 2.2 - search last 3 not actual Incidents by IncidentProperties and date
 *
 * 3.1 - show Incidents
 *
 * 3.2.1 - search IncidentClassifierIncident by ( TicketCategoryClassifier and TicketProblemClassifier ) and Incidents
 *
 * 3.2.2 - filter Incidents by IncidentClassifierIncident
 *
 * 3.2.2 - show filtered Incidents
 */
export const IncidentHints: React.FC<IncidentHintsProps> = (props) => {
    const { propertyId, dateISO, classifier, organizationId } = props

    const [incidents, setIncidents] = useState<IIncident[]>([])

    const { refetch: refetchAllIncidentProperties } = IncidentProperty.useAllObjects({}, { skip: true })
    const { refetch: refetchIncidents } = Incident.useObjects({}, { skip: true })
    const { refetch: refetchAllIncidentClassifierIncidents } = IncidentClassifierIncident.useAllObjects({}, { skip: true })

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

    const fetchIncidents = useCallback(async (sortBy: SortIncidentsBy[], incidentIds: string[], organizationId: string, dateISO?: string, status?: IncidentStatusType, count?: number) => {
        if (count === 0) {
            return []
        }

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
                            { workFinish: undefined },
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

        if (status) {
            where.status = status
        }

        const res = await refetchIncidents({ where, sortBy, first: count })

        return get(res, 'data.objs', [])
    }, [])

    const fetchIncidentClassifierIncidents = useCallback(async (incidentIds: string[], classifier?: classifierDataType) => {
        if (incidentIds.length < 1) {
            return []
        }

        const where: IncidentClassifierIncidentWhereInput = {
            incident: { id_in: incidentIds },
            deletedAt: null,
        }

        if (classifier) {
            const categoryId = get(classifier, 'category.id')
            const problemId = get(classifier, 'problem.id')

            const AND: IncidentClassifierWhereInput['AND'] = []
            if (categoryId) {
                AND.push({
                    category: { id: categoryId },
                })
            }
            if (problemId) {
                AND.push({
                    OR: [
                        { problem_is_null: true },
                        { problem: { id: problemId } },
                    ],
                })
            }
            where.classifier = {
                AND,
            }
        }

        const res = await refetchAllIncidentClassifierIncidents({
            where,
        })

        return get(res, 'data.objs', [])
    }, [])

    const getIncidents = useCallback(async (propertyId: string, organizationId: string, classifier?: classifierDataType, dateISO?: string) => {
        const incidentProperties = await fetchIncidentProperties(propertyId)
        const incidentIds = incidentProperties.map(item => item.incident.id)
        const actualIncidents = await fetchIncidents(
            [SortIncidentsBy.WorkStartAsc, SortIncidentsBy.CreatedAtAsc],
            incidentIds, organizationId, dateISO, IncidentStatusType.Actual
        )
        const notActualLastIncidents = await fetchIncidents(
            [SortIncidentsBy.WorkFinishDesc, SortIncidentsBy.CreatedAtDesc],
            incidentIds, organizationId, dateISO, IncidentStatusType.NotActual, 3
        )
        const incidents = [...actualIncidents, ...notActualLastIncidents]
        const incidentClassifierIncidents = await fetchIncidentClassifierIncidents(incidents.map(item => item.id), classifier)
        const incidentIdsFormIncidentClassifiers = incidentClassifierIncidents.map(item => item.incident.id)
        const filteredIncidents = incidents.filter((incident) => incidentIdsFormIncidentClassifiers.includes(incident.id))
        setIncidents(filteredIncidents)
    }, [fetchIncidentProperties, fetchIncidentClassifierIncidents, fetchIncidents])

    useEffect(() => {
        getIncidents(propertyId, organizationId, classifier, dateISO)
    }, [propertyId, dateISO, classifier, getIncidents, organizationId])

    return (
        <Row gutter={INCIDENTS_GUTTER}>
            {
                incidents.map(incident => (
                    <Col span={24} key={incident.id}>
                        <IncidentHint incident={incident} />
                    </Col>
                ))
            }
        </Row>
    )
}
