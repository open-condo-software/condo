import { MeterReadingWhereInput } from '@app/condo/schema'
import compact from 'lodash/compact'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { getDateRangeFilterDropdown } from '@condo/domains/common/components/Table/Filters'
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
import { MeterReadingDatePicker } from '@condo/domains/meter/components/MeterReadingDatePicker'
import { MeterReadingSource, MeterResource, MeterTypes, METER_TYPES } from '@condo/domains/meter/utils/clientSchema'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'


const addressFilter = getFilter(['meter', 'property', 'id'], 'array', 'string', 'in')
const addressStringContainsFilter = getStringContainsFilter(['meter', 'property', 'address'])
const accountNumberFilter = getStringContainsFilter(['accountNumber'])
const placeStringFilter = getStringContainsFilter(['meter', 'place'])
const numberFilter = getStringContainsFilter(['meter', 'number'])
const unitNameFilter = getFilter(['meter', 'unitName'], 'array', 'string', 'in')
const unitNameStringContainsFilter = getStringContainsFilter(['meter', 'unitName'])
const resourceStringContainsFilter = getStringContainsFilter(['meter', 'resource', 'name'])
const clientNameFilter = getStringContainsFilter('clientName')
const createdAtDateRangeFilter = getDayRangeFilter('createdAt')
const readingDateRangeFilter = getDayRangeFilter('date')
const nextVerificationDateRangeFilter = getDayRangeFilter(['meter', 'nextVerificationDate'])
const installationDateRangeFilter = getDayRangeFilter(['meter', 'installationDate'])
const archiveDateRangeFilter = getDayRangeFilter(['meter', 'archiveDate'])
const commissioningDateRangeFilter = getDayRangeFilter(['meter', 'commissioningDate'])
const sealingDateRangeFilter = getDayRangeFilter(['meter', 'sealingDate'])
const controlReadingsDateRangeFilter = getDayRangeFilter(['meter', 'controlReadingsDate'])
const sourceFilter = getFilter(['source', 'id'], 'array', 'string', 'in')
const resourceStringFilter = getFilter(['meter', 'resource', 'id'], 'array', 'string', 'in')

export function useMeterReadingFilters (meterType: MeterTypes): Array<FiltersMeta<MeterReadingWhereInput>>  {
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
    const ArchiveDate = intl.formatMessage({ id: 'pages.condo.meter.ArchiveDate' })
    const EnterUnitNameLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterUnitName' })
    const UnitMessage = intl.formatMessage({ id: 'field.FlatNumber' })
    const AddedDateMessage = intl.formatMessage({ id: 'AddedDate' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const { objs: sources } = MeterReadingSource.useObjects({})
    const sourcesOptions = convertToOptions(sources, 'name', 'id')

    const { objs: meterResources, loading: meterResourcesLoading } = MeterResource.useObjects({})
    const meterResourcesOptions = convertToOptions(meterResources, 'name', 'id')

    const isPropertyMeter = meterType === METER_TYPES.property

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
            isPropertyMeter ? null : {
                keyword: 'unitName',
                filters: [unitNameFilter],
                component: {
                    type: ComponentType.TagsSelect,
                    props: {
                        placeholder: EnterUnitNameLabel,
                    },
                    modalFilterComponentWrapper: {
                        label: UnitMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            isPropertyMeter ? null : {
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
            isPropertyMeter ? null : {
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
            isPropertyMeter ? null : {
                keyword: 'place',
                filters: [placeStringFilter],
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
                keyword: 'resource',
                filters: [resourceStringFilter],
                component: {
                    type: ComponentType.Select,
                    options: meterResourcesOptions,
                    props: {
                        loading: meterResourcesLoading,
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
            isPropertyMeter ? null : {
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
                keyword: 'createdAt',
                filters: [createdAtDateRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: AddedDateMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'date',
                filters: [readingDateRangeFilter],
                component: {
                    type: ComponentType.Custom,
                    modalFilterComponent: (form) => <MeterReadingDatePicker filtersModalForm={form} />,
                    modalFilterComponentWrapper: {
                        label: MeterReadingDateMessage,
                        size: FilterComponentSize.Medium,
                    },
                    getComponentFilterDropdown: getDateRangeFilterDropdown({
                        Component: MeterReadingDatePicker,
                    }),
                },
            },
            {
                keyword: 'nextVerificationDate',
                filters: [nextVerificationDateRangeFilter],
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
                keyword: 'controlReadingsDate',
                filters: [controlReadingsDateRangeFilter],
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
                keyword: 'archiveDate',
                filters: [archiveDateRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: ArchiveDate,
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
                    !isPropertyMeter && placeStringFilter,
                    !isPropertyMeter && unitNameStringContainsFilter,
                    !isPropertyMeter && accountNumberFilter,
                ]),
                combineType: 'OR',
            },
        ])
        

    }, [userOrganizationId, EnterAddressMessage, AddressMessage, isPropertyMeter, EnterUnitNameLabel, UnitMessage, EnterAccountNumberMessage, AccountNumberMessage, FullNameMessage, ContactMessage, meterResourcesOptions, meterResourcesLoading, ChooseServiceMessage, ServiceMessage, sourcesOptions, SelectMessage, SourceMessage, EnterMeterNumberMessage, MeterNumberMessage, StartDateMessage, EndDateMessage, AddedDateMessage, MeterReadingDateMessage, EnterPlaceMessage, PlaceMessage, VerificationDateMessage, InstallationDateMessage, CommissioningDateMessage, SealingDateMessage, ControlReadingsDate, ArchiveDate])
}
