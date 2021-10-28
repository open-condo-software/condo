import React, { useMemo, useRef } from 'react'
import { ComponentType, FilterComponentSize, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { MeterReadingWhereInput } from '@app/condo/schema'
import {
    getDayRangeFilter,
    getFilter,
    getNumberFilter,
    getStringContainsFilter,
    getTicketAttributesFilter,
} from '@condo/domains/common/utils/tables.utils'
import { TicketSource, TicketStatus } from '../utils/clientSchema'
import { useIntl } from '@core/next/intl'
import { searchEmployeeUser, searchOrganizationDivision, searchOrganizationProperty } from '../utils/clientSchema/search'
import { useOrganization } from '@core/next/organization'
import { get } from 'lodash'
import { useModalFilterClassifiers } from './useModalFilterClassifiers'

export function useTicketTableFilters (): Array<FiltersMeta<MeterReadingWhereInput>>  {
    const intl = useIntl()
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' }).toLowerCase()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' }).toLowerCase()
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const StatusMessage =  intl.formatMessage({ id: 'Status' })
    const DescriptionMessage = intl.formatMessage({ id: 'Description' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const EnterAddressMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterAddress' })
    const UserNameMessage = intl.formatMessage({ id: 'filters.UserName' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const SectionMessage = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorMessage = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const UnitMessage = intl.formatMessage({ id: 'field.FlatNumber' })
    const EnterPhoneMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterPhone' })
    const ClientPhoneMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.ClientPhone' })
    const AssigneeMessage = intl.formatMessage({ id: 'field.Responsible' })
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const PlaceClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.PlaceLabel' })
    const CategoryClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.CategoryLabel' })
    const DivisionLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.Division' })
    const EnterUnitNameLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterUnitName' })
    const AttributeLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.Attribute' })
    const AuthorMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.Author' })
    const EnterFullNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterFullName' })

    const numberFilter = getNumberFilter('number')
    const dateRangeFilter = getDayRangeFilter('createdAt')
    const statusFilter = getFilter(['status', 'id'], 'array', 'string', 'in')
    const detailsFilter = getStringContainsFilter('details')
    const propertyFilter = getFilter(['property', 'id'], 'array', 'string', 'in')
    const addressFilter = getStringContainsFilter(['property', 'address'])
    const clientNameFilter = getStringContainsFilter('clientName')
    const executorNameFilter = getStringContainsFilter(['executor', 'name'])
    const assigneeNameFilter = getStringContainsFilter(['assignee', 'name'])

    const attributeFilter = getTicketAttributesFilter(['isEmergency', 'isPaid'])

    // filters which display only in modal
    const sourceFilter = getFilter(['source', 'id'], 'array', 'string', 'in')

    const sectionFilter = getFilter('sectionName', 'array', 'string', 'in')
    const floorFilter = getFilter('floorName', 'array', 'string', 'in')
    const unitFilter = getFilter('unitName', 'array', 'string', 'in')

    // classifier filters
    const placeClassifierFilter = getFilter(['placeClassifier', 'id'], 'array', 'string', 'in')
    const categoryClassifierFilter = getFilter(['categoryClassifier', 'id'], 'array', 'string', 'in')

    const clientPhoneFilter = getFilter('clientPhone', 'array', 'string', 'in')
    const ticketAuthorFilter = getFilter(['createdBy', 'id'], 'array', 'string', 'in')

    const { objs: statuses } = TicketStatus.useObjects({})
    const statusOptions = statuses.map(status => ({ label: status.name, value: status.id }))

    const { objs: sources } = TicketSource.useObjects({})
    const sourceOptions = sources.map(source => ({ label: source.name, value: source.id }))

    const attributeOptions = [{ label: PaidMessage, value: 'isPaid' }, { label: EmergencyMessage, value: 'isEmergency' }]

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const { CategorySelect, PlaceSelect } = useModalFilterClassifiers()

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [
                    numberFilter,
                    clientNameFilter,
                    detailsFilter,
                    executorNameFilter,
                    assigneeNameFilter,
                ],
                combineType: 'OR',
            },
            {
                keyword: 'address',
                filters: [addressFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: AddressMessage,
                    },
                },
            },
            {
                keyword: 'details',
                filters: [detailsFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: DescriptionMessage,
                    },
                },
            },
            {
                keyword: 'clientName',
                filters: [clientNameFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: UserNameMessage,
                    },
                },
            },
            {
                keyword: 'number',
                filters: [numberFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: NumberMessage,
                    },
                },
            },
            {
                keyword: 'property',
                filters: [propertyFilter],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchOrganizationProperty(userOrganizationId),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterAddressMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: AddressMessage,
                        size: FilterComponentSize.Large,
                    },
                    columnFilterComponentWrapper: {
                        width: '400px',
                    },
                },
            },
            {
                keyword: 'createdAt',
                filters: [dateRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: DateMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'source',
                filters: [sourceFilter],
                component: {
                    type: ComponentType.Select,
                    options: sourceOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: SourceMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'division',
                filters: [propertyFilter],
                queryToWhereProcessor: (queryDivisions) => {
                    // We define single division in the browser query as "propertyId1, propertyId2" ->
                    // in GQLWhere we need ["propertyId1", "propertyId2"]
                    return queryDivisions?.map(queryDivision => queryDivision.split(',')).flat(1)
                },
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchOrganizationDivision(userOrganizationId),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: DivisionLabel,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'sectionName',
                filters: [sectionFilter],
                component: {
                    type: ComponentType.TagsSelect,
                    props: {
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: SectionMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'floorName',
                filters: [floorFilter],
                component: {
                    type: ComponentType.TagsSelect,
                    props: {
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: FloorMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'unitName',
                filters: [unitFilter],
                component: {
                    type: ComponentType.TagsSelect,
                    props: {
                        tokenSeparators: [' '],
                        placeholder: EnterUnitNameLabel,
                    },
                    modalFilterComponentWrapper: {
                        label: UnitMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'placeClassifier',
                filters: [placeClassifierFilter],
                component: {
                    type: ComponentType.Custom,
                    modalFilterComponent: (form) => <PlaceSelect form={form} />,
                    modalFilterComponentWrapper: {
                        label: PlaceClassifierLabel,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'categoryClassifier',
                filters: [categoryClassifierFilter],
                component: {
                    type: ComponentType.Custom,
                    modalFilterComponent: (form) => <CategorySelect form={form} />,
                    modalFilterComponentWrapper: {
                        label: CategoryClassifierLabel,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'status',
                filters: [statusFilter],
                component: {
                    type: ComponentType.Select,
                    options: statusOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: StatusMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'attributes',
                filters: [attributeFilter],
                component: {
                    type: ComponentType.Select,
                    options: attributeOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: AttributeLabel,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'clientPhone',
                filters: [clientPhoneFilter],
                component: {
                    type: ComponentType.TagsSelect,
                    props: {
                        placeholder: EnterPhoneMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: ClientPhoneMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'executor',
                filters: [executorNameFilter],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchEmployeeUser(userOrganizationId, ({ role }) => (
                            get(role, 'canBeAssignedAsExecutor', false)
                        )),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterFullNameMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: ExecutorMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'assignee',
                filters: [assigneeNameFilter],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchEmployeeUser(userOrganizationId, ({ role }) => (
                            get(role, 'canBeAssignedAsResponsible', false)
                        )),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterFullNameMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: AssigneeMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'author',
                filters: [ticketAuthorFilter],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchEmployeeUser(userOrganizationId),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterFullNameMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: AuthorMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
        ]
    }, [statuses, sources])
}