import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
// TODO(DOMA-4844): Replace with @open-condo/ui/colors
import { Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { APP_FREE_LABEL, APP_DISCOUNT_LABEL, APP_POPULAR_LABEL, APP_NEW_LABEL } from '@condo/domains/miniapp/constants'

import type { B2BAppLabelType } from '@app/condo/schema'


const LABEL_TO_TAG_PROPS = {
    [APP_FREE_LABEL]: { textColor: colors.blue['5'], bgColor: colors.blue['1'] },
    [APP_DISCOUNT_LABEL]: { textColor: colors.red['5'], bgColor: colors.red['1'] },
    [APP_POPULAR_LABEL]: { textColor: colors.green['7'], bgColor: colors.green['1'] },
    [APP_NEW_LABEL]: { textColor: colors.orange['5'], bgColor: colors.orange['1'] },
}

export type AppLabelTagProps = {
    type: B2BAppLabelType
}

export const AppLabelTag: React.FC<AppLabelTagProps> = ({ type }) => {
    const intl = useIntl()
    const AppLabel = intl.formatMessage({ id: `miniapps.labels.${type}.name` as FormatjsIntl.Message['ids'] })

    const tagProps = get(LABEL_TO_TAG_PROPS, type, {})

    return (
        <Tag {...tagProps}>{AppLabel}</Tag>
    )
}
