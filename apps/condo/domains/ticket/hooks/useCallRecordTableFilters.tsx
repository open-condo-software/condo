import { CallRecordFragmentWhereInput } from '@app/condo/schema'
import { RangePickerProps } from 'antd/lib/date-picker/generatePicker'
import { Dayjs } from 'dayjs'
import get from 'lodash/get'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { ComponentType, FilterComponentSize, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import {
    getDateTimeGteFilter, getDateTimeLteFilter,
    getDayRangeFilter, getFilter,
    getNumberFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import {
    getCallRecordPhoneFilter,
    getIsIncomingCallFilter,
} from '@condo/domains/ticket/utils/tables.utils'


const filterTicketNumber = getNumberFilter(['ticket', 'number'])
const filterAddress = getStringContainsFilter(['ticket', 'property', 'address'])
const filterTalkTime = getNumberFilter(['callRecord', 'talkTime'])
const filterClientName = getStringContainsFilter(['ticket', 'clientName'])
const filterStartedAtGte = getDateTimeGteFilter(['callRecord', 'startedAt'])
const filterStartedAtLte = getDateTimeLteFilter(['callRecord', 'startedAt'])
const filterStartedAtRange = getDayRangeFilter('startedAt')
const filterProperty = getFilter(['ticket', 'property', 'id'], 'array', 'string', 'in')
const filterIsIncomingCall = getIsIncomingCallFilter()
const filterPhone = getCallRecordPhoneFilter()

export type UseCallRecordTableFiltersReturnType = Array<FiltersMeta<CallRecordFragmentWhereInput>>

export const disabledDate: RangePickerProps<Dayjs>['disabledDate'] = () => false

export const useCallRecordTableFilters = (): UseCallRecordTableFiltersReturnType => {
    const intl = useIntl()
    const StartDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.start' })
    const EndDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.end' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const TalkTimeMessage = intl.formatMessage({ id: 'callRecord.table.column.talkTime' })
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const IncomingCallMessage = intl.formatMessage({ id: 'callRecord.callType.incoming' })
    const OutgoingCallMessage = intl.formatMessage({ id: 'callRecord.callType.outgoing' })
    const EnterPhoneNumberMessage = intl.formatMessage({ id: 'EnterPhoneNumber' })
    const NameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const TicketNumberMessage = intl.formatMessage({ id: 'callRecord.table.column.ticketNumber' })

    const { organization } = useOrganization()
    const organizationId = get(organization, 'id')

    const isIncomingCallOptions = useMemo(() => [
        { label: OutgoingCallMessage, value: 'false' },
        { label: IncomingCallMessage, value: 'true' },
    ], [IncomingCallMessage, OutgoingCallMessage])

    return useMemo((): UseCallRecordTableFiltersReturnType => [
        {
            keyword: 'search',
            filters: [
                filterStartedAtRange,
                filterPhone,
                filterTalkTime,
                filterClientName,
                filterAddress,
                filterTicketNumber,
            ],
            combineType: 'OR',
        },
        {
            keyword: 'ticketNumber',
            filters: [filterTicketNumber],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: TicketNumberMessage,
                },
            },
        },
        {
            keyword: 'startedAtGte',
            filters: [filterStartedAtGte],
        },
        {
            keyword: 'startedAtLte',
            filters: [filterStartedAtLte],
        },
        {
            keyword: 'property',
            filters: [filterProperty],
            component: {
                type: ComponentType.GQLSelect,
                props: {
                    search: searchOrganizationProperty(organizationId),
                    mode: 'multiple',
                    showArrow: true,
                    placeholder: AddressMessage,
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
            keyword: 'talkTime',
            filters: [filterTalkTime],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: TalkTimeMessage,
                },
            },
        },
        {
            keyword: 'callType',
            filters: [filterIsIncomingCall],
            component: {
                type: ComponentType.Select,
                options: isIncomingCallOptions,
                props: {
                    mode: 'multiple',
                    showArrow: true,
                    placeholder: SelectMessage,
                },
            },
        },
        {
            keyword: 'phone',
            filters: [filterPhone],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: EnterPhoneNumberMessage,
                },
            },
        },
        {
            keyword: 'clientName',
            filters: [filterClientName],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: NameMessage,
                },
            },
        },
        {
            keyword: 'startedAt',
            filters: [filterStartedAtRange],
            component: {
                type: ComponentType.DateRange,
                props: {
                    placeholder: [StartDateMessage, EndDateMessage],
                    disabledDate,
                },
            },
        },
    ], [AddressMessage, EndDateMessage, EnterPhoneNumberMessage, NameMessage, SelectMessage, StartDateMessage, TalkTimeMessage, TicketNumberMessage, isIncomingCallOptions, organizationId])
}
