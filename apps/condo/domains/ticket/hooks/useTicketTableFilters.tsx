import { useEffect, useMemo, useRef } from 'react'
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
import { find, get, isEmpty, pick } from 'lodash'
import { useTicketClassifierSelectHook, useTicketTwoLevelsClassifierHook } from './useTwoLevelsTicketClassifier'
import { useApolloClient } from '@core/next/apollo'
import { ClassifiersQueryLocal, TicketClassifierTypes } from '../utils/clientSchema/classifierSearch'

interface Options {
    id: string
    name: string
}

export function useTicketTableFilters (): Array<FiltersMeta<MeterReadingWhereInput>>  {
    const intl = useIntl()
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' }).toLowerCase()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' }).toLowerCase()
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const StatusMessage =  intl.formatMessage({ id: 'Status' })
    const ClientNameMessage = intl.formatMessage({ id: 'Client' })
    const DescriptionMessage = intl.formatMessage({ id: 'Description' })
    const FindWordMessage = intl.formatMessage({ id: 'filters.FindWord' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const EnterAddressMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterAddress' })
    const UserNameMessage = intl.formatMessage({ id: 'filters.UserName' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const ResponsibleMessage = intl.formatMessage({ id: 'field.Responsible' })
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const SectionMessage = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorMessage = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const UnitMessage = intl.formatMessage({ id: 'field.FlatNumber' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const AssigneeMessage = intl.formatMessage({ id: 'field.Responsible' })
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const PlaceClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.PlaceLabel' })
    const CategoryClassifierLabel = intl.formatMessage({ id: 'component.ticketclassifier.CategoryLabel' })
    const ruleRef = useRef({ id: null, place: null, category:null, problem: null })
    const client = useApolloClient()

    const ClassifierLoader = new ClassifiersQueryLocal(client)
    // const ticketForm = useRef(null)

    const onUserSelect = (id, type) => {
        const clearProblem = (id === null && type !== 'problem') ? { problem: null } : {}
        ruleRef.current = { ...ruleRef.current, [type]: id, ...clearProblem }
        updateLevels({ [type]: id })
    }
    const onUserSearch = async (input, type) => {
        const classifiers = await ClassifierLoader.search(input, type)
        Setter[type].search(classifiers)
    }

    const {
        set: categorySet,
        SelectComponent: CategorySelect,
        ref: categoryRef,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.category),
        onSearch: (id) => onUserSearch(id, TicketClassifierTypes.category),
        initialValue: null,
    })

    const {
        set: placeSet,
        SelectComponent: PlaceSelect,
        ref: placeRef,
    } = useTicketClassifierSelectHook({
        onChange: (id) => onUserSelect(id, TicketClassifierTypes.place),
        onSearch: (id) => onUserSearch(id, TicketClassifierTypes.place),
        initialValue: null,
    })

    const Setter = {
        place: placeSet,
        category: categorySet,
    }

    const Refs = {
        place: placeRef,
        category: categoryRef,
    }

    useEffect(() => {
        ClassifierLoader.init().then(() => {
            if (ruleRef.current.id) {
                ClassifierLoader.findRules({ id: ruleRef.current.id }).then(([rule]) => {
                    const { place, category, problem } = rule
                    ruleRef.current = { ...ruleRef.current, ...{ place: place.id, category: category.id } }
                    updateLevels(ruleRef.current)
                })
            } else {
                // fill options on empty classifier
                [TicketClassifierTypes.place, TicketClassifierTypes.category].forEach(type => {
                    ClassifierLoader.search('', type).then(classifiers => {
                        Setter[type].all(classifiers)
                    })
                })
            }
        })
        return () => {
            // clear all loaded data from helper
            ClassifierLoader.clear()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // We build options for every select with care - not to break selection
    // that's why we are making 3 requests here with Promise.all
    // For example, all 3 levels are set - in this case, we have only one matching rule and the number of options on every select will be exactly 1
    // So when we build options for place => we make query with { category: set, problem: set, place: not set}
    // Now we have all possible options for places that will not break selection in the category select and problem select  after choosing
    // Same thing for all selects
    const loadLevels = async () => {
        const { place, category } = ruleRef.current
        const loadedRules = await Promise.all([
            { category, type: 'place' },
            { place, type: 'category' },
        ].map(selector => {
            const { type, ...querySelectors } = selector
            return new Promise<[string, Options[]]>(resolve => {
                const query = {}
                for (const key in querySelectors) {
                    if (querySelectors[key]) {
                        query[key] = { id: querySelectors[key] }
                    }
                }
                ClassifierLoader.findRules(query).then(data => {
                    resolve([type, ClassifierLoader.rulesToOptions(data, type)])
                })
            })
        }))
        const result = Object.fromEntries(loadedRules)

        return result
    }

    const openSelect = (ref) => {
        if (ref.current) {
            ref.current.blur()
            setTimeout(ref.current.focus, 0)
        }
    }

    // Every time user choose some option from select we are trying to find what exact rule is matching for this combination
    // When place and category are chosen we set rule with problem=null
    const updateRuleId = async () => {
        const querySelectors = pick(ruleRef.current, ['place', 'category', 'problem'])
        const query = {}
        for (const key in querySelectors) {
            if (querySelectors[key]) {
                query[key] = { id: querySelectors[key] }
            }
        }
        const matchingRules = await ClassifierLoader.findRules(query)
        if (matchingRules.length === 1) {
            ruleRef.current = { ...ruleRef.current, id: matchingRules[0].id }
        } else if (ruleRef.current.place && ruleRef.current.category) {
            const withEmptyProblem = find(matchingRules, { problem: null })
            if (withEmptyProblem){
                ruleRef.current = { ...ruleRef.current, id: withEmptyProblem.id }
            }
        }
        // ticketForm.current.setFields([
        //     { name: 'classifierRule', value: ruleRef.current.id },
        //     { name: 'placeClassifier', value: ruleRef.current.place },
        //     { name: 'categoryClassifier', value: ruleRef.current.category },
        //     { name: 'problemClassifier', value: ruleRef.current.problem },
        // ])
    }
    // We need to find out whether user is still following classifiers rules
    // or he just make a search in one of a selects and runied all dependencies
    // so we load rules and search if selected value still presence in options
    // if not => we set all not matching selects values to null
    const updateLevels = async (selected = {}, maxUpdates = 2 ) => {
        ruleRef.current = { ...ruleRef.current, ...selected }
        const options = await loadLevels()

        const state = ruleRef.current
        const updateEmptyState = {}
        Object.keys(Setter).forEach(type => {
            const isExisted = options[type].find(option => option.id === state[type])
            if (!isExisted && state[type]) {
                updateEmptyState[type] = null
            }
        })
        if (!isEmpty(updateEmptyState)) {
            // here we need to rebuild all options except selected
            for (const type in updateEmptyState) {
                Refs[type].setV
            }
            ruleRef.current = { ...ruleRef.current, ...updateEmptyState, id: null, ...selected }
            if (maxUpdates > 0) {
                return await updateLevels(selected, --maxUpdates)
            }
        }
        Object.keys(Setter).forEach(type => {
            Setter[type].all(options[type])
            const isExisted = options[type].find(option => option.id === state[type])
            Setter[type].one(isExisted ? state[type] : null)
        })
        await updateRuleId()
        if (!state.place && state.category) {
            openSelect(placeRef)
        } else if (!state.category && state.place) {
            openSelect(categoryRef)
        }
    }

    // const userOrganization = useOrganization()
    // const userOrganizationId = get(userOrganization, ['organization', 'id'])

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
    // Division filter ??? maybe in

    // chips filters
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

    // const { objs: ticketPlaceClassifiers } = TicketPlaceClassifier.useObjects({})
    // const ticketPlaceClassifierOptions = ticketPlaceClassifiers.map(ticketPlaceClassifier =>
    //     ({ label: ticketPlaceClassifier.name, value: ticketPlaceClassifier.id }))
    //
    // const { objs: ticketCategoryClassifiers } = TicketCategoryClassifier.useObjects({})
    // const ticketCategoryClassifierOptions = ticketCategoryClassifiers.map(ticketCategoryClassifier =>
    //     ({ label: ticketCategoryClassifier.name, value: ticketCategoryClassifier.id }))

    // const { ClassifiersEditorComponent } = useTicketTwoLevelsClassifierHook()

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    return useMemo(() => {
        return [
            {
                keyword: 'address',
                filters: [addressFilter],
                component: {
                    type: ComponentType.Input,
                },
            },
            {
                keyword: 'details',
                filters: [detailsFilter],
                component: {
                    type: ComponentType.Input,
                },
            },
            {
                keyword: 'clientName',
                filters: [clientNameFilter],
                component: {
                    type: ComponentType.Input,
                },
            },
            {
                keyword: 'number',
                filters: [numberFilter],
                component: {
                    type: ComponentType.Input,
                },
            },
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
                    // Определяем участок в браузерной строке как "propertyId1, propertyId2" ->
                    // в GQLWhere нам нужен ["propertyId1", "propertyId2"], поэтому процессим
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
                        label: 'Участок',
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'sectionName',
                filters: [sectionFilter],
                component: {
                    type: ComponentType.ChipsInput,
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
                    type: ComponentType.ChipsInput,
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
                    type: ComponentType.ChipsInput,
                    props: {
                        tokenSeparators: [' '],
                        placeholder: 'Введите номер квартиры',
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
                    modalFilterComponent: <PlaceSelect />,
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
                    modalFilterComponent: <CategorySelect />,
                    modalFilterComponentWrapper: {
                        label: CategoryClassifierLabel,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            // {
            //     keyword: 'classifier',
            //     filters: [placeClassifierFilter],
            //     component: {
            //         type: ComponentType.Custom,
            //         modalFilterComponent: (form) => <ClassifiersEditorComponent form={form} disabled={false} />,
            //         modalFilterComponentWrapper: {
            //             // label: PlaceClassifierMessage,
            //             size: FilterComponentSize.Large,
            //         },
            //     },
            // },
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
                    options: [{ label: PaidMessage, value: 'isPaid' }, { label: EmergencyMessage, value: 'isEmergency' }],
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: 'Признак',
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'clientPhone',
                filters: [clientPhoneFilter],
                component: {
                    type: ComponentType.ChipsInput,
                    props: {
                        placeholder: 'Введите телефон',
                    },
                    modalFilterComponentWrapper: {
                        label: 'Телефон жителя',
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
                        placeholder: 'Введите ФИО',
                    },
                    modalFilterComponentWrapper: {
                        label: ExecutorMessage,
                        size: FilterComponentSize.Medium,
                    },
                    columnFilterComponentWrapper: {
                        width: '200px',
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
                        placeholder: 'Введите ФИО',
                    },
                    modalFilterComponentWrapper: {
                        label: AssigneeMessage,
                        size: FilterComponentSize.Medium,
                    },
                    columnFilterComponentWrapper: {
                        width: '200px',
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
                        placeholder: 'Выбрать',
                    },
                    modalFilterComponentWrapper: {
                        label: UserNameMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
        ]
    }, [statuses, sources])
}