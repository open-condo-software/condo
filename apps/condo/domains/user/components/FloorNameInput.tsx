import React, { useMemo } from 'react'

import Select from '@condo/domains/common/components/antd/Select'

export const FloorNameInput = ({ floors, ...restSelectProps }) => {
    const options = useMemo(() => ([...floors].reverse().map(
        (floor) => (
            <Select.Option
                key={floor.name}
                value={floor.name}
                title={String(floor.name)}
            >
                {floor.name}
            </Select.Option>
        )
    )), [floors])

    return (
        <Select
            allowClear
            showSearch
            optionFilterProp={'title'}
            {...restSelectProps}
        >
            {options}
        </Select>
    )
}