import get from 'lodash/get'
import { createContext, useContext } from 'react'

import { TicketWhereInput } from '@app/condo/schema'
import { useOrganization } from '@condo/next/organization'
import { useAuth } from '@condo/next/auth'

import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
import {
    PropertyScope,
    PropertyScopeOrganizationEmployee,
    PropertyScopeProperty,
} from '@condo/domains/scope/utils/clientSchema'
import {
    ORGANIZATION_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
    PROPERTY_TICKET_VISIBILITY,
    ASSIGNED_TICKET_VISIBILITY,
} from '@condo/domains/organization/constants/common'


interface ITicketVisibilityContext {
    ticketFilterQuery: TicketWhereInput,
    ticketFilterQueryLoading: boolean
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
    const propertyScopeIds = propertyScopeEmployees.map(propertyScopeEmployee => propertyScopeEmployee.propertyScope.id)
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

    const specializations = employeeSpecializations.map(empSpec => empSpec.specialization.id)
    const properties = propertyScopeProperties.map(scope => scope.property.id)

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

    return (
        <TicketVisibilityContext.Provider value={{
            ticketFilterQuery,
            ticketFilterQueryLoading,
        }}>
            {children}
        </TicketVisibilityContext.Provider>
    )
}

export { useTicketVisibility, TicketVisibilityContextProvider }