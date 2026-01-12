import {
    GetTicketByIdQueryResult,
    useGetOrganizationEmployeeSpecializationsQuery,
    useGetPropertyScopeOrganizationEmployeesQuery,
    useGetPropertyScopesQuery,
    useGetPropertyScopePropertiesQuery,
    GetTicketObserversByTicketIdQuery,
} from '@app/condo/gql'
import { TicketWhereInput } from '@app/condo/schema'
import { createContext, useCallback, useContext, useMemo } from 'react'
import React from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { TICKET_OBSERVERS } from '@condo/domains/common/constants/featureflags'
import {
    ORGANIZATION_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
    PROPERTY_TICKET_VISIBILITY,
    ASSIGNED_TICKET_VISIBILITY,
} from '@condo/domains/organization/constants/common'


interface ITicketVisibilityContext {
    ticketFilterQuery: TicketWhereInput
    ticketFilterQueryLoading: boolean
    canEmployeeReadTicket: (ticket: GetTicketByIdQueryResult['data']['tickets'][0], observers: GetTicketObserversByTicketIdQuery['observers']) => boolean
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
    isTicketObserversEnabled,
}) => {
    const assignedTicketFiltersQuery = {
        OR: [
            {
                assignee: { id: userId },
                executor: { id: userId },
                ...(isTicketObserversEnabled ? { observers_some: { user: { id: userId } } } : {}),
            },
        ],
    }
    const organizationTicketFiltersQuery = {
        organization: { id: organizationId },
    }
    const isEmployeeInPropertyScopeWithAllProperties = !!propertyScopes.find(scope => scope.hasAllProperties)
    const isEmployeeHasAllSpecializations = employee?.hasAllSpecializations || null

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
    observers,
    isTicketObserversEnabled,
}) => {
    const isUserIsTicketAssigneeOrExecutor = ticket?.assignee?.id === userId || ticket?.executor?.id === userId
    const isUserIsTicketObserver = isTicketObserversEnabled && Array.isArray(observers) ? (observers.some(observer => observer?.user?.id === userId)) : false
    const isEmployeeOrganizationMatchToTicketOrganization = ticket?.organization?.id === organizationId
    const isTicketPropertyInPropertyScopes = !!properties.find(propertyId => propertyId === ticket?.property?.id)
    const isTicketClassifierInSpecializations = !!specializations.find(specId => specId === ticket?.classifier?.category?.id)

    const isEmployeeInPropertyScopeWithAllProperties = !!propertyScopes.find(scope => scope.hasAllProperties)
    const isEmployeeHasAllSpecializations = employee?.hasAllSpecializations || null

    switch (ticketVisibilityType) {
        case ORGANIZATION_TICKET_VISIBILITY: {
            return isEmployeeOrganizationMatchToTicketOrganization
        }
        case PROPERTY_TICKET_VISIBILITY: {
            if (isEmployeeInPropertyScopeWithAllProperties) {
                return isEmployeeOrganizationMatchToTicketOrganization
            }

            return isEmployeeOrganizationMatchToTicketOrganization && (
                isTicketPropertyInPropertyScopes || isUserIsTicketAssigneeOrExecutor || isUserIsTicketObserver
            )
        }
        case PROPERTY_AND_SPECIALIZATION_VISIBILITY: {
            if (isEmployeeInPropertyScopeWithAllProperties && isEmployeeHasAllSpecializations) {
                return isEmployeeOrganizationMatchToTicketOrganization
            }

            if (isEmployeeInPropertyScopeWithAllProperties) {
                return isEmployeeOrganizationMatchToTicketOrganization && (
                    isUserIsTicketAssigneeOrExecutor || isTicketClassifierInSpecializations || isUserIsTicketObserver
                )
            }
            if (isEmployeeHasAllSpecializations) {
                return isEmployeeOrganizationMatchToTicketOrganization && ticket?.classifier && (
                    isTicketPropertyInPropertyScopes || isUserIsTicketAssigneeOrExecutor || isUserIsTicketObserver
                )
            }

            return isEmployeeOrganizationMatchToTicketOrganization && (
                isUserIsTicketAssigneeOrExecutor || isUserIsTicketObserver ||  (
                    isTicketPropertyInPropertyScopes && isTicketClassifierInSpecializations
                )
            )
        }
        case ASSIGNED_TICKET_VISIBILITY: {
            return isEmployeeOrganizationMatchToTicketOrganization && (isUserIsTicketAssigneeOrExecutor || isUserIsTicketObserver)
        }

        default: {
            return isEmployeeOrganizationMatchToTicketOrganization
        }
    }
}

const TicketVisibilityContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { user, isLoading: userIsLoading, isAuthenticated } = useAuth()
    const userId = user?.id || null

    const { isLoading: userOrganizationLoading, organization: userOrganization, employee } = useOrganization()
    const organizationId = userOrganization?.id || null
    const employeeId = employee?.id || null
    const ticketVisibilityType = employee?.role?.ticketVisibilityType

    const { persistor } = useCachePersistor()

    const { useFlag } = useFeatureFlags()
    const isTicketObserversEnabled = useFlag(TICKET_OBSERVERS)

    const { data: propertyScopeEmployeesData, loading: employeesLoading } = useGetPropertyScopeOrganizationEmployeesQuery({
        variables: {
            employeeId,
        },
        skip: userIsLoading || userOrganizationLoading || !isAuthenticated || !employeeId || !persistor,
    })
    const propertyScopeEmployees = useMemo(() =>
        propertyScopeEmployeesData?.propertyScopeOrganizationEmployees.filter(Boolean) || [],
    [propertyScopeEmployeesData?.propertyScopeOrganizationEmployees])

    const propertyScopeIds = propertyScopeEmployees
        .filter(propertyScopeEmployee => propertyScopeEmployee.propertyScope && propertyScopeEmployee.employee)
        .map(propertyScopeEmployee => propertyScopeEmployee.propertyScope.id)

    const { data: propertyScopesData, loading: propertyScopeLoading } = useGetPropertyScopesQuery({
        variables: {
            organizationId,
            propertyScopeIds,
        },
        skip: userIsLoading || userOrganizationLoading || !isAuthenticated || !organizationId || !persistor,
    })
    const propertyScopes = useMemo(() =>
        propertyScopesData?.propertyScope.filter(Boolean) || [],
    [propertyScopesData?.propertyScope])

    const { data: propertyScopePropertiesData, loading: propertiesLoading } = useGetPropertyScopePropertiesQuery({
        variables: {
            propertyScopeIds: propertyScopes.map(scope => scope.id),
        },
        skip: userIsLoading || userOrganizationLoading || !isAuthenticated || propertyScopes.length === 0 || !persistor,
    })
    const propertyScopeProperties = useMemo(() =>
        propertyScopePropertiesData?.propertyScopeProperty.filter(Boolean) || [],
    [propertyScopePropertiesData?.propertyScopeProperty])

    const { data: organizationEmployeeSpecializationsData, loading: specializationsLoading } = useGetOrganizationEmployeeSpecializationsQuery({
        variables: {
            employeeId,
        },
        skip: userIsLoading || userOrganizationLoading || !isAuthenticated || !employeeId || !persistor,
    })
    const employeeSpecializations = useMemo(() =>
        organizationEmployeeSpecializationsData?.organizationEmployeeSpecializations.filter(Boolean) || [],
    [organizationEmployeeSpecializationsData?.organizationEmployeeSpecializations])

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
        isTicketObserversEnabled,
    })

    const ticketFilterQueryLoading = userIsLoading || userOrganizationLoading || employeesLoading ||
        propertyScopeLoading || propertiesLoading || specializationsLoading

    const canEmployeeReadTicket = useCallback((ticket, observers) => isEmployeeCanReadTicket({
        ticket,
        ticketVisibilityType,
        organizationId,
        userId,
        specializations,
        properties,
        propertyScopes,
        employee,
        observers,
        isTicketObserversEnabled,
    }), [employee, organizationId, properties, propertyScopes, specializations, ticketVisibilityType, userId, isTicketObserversEnabled])

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