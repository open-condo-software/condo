import React, { useMemo } from 'react'
import { get } from 'lodash'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'

import {
    ComponentType,
    convertToOptions,
    FilterComponentSize,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import {
    BuildingUnitSubType,
    TicketWhereInput,
    TicketSource as TicketSourceType,
    TicketStatus as TicketStatusType,
    TicketCategoryClassifier as TicketCategoryClassifierType,
} from '@app/condo/schema'
import {
    getDayRangeFilter,
    getFilter,
    getNumberFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'
import { getSelectFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { REVIEW_VALUES } from '@condo/domains/ticket/constants'

import { TicketCategoryClassifier, TicketSource, TicketStatus } from '../utils/clientSchema'
import { searchEmployeeUser, searchOrganizationDivision, searchOrganizationProperty } from '../utils/clientSchema/search'
import { getIsResidentContactFilter, getTicketAttributesFilter } from '../utils/tables.utils'
import { useModalFilterClassifiers } from './useModalFilterClassifiers'

const filterNumber = getNumberFilter('number')
const filterCreatedAtRange = getDayRangeFilter('createdAt')
const filterDeadlineRange = getDayRangeFilter('deadline')
const filterCompletedAtRange = getDayRangeFilter('completedAt')
const filterStatus = getFilter(['status', 'id'], 'array', 'string', 'in')
const filterDetails = getStringContainsFilter('details')
const filterProperty = getFilter(['property', 'id'], 'array', 'string', 'in')
const filterAddress = getStringContainsFilter(['property', 'address'])
const filterClientName = getStringContainsFilter('clientName')
const filterExecutor = getFilter(['executor', 'id'], 'array', 'string', 'in')
const filterAssignee = getFilter(['assignee', 'id'], 'array', 'string', 'in')
const filterExecutorName = getStringContainsFilter(['executor', 'name'])
const filterAssigneeName = getStringContainsFilter(['assignee', 'name'])
const filterAttribute = getTicketAttributesFilter(['isEmergency', 'isPaid', 'isWarranty', 'statusReopenedCounter'])
const filterIsResidentContact = getIsResidentContactFilter()
const filterReviewValue = getFilter('reviewValue', 'array', 'string', 'in')
const filterSource = getFilter(['source', 'id'], 'array', 'string', 'in')
const filterSection = getFilter('sectionName', 'array', 'string', 'in')
const filterFloor = getFilter('floorName', 'array', 'string', 'in')
const filterUnit = getStringContainsFilter('unitName')
const filterUnitType = getFilter('unitType', 'array', 'string', 'in')
const filterPlaceClassifier = getFilter(['placeClassifier', 'id'], 'array', 'string', 'in')
const filterCategoryClassifier = getFilter(['categoryClassifier', 'id'], 'array', 'string', 'in')
const filterCategoryClassifierSearch = getStringContainsFilter(['categoryClassifier', 'name'])
const filterClientPhone = getFilter('clientPhone', 'array', 'string', 'in')
const filterTicketAuthor = getFilter(['createdBy', 'id'], 'array', 'string', 'in')
const filterTicketContact = getFilter(['contact', 'id'], 'array', 'string', 'in')

export function useTicketTableFilters (): Array<FiltersMeta<TicketWhereInput>>  {
    const intl = useIntl()
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' }).toLowerCase()
    const WarrantyMessage = intl.formatMessage({ id: 'Warranty' }).toLowerCase()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' }).toLowerCase()
    const DateMessage = intl.formatMessage({ id: 'CreatedDate' })
    const CompletedAtMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.CompletedAt' })
    const CompleteBeforeMessage = intl.formatMessage({ id: 'ticket.deadline.CompleteBefore' })
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
    const UnitTypeMessage = intl.formatMessage({ id: 'field.UnitType' })
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
    const GoodReviewMessage = intl.formatMessage({ id: 'ticket.reviewValue.good' })
    const BadReviewMessage = intl.formatMessage({ id: 'ticket.reviewValue.bad' })
    const ReviewValueMessage = intl.formatMessage({ id: 'ticket.reviewValue' })
    const ReturnedMessage = intl.formatMessage({ id: 'Returned' })
    const IsResidentContactLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact' })
    const IsResidentContactMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact.true' })
    const IsNotResidentContactMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact.false' })

    const { objs: statuses } = TicketStatus.useObjects({})
    const statusOptions = convertToOptions<TicketStatusType>(statuses, 'name', 'id')

    const { objs: sources } = TicketSource.useObjects({})
    const sourceOptions = convertToOptions<TicketSourceType>(sources, 'name', 'id')

    const attributeOptions = useMemo(() => [
        { label: PaidMessage, value: 'isPaid' },
        { label: EmergencyMessage, value: 'isEmergency' },
        { label: WarrantyMessage, value: 'isWarranty' },
        { label: ReturnedMessage.toLowerCase(), value: 'statusReopenedCounter' },
    ], [EmergencyMessage, PaidMessage, ReturnedMessage, WarrantyMessage])
    const reviewValueOptions = useMemo(() => [
        { label: GoodReviewMessage, value: REVIEW_VALUES.GOOD },
        { label: BadReviewMessage, value: REVIEW_VALUES.BAD },
    ], [BadReviewMessage, GoodReviewMessage])
    const unitTypeOptions = useMemo(() => [
        { label: intl.formatMessage({ id: `field.UnitType.${BuildingUnitSubType.Flat}` }), value: BuildingUnitSubType.Flat },
        { label: intl.formatMessage({ id: `field.UnitType.${BuildingUnitSubType.Parking}` }), value: BuildingUnitSubType.Parking },
        { label: intl.formatMessage({ id: `field.UnitType.${BuildingUnitSubType.Apartment}` }), value: BuildingUnitSubType.Apartment },
        { label: intl.formatMessage({ id: `field.UnitType.${BuildingUnitSubType.Commercial}` }), value: BuildingUnitSubType.Commercial },
        { label: intl.formatMessage({ id: `field.UnitType.${BuildingUnitSubType.Warehouse}` }), value: BuildingUnitSubType.Warehouse },
    ], [intl])
    const isResidentContactOptions = useMemo(() => [
        { label: IsResidentContactMessage, value: 'false' },
        { label: IsNotResidentContactMessage, value: 'true' },
    ], [IsNotResidentContactMessage, IsResidentContactMessage])
    const { objs: categoryClassifiers } = TicketCategoryClassifier.useObjects({})
    const categoryClassifiersOptions = convertToOptions<TicketCategoryClassifierType>(categoryClassifiers, 'name', 'id')

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const { CategorySelect, PlaceSelect } = useModalFilterClassifiers()

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [
                    filterNumber,
                    filterClientName,
                    filterAddress,
                    filterDetails,
                    filterExecutorName,
                    filterAssigneeName,
                    filterCreatedAtRange,
                    filterCategoryClassifierSearch,
                ],
                combineType: 'OR',
            },
            {
                keyword: 'address',
                filters: [filterAddress],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: AddressMessage,
                    },
                },
            },
            {
                keyword: 'details',
                filters: [filterDetails],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: DescriptionMessage,
                    },
                },
            },
            {
                keyword: 'clientName',
                filters: [filterClientName],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: UserNameMessage,
                    },
                },
            },
            {
                keyword: 'number',
                filters: [filterNumber],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: NumberMessage,
                    },
                },
            },
            {
                keyword: 'property',
                filters: [filterProperty],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchOrganizationProperty(userOrganizationId),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterAddressMessage,
                        infinityScroll: true,
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
                filters: [filterCreatedAtRange],
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
                keyword: 'completedAt',
                filters: [filterCompletedAtRange],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: CompletedAtMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'source',
                filters: [filterSource],
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
                filters: [filterProperty],
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
                filters: [filterSection],
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
                filters: [filterFloor],
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
                keyword: 'unitType',
                filters: [filterUnitType],
                component: {
                    type: ComponentType.Select,
                    options: unitTypeOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: UnitTypeMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'unitName',
                filters: [filterUnit],
                component: {
                    type: ComponentType.Input,
                    props: {
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
                filters: [filterPlaceClassifier],
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
                filters: [filterCategoryClassifier],
                component: {
                    type: ComponentType.Custom,
                    modalFilterComponent: (form) => <CategorySelect form={form} />,
                    modalFilterComponentWrapper: {
                        label: CategoryClassifierLabel,
                        size: FilterComponentSize.Medium,
                    },
                    getComponentFilterDropdown: getSelectFilterDropdown({
                        options: categoryClassifiersOptions,
                        placeholder: CategoryClassifierLabel,
                        mode: 'multiple',
                    }),
                },
            },
            {
                keyword: 'status',
                filters: [filterStatus],
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
                filters: [filterAttribute],
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
                keyword: 'reviewValue',
                filters: [filterReviewValue],
                component: {
                    type: ComponentType.Select,
                    options: reviewValueOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: ReviewValueMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'contactIsNull',
                filters: [filterIsResidentContact],
                component: {
                    type: ComponentType.Select,
                    options: isResidentContactOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: IsResidentContactLabel,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'clientPhone',
                filters: [filterClientPhone],
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
                keyword: 'deadline',
                filters: [filterDeadlineRange],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                        disabledDate: () => false,
                    },
                    modalFilterComponentWrapper: {
                        label: CompleteBeforeMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'executor',
                filters: [filterExecutor],
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
                filters: [filterAssignee],
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
                keyword: 'createdBy',
                filters: [filterTicketAuthor],
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
            {
                keyword: 'contact',
                filters: [filterTicketContact],
            },
        ]
    }, [statuses, sources])
}