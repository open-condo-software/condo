import { Division } from '@condo/domains/division/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useIntl } from '@core/next/intl'
import { map } from 'lodash'
import { useState } from 'react'

const useTicketAssignmentHook = ({
    organizationId,
}) => {
    const intl = useIntl()
    const DivisionsFoundOneMessage = intl.formatMessage({ id: 'ticket.assignments.divisions.found.one' })
    const DivisionsFoundManyMessage = intl.formatMessage({ id: 'ticket.assignments.divisions.found.many' })

    const [propertyId, setPropertyId] = useState()

    const { loading: loadingDivisions, error: errorLoadingDivisions, objs: divisions } = Division.useObjects({
        where: {
            organization: { id: organizationId },
            // properties_some: {
            //     id: propertyId,
            // },
        },
    }, {
        fetchPolicy: 'network-only',
    })

    // const { loading: loadingProperty, error: errorLoadingProperty, obj: property } = Property.useObject({
    //     where: { id: propertyId },
    // })

    if (loadingDivisions || !divisions) {
        return {}
    }

    if (errorLoadingDivisions) {
        console.error(errorLoadingDivisions)
        return {}
    }

    // if (errorLoadingProperty) {
    //     console.error(errorLoadingProperty)
    //     return {}
    // }

    let message
    if (divisions.length === 1) {
        const division = divisions[0]
        message = DivisionsFoundOneMessage
            .replace('{address}', propertyId)
            .replace('{division}', division.name)
    } else if (divisions.length > 0) {
        const divisionNames = map(divisions, 'name').map(name => `«${name}»`).join(', ')
        message = DivisionsFoundManyMessage
            .replace('{address}', propertyId)
            .replace('{divisions}', divisionNames)
    }

    return {
        message,
        divisions,
        setPropertyId,
    }
}

export {
    useTicketAssignmentHook,
}