import React from 'react'

import Select from '@condo/domains/common/components/antd/Select'

export const FloorNameInput = ({ floors, ...restSelectProps }) => {
    const options = [...floors].reverse().map(
        (floor) => (
            <Select.Option
                key={floor.name}
                value={floor.name}
                title={String(floor.name)}
            >
                {floor.name}
            </Select.Option>
        )
    )

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