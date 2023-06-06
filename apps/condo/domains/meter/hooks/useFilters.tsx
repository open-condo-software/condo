import { MeterReadingWhereInput, MeterReadingSource as MeterReadingSourceType, MeterResource as MeterResourceType } from '@app/condo/schema'
import compact from 'lodash/compact'
import get from 'lodash/get'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import {
    ComponentType,
    convertToOptions,
    FilterComponentSize,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import {
    getDayRangeFilter, getFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'
import { METER_TYPES, MeterReadingSource, MeterResource, MeterTypes } from '@condo/domains/meter/utils/clientSchema'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'


const addressFilter = getFilter(['meter', 'property', 'id'], 'array', 'string', 'in')
const addressStringContainsFilter = getStringContainsFilter(['meter', 'property', 'address'])
const accountNumberFilter = getStringContainsFilter(['meter', 'accountNumber'])
const placeFilter = getStringContainsFilter(['meter', 'place'])
const numberFilter = getStringContainsFilter(['meter', 'number'])
const unitNameFilter = getFilter(['meter', 'unitName'], 'array', 'string', 'in')
const unitNameStringContainsFilter = getStringContainsFilter(['meter', 'unitName'])
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

export function useFilters (meterType: MeterTypes): Array<FiltersMeta<MeterReadingWhereInput>>  {
    const intl = useIntl()
    const EnterAddressMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterAddress' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const EnterAccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterAccountNumber' })
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.Account' })
    const FullNameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const ContactMessage = intl.formatMessage({ id: 'Contact' })
    const ChooseServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.ChooseService' })
    const ServiceMessage = intl.formatMessage({ id: 'pages.condo.meter.Resource' })
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
    const EnterUnitNameLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterUnitName' })
    const UnitMessage = intl.formatMessage({ id: 'field.FlatNumber' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const { objs: sources } = MeterReadingSource.useObjects({})
    const sourcesOptions = convertToOptions<MeterReadingSourceType>(sources, 'name', 'id')

    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})
    const resourcesOptions = convertToOptions<MeterResourceType>(resources, 'name', 'id')

    const isPropertyMeter = meterType === METER_TYPES.propertyMeter

    return useMemo(() => {
        return compact([
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
            isPropertyMeter ? undefined : {
                keyword: 'unitName',
                filters: [unitNameFilter],
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
            isPropertyMeter ? undefined : {
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
            isPropertyMeter ? undefined : {
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
            isPropertyMeter ? undefined : {
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
                filters: compact([
                    addressStringContainsFilter,
                    resourceStringContainsFilter,
                    numberFilter,
                    isPropertyMeter ? undefined : placeFilter,
                    isPropertyMeter ? undefined : clientNameFilter,
                    isPropertyMeter ? undefined : unitNameStringContainsFilter,
                    isPropertyMeter ? undefined : accountNumberFilter,
                ]),
                combineType: 'OR',
            },
        ])
    }, [sources, resources])
}