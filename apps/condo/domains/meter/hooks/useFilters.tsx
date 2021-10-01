import { useMemo } from 'react'
import { ComponentType, FilterComponentSize, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { MeterReadingWhereInput } from '@app/condo/schema'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import { get } from 'lodash'
import {
    getDayRangeFilter, getFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'
import { MeterReadingSource, MeterResource } from '../utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'

export function useFilters (): Array<FiltersMeta<MeterReadingWhereInput>>  {
    const intl = useIntl()
    const EnterAddressMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterAddress' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const EnterAccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterAccountNumber' })
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.Account' })
    const FullNameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const ContactMessage = intl.formatMessage({ id: 'Contact' })
    const ChooseServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.ChooseService' })
    const ServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.Service' })
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const MeterReadingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReadingDate' })
    const EnterMeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterMeterNumber' })
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterNumber' })
    const EnterPlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterPlace' })
    const PlaceMessage = intl.formatMessage({ id: 'pages.condo.meter.Place' })
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const VerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate' })
    const InstallationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.InstallationDate' })
    const CommissioningDateMessage = intl.formatMessage({ id: 'pages.condo.meter.CommissioningDate' })
    const SealingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.SealingDate' })
    const ControlReadingsDate = intl.formatMessage({ id: 'pages.condo.meter.ControlReadingsDate' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const addressFilter = getFilter(['meter', 'property', 'id'], 'array', 'string', 'in')
    const addressStringContainsFilter = getStringContainsFilter(['meter', 'property', 'address'])
    const accountNumberFilter = getStringContainsFilter(['meter', 'accountNumber'])
    const placeFilter = getStringContainsFilter(['meter', 'place'])
    const numberFilter = getStringContainsFilter(['meter', 'number'])
    const resourceStringContainsFilter = getStringContainsFilter(['meter', 'resource', 'name'])
    const clientNameFilter = getStringContainsFilter('clientName')
    const readingDateRangeFilter = getDayRangeFilter('date')
    const verificationDateRangeFilter = getDayRangeFilter(['meter', 'verificationDate'])
    const installationDateRangeFilter = getDayRangeFilter(['meter', 'installationDate'])
    const commissioningDateRangeFilter = getDayRangeFilter(['meter', 'commissioningDate'])
    const sealingDateRangeFilter = getDayRangeFilter(['meter', 'sealingDate'])
    const controlReadingDateRangeFilter = getDayRangeFilter(['meter', 'controlReadingDate'])
    const sourceFilter = getFilter(['source', 'id'], 'array', 'string', 'in')
    const resourceFilter = getFilter(['meter', 'resource', 'id'], 'array', 'string', 'in')

    const { objs: sources } = MeterReadingSource.useObjects({})
    const sourcesOptions = sources.map(source => ({ label: source.name, value: source.id }))

    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})
    const resourcesOptions = resources.map(resource => ({ label: resource.name, value: resource.id }))

    return useMemo(() => {
        return [
            {
                keyword: 'address',
                filters: [addressFilter],
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
                keyword: 'accountNumber',
                filters: [accountNumberFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: EnterAccountNumberMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: AccountNumberMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'clientName',
                filters: [clientNameFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: FullNameMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: ContactMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'resource',
                filters: [resourceFilter],
                component: {
                    type: ComponentType.Select,
                    options: resourcesOptions,
                    props: {
                        loading: resourcesLoading,
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: ChooseServiceMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: ServiceMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'date',
                filters: [readingDateRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: MeterReadingDateMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'number',
                filters: [numberFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: EnterMeterNumberMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: MeterNumberMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'place',
                filters: [placeFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: EnterPlaceMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: PlaceMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'source',
                filters: [sourceFilter],
                component: {
                    type: ComponentType.Select,
                    options: sourcesOptions,
                    props: {
                        mode: 'multiple',
                        placeholder: SelectMessage,
                        showArrow: true,
                    },
                    modalFilterComponentWrapper: {
                        label: SourceMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'verificationDate',
                filters: [verificationDateRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: VerificationDateMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'installationDate',
                filters: [installationDateRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: InstallationDateMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'commissioningDate',
                filters: [commissioningDateRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: CommissioningDateMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'sealingDate',
                filters: [sealingDateRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: SealingDateMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'controlReadingDate',
                filters: [controlReadingDateRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: ControlReadingsDate,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'search',
                filters: [
                    addressStringContainsFilter,
                    resourceStringContainsFilter,
                    placeFilter,
                    numberFilter,
                    clientNameFilter,
                ],
                combineType: 'OR',
            },
        ]
    }, [sources, resources])
}