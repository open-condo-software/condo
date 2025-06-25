import { FilterValue } from 'antd/es/table/interface'
import React from 'react'
import { IntlShape } from 'react-intl/src/types'

import { Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { PAYMENTS_FILE_NEW_STATUS } from '@condo/domains/acquiring/constants/constants'
import { RenderReturnType } from '@condo/domains/common/components/Table/Renders'

export const getPaymentsFileStatusRender = (intl: IntlShape, search?: FilterValue | string) => {
    return function render (statusType: string): RenderReturnType {
        const nameStatus = intl.formatMessage({ id: `accrualsAndPayments.payments.type.registry.status.${statusType}` as FormatjsIntl.Message['ids'] })
        return (
            <Tag
                bgColor={ statusType === PAYMENTS_FILE_NEW_STATUS ? colors.blue[5] : colors.gray[7]}
                textColor={colors.white}
            >
                {nameStatus}
            </Tag>
        )
    }
}