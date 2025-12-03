import { useGetTicketSourcesQuery, useGetTicketStatusesQuery } from '@app/condo/gql'
import {
    BuildingUnitSubType,
    Ticket,
    TicketWhereInput,
} from '@app/condo/schema'
import { useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { QuestionCircle } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Tooltip } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'


import { getSelectFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import {
    ComponentType,
    convertToOptions,
    FilterComponentSize,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import {
    FiltersGetterType,
    getDayRangeFilter,
    getFilter,
    getNumberFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'
import { searchOrganizationPropertyScope } from '@condo/domains/scope/utils/clientSchema/search'
import { FEEDBACK_VALUES_BY_KEY } from '@condo/domains/ticket/constants/feedback'
import { QUALITY_CONTROL_VALUES_BY_KEY } from '@condo/domains/ticket/constants/qualityControl'
import { VISIBLE_TICKET_SOURCE_IDS } from '@condo/domains/ticket/constants/sources'
import { TicketCategoryClassifier } from '@condo/domains/ticket/utils/clientSchema'
import { searchEmployeeUser, searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import {
    getClientNameFilter,
    getCommentByTypeFilter,
    getFilterAddressForSearch,
    getIsCompletedAfterDeadlineFilter,
    getIsResidentContactFilter,
    getPropertyScopeFilter,
    getTicketAttributesFilter,
    getTicketTypeFilter,
    getLastCommentWithResidentUserTypeFilter,
} from '@condo/domains/ticket/utils/tables.utils'

import {
    FilterModalCategoryClassifierSelect,
    FilterModalPlaceClassifierSelect,
    FilterModalProblemClassifierSelect,
} from './useModalFilterClassifiers'


const filterNumber = getNumberFilter('number')
const filterCreatedAtRange = getDayRangeFilter('createdAt')
const filterDeadlineRange = getDayRangeFilter('deadline')
const filterCompletedAtRange = getDayRangeFilter('completedAt')
const filterLastResidentCommentAtRange = getDayRangeFilter('lastResidentCommentAt')
const filterCommentsByType = getCommentByTypeFilter()
const filterUnansweredCommentsByOrganizationEmployee = getLastCommentWithResidentUserTypeFilter()
const filterStatus = getFilter(['status', 'type'], 'array', 'string', 'in')
const filterDetails = getStringContainsFilter('details')
const filterProperty = getFilter(['property', 'id'], 'array', 'string', 'in')
const filterAddress = getStringContainsFilter(['property', 'address'])
const filterAddressForSearch = getFilterAddressForSearch('propertyAddress', null)
const filterClientName = getClientNameFilter()
const filterExecutor = getFilter(['executor', 'id'], 'array', 'string', 'in')
const filterAssignee = getFilter(['assignee', 'id'], 'array', 'string', 'in')
const filterExecutorName = getStringContainsFilter(['executor', 'name'])
const filterAssigneeName = getStringContainsFilter(['assignee', 'name'])
const filterAttribute = getTicketAttributesFilter(['isEmergency', 'isPayable', 'isWarranty', 'statusReopenedCounter', 'isRegular'])
const filterIsResidentContact = getIsResidentContactFilter()
const filterFeedbackValue = getFilter('feedbackValue', 'array', 'string', 'in')
const filterQualityControlValue = getFilter('qualityControlValue', 'array', 'string', 'in')
const filterSource = getFilter(['source', 'id'], 'array', 'string', 'in')
const filterSection = getFilter('sectionName', 'array', 'string', 'in')
const filterFloor = getFilter('floorName', 'array', 'string', 'in')
const filterUnit = getFilter('unitName', 'array', 'string', 'in')
const filterUnitType = getFilter('unitType', 'array', 'string', 'in')
const filterPlaceClassifier = getFilter(['classifier', 'place', 'id'], 'array', 'string', 'in')
const filterCategoryClassifier = getFilter(['classifier', 'category', 'id'], 'array', 'string', 'in')
const filterProblemClassifier = getFilter(['classifier', 'problem', 'id'], 'array', 'string', 'in')
const filterClientPhone = getFilter('clientPhone', 'array', 'string', 'in')
const filterTicketAuthor = getFilter(['createdBy', 'id'], 'array', 'string', 'in')
const filterTicketContact = getFilter(['contact', 'id'], 'array', 'string', 'in')
const filterPropertyScope = getPropertyScopeFilter()
const filterIsCompletedAfterDeadline = getIsCompletedAfterDeadlineFilter()
const filterClientNameForSearch = getStringContainsFilter('clientName')
const filterClientPhoneForSearch = getStringContainsFilter('clientPhone')


const getSearchFilter: FiltersGetterType<TicketWhereInput> = (rawSearch: string) => {
    const search = rawSearch?.trim()
    if (!search) return []

    const baseFilters = [
        filterDetails,
    ]
    const searchSpecificFilters = []

    const isTicketNumberSearch = /^\d+$/.test(search)
    const isPhoneNumberSearch = /^\+?\d+$/.test(search)
    const isDateSearch = /^[\d.:-]+$/.test(search)
    const isNameSearch = !isTicketNumberSearch && /^[\p{L}\d\s.'"-]+$/u.test(search)
    const isAddressSearch = /^[\p{L}\d\s,.-]+$/u.test(search)

    if (isTicketNumberSearch) {
        searchSpecificFilters.push(filterNumber)
    }
    if (isPhoneNumberSearch) {
        searchSpecificFilters.push(filterClientPhoneForSearch)
    }
    if (isDateSearch) {
        searchSpecificFilters.push(filterCreatedAtRange)
    }
    if (isNameSearch) {
        searchSpecificFilters.push(filterClientNameForSearch, filterExecutorName, filterAssigneeName)
    }
    if (isAddressSearch) {
        searchSpecificFilters.push(filterAddressForSearch)
    }

    return [
        ...baseFilters, 
        ...searchSpecificFilters,
    ]
}

export function useTicketTableFilters (): Array<FiltersMeta<TicketWhereInput, Ticket>> {
    const intl = useIntl()
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' }).toLowerCase()
    const WarrantyMessage = intl.formatMessage({ id: 'Warranty' }).toLowerCase()
    const RegularMessage = intl.formatMessage({ id: 'Regular' }).toLowerCase()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const PayableMessage = intl.formatMessage({ id: 'Payable' }).toLowerCase()
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
    const ExpiredTickets = intl.formatMessage({ id: 'pages.condo.ticket.filters.ExpiredTickets' })
    const HasComments = intl.formatMessage({ id: 'pages.condo.ticket.filters.HasComments' })
    const OnlyUnansweredComments = intl.formatMessage({ id: 'pages.condo.ticket.filters.OnlyUnansweredComments' })
    const OnlyUnansweredCommentsTooltipHelp = intl.formatMessage({ id: 'pages.condo.ticket.filters.OnlyUnansweredCommentsTooltipHelp' })
    const AssigneeMessage = intl.formatMessage({ id: 'field.Responsible' })
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const PlaceClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.PlaceLabel' })
    const CategoryClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.CategoryLabel' })
    const ProblemClassifierLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.ProblemClassifier' })
    const EnterUnitNameLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterUnitName' })
    const AttributeLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.Attribute' })
    const AuthorMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.Author' })
    const EnterFullNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterFullName' })
    const GoodFeedbackMessage = intl.formatMessage({ id: 'ticket.feedback.good' })
    const BadFeedbackMessage = intl.formatMessage({ id: 'ticket.feedback.bad' })
    const FeedbackValueMessage = intl.formatMessage({ id: 'ticket.feedback' })
    const QualityControlValueMessage = intl.formatMessage({ id: 'ticket.qualityControl.filter.label' })
    const GoodQualityControlMessage = intl.formatMessage({ id: 'ticket.qualityControl.good' })
    const BadQualityControlMessage = intl.formatMessage({ id: 'ticket.qualityControl.bad' })
    const ReturnedMessage = intl.formatMessage({ id: 'Returned' })
    const IsResidentContactLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact' })
    const IsResidentContactMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact.true' })
    const IsNotResidentContactMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.isResidentContact.false' })
    const ResidentComment = intl.formatMessage({ id: 'pages.condo.ticket.filters.residentComment' })
    const OrganizationComment = intl.formatMessage({ id: 'pages.condo.ticket.filters.organizationComment' })
    const LastCommentAtMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.lastCommentAt' })
    const PropertyScopeMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope' })
    const TicketTypeMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.TicketType' })
    const OwnTicketTypeMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.TicketType.own' })
    const FavoriteTicketTypeMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.TicketType.favorite' })

    const { user } = useAuth()
    const userOrganization = useOrganization()
    const userOrganizationId = userOrganization?.organization?.id

    const { persistor } = useCachePersistor()

    const { data: statusesData } = useGetTicketStatusesQuery({ skip: !persistor })
    const statuses = useMemo(() => statusesData?.statuses?.filter(Boolean) || [], [statusesData?.statuses])
    const statusOptions = useMemo(() => convertToOptions(statuses, 'name', 'type'), [statuses])

    const { data: sourcesData } = useGetTicketSourcesQuery({
        skip: !persistor,
        variables: {
            where: {
                OR: [
                    {
                        id_in: VISIBLE_TICKET_SOURCE_IDS,
                    },
                    {
                        isDefault: false,
                    },
                ],
            },
        },
    })
    const sources = useMemo(
        () => sourcesData?.sources?.filter(Boolean) || [],
        [sourcesData?.sources]
    )
    const sourceOptions = useMemo(() => convertToOptions(sources, 'name', 'id'), [sources])

    const attributeOptions = useMemo(() => [
        { label: RegularMessage, value: 'isRegular' },
        { label: PayableMessage, value: 'isPayable' },
        { label: EmergencyMessage, value: 'isEmergency' },
        { label: WarrantyMessage, value: 'isWarranty' },
        { label: ReturnedMessage.toLowerCase(), value: 'statusReopenedCounter' },
    ], [EmergencyMessage, PayableMessage, RegularMessage, ReturnedMessage, WarrantyMessage])
    const feedbackValueOptions = useMemo(() => [
        { label: GoodFeedbackMessage, value: FEEDBACK_VALUES_BY_KEY.GOOD },
        { label: BadFeedbackMessage, value: FEEDBACK_VALUES_BY_KEY.BAD },
    ], [BadFeedbackMessage, GoodFeedbackMessage])
    const qualityControlValueOptions = useMemo(() => [
        { label: GoodQualityControlMessage, value: QUALITY_CONTROL_VALUES_BY_KEY.GOOD },
        { label: BadQualityControlMessage, value: QUALITY_CONTROL_VALUES_BY_KEY.BAD },
    ], [BadQualityControlMessage, GoodQualityControlMessage])
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
    const commentsTypeOptions = useMemo(() => [
        { label: ResidentComment, value: 'lastCommentWithResidentTypeAt' },
        { label: OrganizationComment, value: 'lastCommentWithOrganizationTypeAt' },
    ], [ResidentComment, OrganizationComment])
    const { objs: categoryClassifiers } = TicketCategoryClassifier.useObjects({})
    const categoryClassifiersOptions = useMemo(() => convertToOptions(categoryClassifiers, 'name', 'id'), [categoryClassifiers])

    const ticketTypeOptions = useMemo(
        () => [
            { label: FavoriteTicketTypeMessage, value: 'favorite' },
            { label: OwnTicketTypeMessage, value: 'own' },
        ],
        [FavoriteTicketTypeMessage, OwnTicketTypeMessage]
    )
    const filterTicketType = useMemo(
        () => getTicketTypeFilter(user.id),
        [user.id]
    )

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: getSearchFilter,
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
                        size: FilterComponentSize.MediumLarge,
                    },
                    columnFilterComponentWrapper: {
                        width: '400px',
                    },
                },
            },
            {
                keyword: 'propertyScope',
                filters: [filterPropertyScope],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchOrganizationPropertyScope(userOrganizationId),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                        keyField: 'key',
                    },
                    modalFilterComponentWrapper: {
                        label: PropertyScopeMessage,
                        size: FilterComponentSize.Small,
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
                        size: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'unitName',
                filters: [filterUnit],
                component: {
                    type: ComponentType.TagsSelect,
                    props: {
                        placeholder: EnterUnitNameLabel,
                    },
                    modalFilterComponentWrapper: {
                        label: UnitMessage,
                        size: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'type',
                filters: [filterTicketType],
                component: {
                    type: ComponentType.Select,
                    options: ticketTypeOptions,
                    props: {
                        loading: false,
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: TicketTypeMessage,
                        size: FilterComponentSize.Small,
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
                        size: FilterComponentSize.Small,
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
                        size: FilterComponentSize.Small,
                        spaceSizeAfter: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'placeClassifier',
                filters: [filterPlaceClassifier],
                component: {
                    type: ComponentType.Custom,
                    modalFilterComponent: (form) => <FilterModalPlaceClassifierSelect form={form} />,
                    modalFilterComponentWrapper: {
                        label: PlaceClassifierLabel,
                        size: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'categoryClassifier',
                filters: [filterCategoryClassifier],
                component: {
                    type: ComponentType.Custom,
                    modalFilterComponent: (form) => <FilterModalCategoryClassifierSelect form={form} />,
                    modalFilterComponentWrapper: {
                        label: CategoryClassifierLabel,
                        size: FilterComponentSize.Small,
                    },
                    getComponentFilterDropdown: getSelectFilterDropdown({
                        selectProps: {
                            options: categoryClassifiersOptions,
                            placeholder: CategoryClassifierLabel,
                            mode: 'multiple',
                            id: 'categoryClassifierFilterDropdown',
                        },
                    }),
                },
            },
            {
                keyword: 'problemClassifier',
                filters: [filterProblemClassifier],
                component: {
                    type: ComponentType.Custom,
                    modalFilterComponent: (form) => <FilterModalProblemClassifierSelect form={form} />,
                    modalFilterComponentWrapper: {
                        label: ProblemClassifierLabel,
                        size: FilterComponentSize.Small,
                    },
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
                        size: FilterComponentSize.Small,
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
                        size: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'isCompletedAfterDeadline',
                filters: [filterIsCompletedAfterDeadline],
                component: {
                    type: ComponentType.Checkbox,
                    props: {
                        label: ExpiredTickets,
                    },
                    modalFilterComponentWrapper: {
                        size: FilterComponentSize.Small,
                        formItemProps: {
                            valuePropName: 'checked',
                            style: {
                                height: '100%',
                                display: 'flex',
                                alignItems: 'flex-end',
                            },
                        },
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
                        size: FilterComponentSize.Small,
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
                        size: FilterComponentSize.Small,
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
                        size: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'feedbackValue',
                filters: [filterFeedbackValue],
                component: {
                    type: ComponentType.Select,
                    options: feedbackValueOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: FeedbackValueMessage,
                        size: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'qualityControlValue',
                filters: [filterQualityControlValue],
                component: {
                    type: ComponentType.Select,
                    options: qualityControlValueOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: QualityControlValueMessage,
                        size: FilterComponentSize.Small,
                        spaceSizeAfter: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'commentsByType',
                filters: [filterCommentsByType],
                component: {
                    type: ComponentType.Select,
                    options: commentsTypeOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: HasComments,
                        size: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'unansweredComment',
                filters: [filterUnansweredCommentsByOrganizationEmployee],
                component: {
                    type: ComponentType.Checkbox,
                    props: {
                        children: (
                            <Typography.Text size='medium'>
                                {OnlyUnansweredComments}
                                <Tooltip title={OnlyUnansweredCommentsTooltipHelp}>
                                    <span style={{ verticalAlign: 'middle', marginLeft: '4px' }}>
                                        <QuestionCircle size='small' color={colors.gray[7]} />
                                    </span>
                                </Tooltip>
                            </Typography.Text>
                        ),
                    },
                    modalFilterComponentWrapper: {
                        size: FilterComponentSize.Small,
                        formItemProps: {
                            valuePropName: 'checked',
                            style: {
                                height: '100%',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                            },
                        },
                    },
                },
            },
            {
                keyword: 'lastCommentAt',
                filters: [filterLastResidentCommentAtRange],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: LastCommentAtMessage,
                        size: FilterComponentSize.Small,
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
                            role?.canBeAssignedAsExecutor ?? false
                        )),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterFullNameMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: ExecutorMessage,
                        size: FilterComponentSize.Small,
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
                            role?.canBeAssignedAsResponsible ?? false
                        )),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterFullNameMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: AssigneeMessage,
                        size: FilterComponentSize.Small,
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
                        size: FilterComponentSize.Small,
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
                        size: FilterComponentSize.Small,
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
                        size: FilterComponentSize.Small,
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
                        size: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'contact',
                filters: [filterTicketContact],
            },
        ]
    }, [AddressMessage, DescriptionMessage, UserNameMessage, NumberMessage, userOrganizationId, EnterAddressMessage, SelectMessage, PropertyScopeMessage, unitTypeOptions, UnitTypeMessage, EnterUnitNameLabel, UnitMessage, filterTicketType, ticketTypeOptions, TicketTypeMessage, SectionMessage, FloorMessage, PlaceClassifierLabel, CategoryClassifierLabel, categoryClassifiersOptions, ProblemClassifierLabel, statusOptions, StatusMessage, attributeOptions, AttributeLabel, ExpiredTickets, sourceOptions, SourceMessage, isResidentContactOptions, IsResidentContactLabel, EnterPhoneMessage, ClientPhoneMessage, feedbackValueOptions, FeedbackValueMessage, qualityControlValueOptions, QualityControlValueMessage, commentsTypeOptions, HasComments, OnlyUnansweredComments, OnlyUnansweredCommentsTooltipHelp, StartDateMessage, EndDateMessage, LastCommentAtMessage, EnterFullNameMessage, ExecutorMessage, AssigneeMessage, AuthorMessage, DateMessage, CompletedAtMessage, CompleteBeforeMessage])
}
