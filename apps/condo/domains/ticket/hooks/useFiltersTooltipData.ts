import { useOrganization } from '@core/next/organization'
import { Division } from '@condo/domains/division/utils/clientSchema'
import isEqual from 'lodash/isEqual'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { useIntl } from '@core/next/intl'

export const useFiltersTooltipData = () => {
    const intl = useIntl()
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const DivisionMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.Division' })
    const ClientPhoneMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.ClientPhone' })
    const AssigneeMessage = intl.formatMessage({ id: 'field.Responsible' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const AuthorMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.Author' })

    const { organization } = useOrganization()
    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const { objs: divisions } = Division.useObjects({
        organization: { id: organization.id },
    })

    const filteredPropertiesInDivisions = filters['division']
    const getDivisionsFilteredValue = useCallback((ticket) => {
        for (const d of filteredPropertiesInDivisions) {
            const parsedProperties = d.split(',')
            if (parsedProperties.includes(ticket.property.id))
                return d
        }
    }, [filteredPropertiesInDivisions])

    const getDivisionsTooltipValue = useCallback((ticket) => {
        const resDivisions = []

        for (const filteredPropertiesInDivision of filteredPropertiesInDivisions) {
            const parsedProperties = filteredPropertiesInDivision.split(',')

            if (parsedProperties.includes(ticket.property.id)) {
                for (const division of divisions) {
                    const dProperties = division.properties.map(p => p.id)

                    if (isEqual(dProperties.sort(), parsedProperties.sort())) {
                        resDivisions.push(division.name)
                    }
                }
            }
        }

        return resDivisions.join(', ')
    }, [divisions, filteredPropertiesInDivisions])

    return useMemo(() => [
        { name: 'source', label: SourceMessage, getFilteredValue: (ticket) => ticket.source.id, getTooltipValue: (ticket) => ticket.source.name },
        { name: 'division', label: DivisionMessage, getFilteredValue: getDivisionsFilteredValue, getTooltipValue: getDivisionsTooltipValue },
        { name: 'clientPhone', label: ClientPhoneMessage, getFilteredValue: (ticket) => ticket.clientPhone, getTooltipValue: (ticket) => ticket.clientPhone },
        { name: 'assignee', label: AssigneeMessage, getFilteredValue: (ticket) => ticket.assignee.id, getTooltipValue: (ticket) => ticket.assignee.name },
        { name: 'executor', label: ExecutorMessage, getFilteredValue: (ticket) => ticket.executor.id, getTooltipValue: (ticket) => ticket.executor.name },
        { name: 'createdBy', label: AuthorMessage, getFilteredValue: (ticket) => ticket.createdBy.id, getTooltipValue: (ticket) => ticket.createdBy.name },
    ], [AssigneeMessage, AuthorMessage, ClientPhoneMessage, DivisionMessage, ExecutorMessage, SourceMessage, getDivisionsFilteredValue, getDivisionsTooltipValue])
}