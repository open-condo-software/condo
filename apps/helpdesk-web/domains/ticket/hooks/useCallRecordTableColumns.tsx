import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { Download, Play } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Tag, Tooltip } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import { getAddressRender, getDateRender, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { useDownloadFileFromServer } from '@condo/domains/common/hooks/useDownloadFileFromServer'
import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { formatPhone, getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'

import type { Organization, Contact } from '@app/condo/schema'


interface IFilters extends Pick<Contact, 'name' | 'phone' | 'email'> {
    search?: string
    address?: string
    name?: string
    email?: string
    phone?: string
    organization?: Organization
}

const COLUMNS_WIDTH = {
    startedAt: '12%',
    phone: '12%',
    callType: '12%',
    talkTime: '12%',
    clientName: '12%',
    address: '12%',
    ticketNumber: '12%',
    callRecord: '12%',
}

export const useCallRecordTableColumns = ({ filterMetas, setSelectedCallRecordFragment, setAutoPlay })  => {
    const intl = useIntl()
    const DateTimeMessage = intl.formatMessage({ id: 'callRecord.table.column.startedAt' })
    const PhoneMessage = intl.formatMessage({ id: 'callRecord.table.column.phone' })
    const CallTypeMessage = intl.formatMessage({ id: 'callRecord.table.column.callType' })
    const TalkTimeMessage = intl.formatMessage({ id: 'callRecord.table.column.talkTime' })
    const ClientMessage = intl.formatMessage({ id: 'callRecord.table.column.client' })
    const TicketNumberMessage = intl.formatMessage({ id: 'callRecord.table.column.ticketNumber' })
    const CallRecordMessage = intl.formatMessage({ id: 'callRecord.table.column.record' })
    const IncomingMessage = intl.formatMessage({ id: 'callRecord.callType.incoming' })
    const OutgoingMessage = intl.formatMessage({ id: 'callRecord.callType.outgoing' })
    const SecondsMessage = intl.formatMessage({ id: 'global.duration.seconds.short' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const PlayMessage = intl.formatMessage({ id: 'callRecord.playRecord' })
    const DownloadMessage = intl.formatMessage({ id: 'callRecord.downloadRecord' })

    const router = useRouter()
    const { filters, sorters } = useMemo(() => parseQuery(router.query), [router.query])
    const sorterMap = useMemo(() => getSorterMap(sorters), [sorters])
    const search = useMemo(() => getFilteredValue(filters, 'search'), [filters])
    const render = useMemo(() => getTableCellRenderer({ search }), [search])

    const userOrganization = useOrganization()
    const canDownloadCallRecords = useMemo(() => get(userOrganization, ['link', 'role', 'canDownloadCallRecords']), [userOrganization])

    const phoneRender = useCallback(({ callRecord }) => {
        const phone = callRecord.isIncomingCall ? callRecord.callerPhone : callRecord.destCallerPhone

        return getTableCellRenderer({ search, href: `tel:${phone}` })(formatPhone(phone))
    },
    [search])

    const callTypeRender = useCallback(({ callRecord }) => {
        const isIncomingCall = callRecord.isIncomingCall
        const color = isIncomingCall ? colors.teal : colors.brown

        return (
            <Tag bgColor={color[1]} textColor={color[5]}>
                {isIncomingCall ? IncomingMessage : OutgoingMessage}
            </Tag>
        )
    },
    [IncomingMessage, OutgoingMessage])

    const talkTimeRender = useCallback((talkTime) => render(`${talkTime} ${SecondsMessage}`),
        [SecondsMessage, render])

    const ticketNumberRender = useCallback(ticket => {
        const ticketId = get(ticket, 'id')
        const ticketNumber = get(ticket, 'number')

        if (!ticketId) {
            return '—'
        }

        return getTableCellRenderer({ search, href: `/ticket/${ticketId}`, target: '_blank' })(ticketNumber)
    }
    , [search])

    const clientRender = useCallback(clientName => {
        if (!clientName) {
            return '—'
        }

        return render(clientName)
    }, [render])

    const addressRender = useCallback(
        (property) => {
            if (!property) {
                return '—'
            }

            return getAddressRender(property, DeletedMessage, search)
        },
        [DeletedMessage, search])

    const { downloadFile } = useDownloadFileFromServer()

    const callRecordRender = useCallback((callRecordFragment) => {
        const handlePlay = (e) => {
            e.stopPropagation()

            setAutoPlay(true)
            setSelectedCallRecordFragment(callRecordFragment)
        }

        const url = get(callRecordFragment, 'callRecord.file.publicUrl')
        const name = get(callRecordFragment, 'callRecord.file.originalFilename')
        const handleDownloadFile = (e) => {
            e.stopPropagation()

            downloadFile({ url, name })
        }

        return (
            <Space size={20}>
                <Tooltip title={PlayMessage}>
                    <div>
                        <Play
                            onClick={handlePlay}
                        />
                    </div>
                </Tooltip>
                {
                    canDownloadCallRecords && (
                        <Tooltip title={DownloadMessage}>
                            <div>
                                <Download
                                    onClick={handleDownloadFile}
                                />
                            </div>
                        </Tooltip>
                    )
                }
            </Space>
        )
    }, [DownloadMessage, PlayMessage, canDownloadCallRecords, downloadFile, setAutoPlay, setSelectedCallRecordFragment])

    return useMemo(() => ([
        {
            title: DateTimeMessage,
            sortOrder: get(sorterMap, 'startedAt'),
            filteredValue: getFilteredValue<IFilters>(filters, 'startedAt'),
            dataIndex: 'startedAt',
            key: 'startedAt',
            sorter: true,
            width: COLUMNS_WIDTH.startedAt,
            render: getDateRender(intl, String(search)),
            filterDropdown: getFilterDropdownByKey(filterMetas, 'startedAt'),
            filterIcon: getFilterIcon,
        },
        {
            title: PhoneMessage,
            sortOrder: get(sorterMap, 'phone'),
            filteredValue: getFilteredValue<IFilters>(filters, 'phone'),
            key: 'phone',
            width: COLUMNS_WIDTH.phone,
            render: phoneRender,
            filterDropdown: getFilterDropdownByKey(filterMetas, 'phone'),
            filterIcon: getFilterIcon,
        },
        {
            title: CallTypeMessage,
            sortOrder: get(sorterMap, 'callType'),
            filteredValue: getFilteredValue<IFilters>(filters, 'callType'),
            key: 'callType',
            width: COLUMNS_WIDTH.callType,
            render: callTypeRender,
            filterDropdown: getFilterDropdownByKey(filterMetas, 'callType'),
            filterIcon: getFilterIcon,
        },
        {
            title: TalkTimeMessage,
            sortOrder: get(sorterMap, 'talkTime'),
            key: 'talkTime',
            dataIndex: ['callRecord', 'talkTime'],
            width: COLUMNS_WIDTH.talkTime,
            render: talkTimeRender,
        },
        {
            title: ClientMessage,
            sortOrder: get(sorterMap, 'clientName'),
            filteredValue: getFilteredValue<IFilters>(filters, 'clientName'),
            key: 'clientName',
            dataIndex: ['ticket', 'clientName'],
            width: COLUMNS_WIDTH.clientName,
            render: clientRender,
            filterDropdown: getFilterDropdownByKey(filterMetas, 'clientName'),
            filterIcon: getFilterIcon,
        },
        {
            title: AddressMessage,
            sortOrder: get(sorterMap, 'property'),
            filteredValue: getFilteredValue<IFilters>(filters, 'property'),
            key: 'property',
            dataIndex: ['ticket', 'property'],
            width: COLUMNS_WIDTH.address,
            render: addressRender,
            filterDropdown: getFilterDropdownByKey(filterMetas, 'property'),
            filterIcon: getFilterIcon,
        },
        {
            title: TicketNumberMessage,
            sortOrder: get(sorterMap, 'ticketNumber'),
            filteredValue: getFilteredValue<IFilters>(filters, 'ticketNumber'),
            key: 'ticketNumber',
            dataIndex: 'ticket',
            width: COLUMNS_WIDTH.ticketNumber,
            render: ticketNumberRender,
            filterDropdown: getFilterDropdownByKey(filterMetas, 'ticketNumber'),
            filterIcon: getFilterIcon,
        },
        {
            title: CallRecordMessage,
            key: 'callRecord',
            width: COLUMNS_WIDTH.callRecord,
            render: callRecordRender,
        },
    ]), [AddressMessage, CallRecordMessage, CallTypeMessage, ClientMessage, DateTimeMessage, PhoneMessage, TalkTimeMessage, TicketNumberMessage, addressRender, callRecordRender, callTypeRender, clientRender, filterMetas, filters, intl, phoneRender, search, sorterMap, talkTimeRender, ticketNumberRender])
}
