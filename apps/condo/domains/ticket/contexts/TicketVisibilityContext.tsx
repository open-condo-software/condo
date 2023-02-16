import { Ticket, TicketWhereInput } from '@app/condo/schema'
import get from 'lodash/get'
import { createContext, useCallback, useContext } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import {
    ORGANIZATION_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
    PROPERTY_TICKET_VISIBILITY,
    ASSIGNED_TICKET_VISIBILITY,
} from '@condo/domains/organization/constants/common'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
import {
    PropertyScope,
    PropertyScopeOrganizationEmployee,
    PropertyScopeProperty,
} from '@condo/domains/scope/utils/clientSchema'


interface ITicketVisibilityContext {
    ticketFilterQuery: TicketWhereInput,
    ticketFilterQueryLoading: boolean,
    canEmployeeReadTicket: (ticket: Ticket) => boolean
}

const TicketVisibilityContext = createContext<ITicketVisibilityContext>(null)

const useTicketVisibility = (): ITicketVisibilityContext => useContext(TicketVisibilityContext)

const getTicketsQueryByTicketVisibilityType = ({
    ticketVisibilityType,
    organizationId,
    userId,
    specializations,
    properties,
    propertyScopes,
    employee,
}) => {
    const assignedTicketFiltersQuery = {
        OR: [
            {
                assignee: { id: userId },
                executor: { id: userId },
            },
        ],
    }
    const organizationTicketFiltersQuery = {
        organization: { id: organizationId },
    }
    const isEmployeeInPropertyScopeWithAllProperties = !!propertyScopes.find(scope => scope.hasAllProperties)
    const isEmployeeHasAllSpecializations = get(employee, 'hasAllSpecializations')

    switch (ticketVisibilityType) {
        case ORGANIZATION_TICKET_VISIBILITY: {
            return organizationTicketFiltersQuery
        }
        case PROPERTY_TICKET_VISIBILITY: {
            if (isEmployeeInPropertyScopeWithAllProperties) {
                return organizationTicketFiltersQuery
            }

            return {
                ...organizationTicketFiltersQuery,
                OR: [
                    {
                        property: { id_in: properties },
                        ...assignedTicketFiltersQuery,
                    },
                ],
            }
        }
        case PROPERTY_AND_SPECIALIZATION_VISIBILITY: {
            if (isEmployeeInPropertyScopeWithAllProperties && isEmployeeHasAllSpecializations) {
                return organizationTicketFiltersQuery
            }
            if (isEmployeeInPropertyScopeWithAllProperties) {
                return {
                    ...organizationTicketFiltersQuery,
                    OR: [
                        {
                            AND: [
                                {
                                    organization: { id: organizationId },
                                    classifier: { category: { id_in: specializations } },
                                },
                            ],
                            ...assignedTicketFiltersQuery,
                        },
                    ],
                }
            }
            if (isEmployeeHasAllSpecializations) {
                return {
                    ...organizationTicketFiltersQuery,
                    OR: [
                        {
                            property: { id_in: properties },
                        },
                        {
                            ...assignedTicketFiltersQuery,
                        },
                    ],
                }
            }

            return {
                ...organizationTicketFiltersQuery,
                OR: [
                    {
                        AND: [
                            {
                                property: { id_in: properties },
                                classifier: { category: { id_in: specializations } },
                            },
                        ],
                        ...assignedTicketFiltersQuery,
                    },
                ],
            }
        }
        case ASSIGNED_TICKET_VISIBILITY: {
            return {
                ...organizationTicketFiltersQuery,
                ...assignedTicketFiltersQuery,
            }
        }

        default: {
            return { organization: { id: organizationId } }
        }
    }
}

