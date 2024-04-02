import { FormInstance } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Checkbox } from '@open-condo/ui'

import { parseQuery } from '@condo/domains/common/utils/tables.utils'


type FilterModalCompletedAfterDeadlineType = React.FC<{ form: FormInstance }>

export const FilterModalCompletedAfterDeadline: FilterModalCompletedAfterDeadlineType = ({ form }) => {
    const intl = useIntl()
    const ExpiredTickets = intl.formatMessage({ id: 'pages.condo.ticket.filters.ExpiredTickets' })
    const router = useRouter()

    const [value, setValue] = useState(false)

    useEffect(() => {
        const { filters } = parseQuery(router.query)
        const initialValueFromQuery = get(filters, 'isCompletedAfterDeadline', false) === 'true'
        const initialValueFromForm = form.getFieldValue('isCompletedAfterDeadline') === 'true'

        if (initialValueFromQuery || initialValueFromForm) {
            const initialValue = initialValueFromForm || initialValueFromQuery
            setValue(initialValue)
        }
    }, [form, router.query])

    return (
        <Checkbox
            label={ExpiredTickets}
            checked={value}
            onChange={(event) => {
                const checked = !!get(event, 'target.checked', false)
                form.setFieldsValue({ isCompletedAfterDeadline: checked ? String(checked) : false })
                setValue(checked)
            }}
        />
    )
}
