import { useMemo } from 'react'
import { ComponentType, convertToOptions, FilterComponentSize, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { BillingIntegrationOrganizationContext, BillingReceiptWhereInput } from '@app/condo/schema'
import { getFilter, getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'
import get from 'lodash/get'
import { useIntl } from '@open-condo/next/intl'
import { BillingCategory } from '../utils/clientSchema'
import { BillingCategory as BillingCategoryType } from '@app/condo/schema'


const addressFilter = getStringContainsFilter(['property', 'address'])
const unitNameFilter = getStringContainsFilter(['account', 'unitName'])
const accountFilter = getStringContainsFilter(['account', 'number'])
const fullNameFilter = getStringContainsFilter(['account', 'fullName'])
const categoryFilter = getFilter(['category', 'id'], 'array', 'string', 'in')
const periodFilter = (period: string) => ({ period })

export function useReceiptTableFilters (context: BillingIntegrationOrganizationContext): Array<FiltersMeta<BillingReceiptWhereInput>>  {
    const intl = useIntl()
    const contextPeriod = get(context, ['lastReport', 'period'], null)
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const StatusMessage =  intl.formatMessage({ id: 'Status' })
    
    const { objs: categories } = BillingCategory.useObjects({})
    const categoryOptions = useMemo(() => convertToOptions<BillingCategoryType>(categories, 'name', 'id'), [categories])
    return useMemo(()=>{
        return [
            { keyword: 'period', filters: [periodFilter], defaultValue: contextPeriod },
            { keyword: 'search', filters: [addressFilter, unitNameFilter, accountFilter, fullNameFilter], combineType: 'OR' },
            { keyword: 'address', filters: [addressFilter] },
            { keyword: 'unitName', filters: [unitNameFilter] },
            { keyword: 'account', filters: [accountFilter] },
            { keyword: 'fullName', filters: [fullNameFilter] },
            {
                keyword: 'category',
                filters: [categoryFilter],
                component: {
                    type: ComponentType.Select,
                    options: categoryOptions,
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
        ]
    }, [SelectMessage, StatusMessage, categoryOptions, contextPeriod])
  
}
