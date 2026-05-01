import { useQuery } from '@apollo/client'
import { gql } from 'graphql-tag'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import Select from '@condo/domains/common/components/antd/Select'


const GET_RENTAL_UNITS_FOR_SELECT_QUERY = gql`
    query getRentalUnitsForSelect ($where: RentalUnitWhereInput) {
        rentalUnits: allRentalUnits(where: $where, sortBy: [name_ASC], first: 200) {
            id
            name
            unitType
            rentable
            capacity
            defaultMonthlyRate
            parent { id name unitType }
        }
    }
`

type RentalUnitSelectProps = {
    propertyId?: string | null
    organizationId?: string | null
    rentableOnly?: boolean
    disabled?: boolean
    value?: string
    placeholder?: string
    onChange?: (value: string, option: unknown) => void
    allowClear?: boolean
}

export const RentalUnitSelect: React.FC<RentalUnitSelectProps> = ({
    propertyId,
    organizationId,
    rentableOnly,
    disabled,
    value,
    placeholder,
    onChange,
    allowClear = true,
}) => {
    const where = useMemo(() => ({
        deletedAt: null,
        ...(propertyId ? { property: { id: propertyId } } : {}),
        ...(organizationId ? { organization: { id: organizationId } } : {}),
        ...(rentableOnly ? { rentable: true } : {}),
    }), [organizationId, propertyId, rentableOnly])

    const { data, loading } = useQuery(GET_RENTAL_UNITS_FOR_SELECT_QUERY, {
        variables: { where },
        skip: !propertyId && !organizationId,
    })

    const options = useMemo(() => {
        return get(data, 'rentalUnits', []).map((unit) => {
            const parentName = get(unit, ['parent', 'name'])
            const label = parentName ? `${parentName} / ${unit.name}` : unit.name

            return {
                key: unit.id,
                value: unit.id,
                label,
                unit,
            }
        })
    }, [data])

    return (
        <Select
            showSearch
            allowClear={allowClear}
            disabled={disabled}
            loading={loading}
            value={value}
            placeholder={placeholder}
            options={options}
            optionFilterProp='label'
            onChange={onChange}
        />
    )
}

export { GET_RENTAL_UNITS_FOR_SELECT_QUERY }
