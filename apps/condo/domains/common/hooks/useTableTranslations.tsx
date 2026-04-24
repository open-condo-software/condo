import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

export const useTableTranslations = () => {
    const intl = useIntl()

    const menuLabels = useMemo(() => ({
        sortDescLabel: intl.formatMessage({ id: 'Table.Sort' }),
        sortAscLabel: intl.formatMessage({ id: 'Table.Sort' }),
        filterLabel: intl.formatMessage({ id: 'Table.Filter' }),
        settingsLabel: intl.formatMessage({ id: 'Table.Settings' }),
        sortedDescLabel: intl.formatMessage({ id: 'Table.Sorted' }),
        sortedAscLabel: intl.formatMessage({ id: 'Table.Sorted' }),
        filteredLabel: intl.formatMessage({ id: 'Table.Filtered' }),
        noDataLabel: intl.formatMessage({ id: 'Table.NoData' }),
        defaultSettingsLabel: intl.formatMessage({ id: 'Table.DefaultSettingsLabel' }),
        resetFilterLabel: intl.formatMessage({ id: 'Table.ResetFilter' }),
    }), [intl])

    return menuLabels
}