const isEmployeeCanReadTicket = ({
    ticket,
    ticketVisibilityType,
    organizationId,
    userId,
    specializations,
    properties,
    propertyScopes,
    employee,
}) => {
    const isUserIsTicketAssigneeOrExecutor = get(ticket, ['assignee', 'id']) === userId || get(ticket, ['executor', 'id']) === userId
    const isEmployeeOrganizationMatchToTicketOrganization = get(ticket, ['organization', 'id']) === organizationId
    const isTicketPropertyInPropertyScopes = !!properties.find(propertyId => propertyId === get(ticket, ['property', 'id']))
    const isTicketClassifierInSpecializations = !!specializations.find(specId => specId === get(ticket, ['classifier', 'category', 'id']))

    const isEmployeeInPropertyScopeWithAllProperties = !!propertyScopes.find(scope => scope.hasAllProperties)
    const isEmployeeHasAllSpecializations = get(employee, 'hasAllSpecializations')

    switch (ticketVisibilityType) {
        case ORGANIZATION_TICKET_VISIBILITY: {
            return isEmployeeOrganizationMatchToTicketOrganization
        }
        case PROPERTY_TICKET_VISIBILITY: {
            if (isEmployeeInPropertyScopeWithAllProperties) {
                return isEmployeeOrganizationMatchToTicketOrganization
            }

            return isEmployeeOrganizationMatchToTicketOrganization && (
                isTicketPropertyInPropertyScopes || isUserIsTicketAssigneeOrExecutor
            )
        }
        case PROPERTY_AND_SPECIALIZATION_VISIBILITY: {
            if (isEmployeeInPropertyScopeWithAllProperties && isEmployeeHasAllSpecializations) {
                return isEmployeeOrganizationMatchToTicketOrganization
            }

            if (isEmployeeInPropertyScopeWithAllProperties) {
                return isEmployeeOrganizationMatchToTicketOrganization && (
                    isUserIsTicketAssigneeOrExecutor || isTicketClassifierInSpecializations
                )
            }
            if (isEmployeeHasAllSpecializations) {
                return isEmployeeOrganizationMatchToTicketOrganization && get(ticket, 'classifier') && (
                    isTicketPropertyInPropertyScopes || isUserIsTicketAssigneeOrExecutor
                )
            }

            return isEmployeeOrganizationMatchToTicketOrganization && (
                isUserIsTicketAssigneeOrExecutor || (
                    isTicketPropertyInPropertyScopes && isTicketClassifierInSpecializations
                )
            )
        }
        case ASSIGNED_TICKET_VISIBILITY: {
            return isEmployeeOrganizationMatchToTicketOrganization && isUserIsTicketAssigneeOrExecutor
        }

        default: {
            return isEmployeeOrganizationMatchToTicketOrganization
        }
    }
}

const TicketVisibilityContextProvider: React.FC = ({ children }) => {
    const { user, isLoading } = useAuth()
    const userId = get(user, 'id', null)
    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)
    const userOrganizationLoading = get(userOrganization, 'isLoading')
    const employee = get(userOrganization, 'link')
    const employeeId = get(employee, 'id', null)
    const ticketVisibilityType = get(employee, ['role', 'ticketVisibilityType'])

    const { objs: propertyScopeEmployees, loading: employeesLoading } = PropertyScopeOrganizationEmployee.useAllObjects({
        where: {
            employee: { id: employeeId },
        },
    })
    const propertyScopeIds = propertyScopeEmployees
        .filter(propertyScopeEmployee => propertyScopeEmployee.propertyScope && propertyScopeEmployee.employee)
        .map(propertyScopeEmployee => propertyScopeEmployee.propertyScope.id)
    const { objs: propertyScopes, loading: propertyScopeLoading } = PropertyScope.useAllObjects({
        where: {
            organization: { id: organizationId },
            OR: [
                { id_in: propertyScopeIds },
                { hasAllEmployees: true },
            ],
        },
    })
    const { objs: propertyScopeProperties, loading: propertiesLoading } = PropertyScopeProperty.useAllObjects({
        where: {
            propertyScope: { id_in: propertyScopes.map(scope => scope.id) },
        },
    })
    const { objs: employeeSpecializations, loading: specializationsLoading } = OrganizationEmployeeSpecialization.useAllObjects({
        where: {
            employee: { id: employeeId },
        },
    })

    const specializations = employeeSpecializations
        .filter(empSpec => empSpec.specialization && empSpec.employee)
        .map(empSpec => empSpec.specialization.id)
    const properties = propertyScopeProperties
        .filter(empSpec => empSpec.propertyScope && empSpec.property)
        .map(scope => scope.property.id)

    const ticketFilterQuery = getTicketsQueryByTicketVisibilityType({
        ticketVisibilityType,
        organizationId,
        userId,
        specializations,
        properties,
        propertyScopes,
        employee,
    })

    const ticketFilterQueryLoading = isLoading || userOrganizationLoading || employeesLoading ||
        propertyScopeLoading || propertiesLoading || specializationsLoading

    const canEmployeeReadTicket = useCallback((ticket) => isEmployeeCanReadTicket({
        ticket,
        ticketVisibilityType,
        organizationId,
        userId,
        specializations,
        properties,
        propertyScopes,
        employee,
    }), [employee, organizationId, properties, propertyScopes, specializations, ticketVisibilityType, userId])

    return (
        <TicketVisibilityContext.Provider value={{
            ticketFilterQuery,
            ticketFilterQueryLoading,
            canEmployeeReadTicket,
        }}>
            {children}
        </TicketVisibilityContext.Provider>
    )
}

export { useTicketVisibility, TicketVisibilityContextProvider }