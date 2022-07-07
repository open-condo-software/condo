import { useOrganization } from '@core/next/organization'
import isEqual from 'lodash/isEqual'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { Ticket } from '@app/condo/schema'

import { Division } from '@condo/domains/division/utils/clientSchema'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { FiltersTooltipDataObject } from '@condo/domains/common/hooks/useMultipleFiltersModal'

export function useFiltersTooltipData (): FiltersTooltipDataObject<Ticket>[] {
    const intl = useIntl()
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const DivisionMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.Division' })
    const ClientPhoneMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.ClientPhone' })
    const AuthorMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.Author' })

    const { organization } = useOrganization()
    const organizationId = get(organization, 'id')
    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const { objs: divisions } = Division.useNewObjects({
        where: {
            organization: { id: organizationId },
        },
    })

    const filteredPropertiesInDivisions = filters['division']
    const getDivisionsFilteredValue = useCallback((ticket) => {
        for (const filteredPropertiesInDivision of filteredPropertiesInDivisions) {
            const parsedProperties = filteredPropertiesInDivision.split(',')

            if (parsedProperties.includes(ticket.property.id))
                return filteredPropertiesInDivision
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
        { name: 'createdBy', label: AuthorMessage, getFilteredValue: (ticket) => ticket.createdBy.id, getTooltipValue: (ticket) => ticket.createdBy.name },
    ], [AuthorMessage, ClientPhoneMessage, DivisionMessage, SourceMessage, getDivisionsFilteredValue, getDivisionsTooltipValue])
}