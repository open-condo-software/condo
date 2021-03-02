import { Select, Input } from 'antd'
import React, { useMemo } from 'react'
import get from 'lodash/get'
import flattenDeep from 'lodash/flattenDeep'
import { useObject } from '../utils/clientSchema/Property'

interface IUnitNameInputProps {
    placeholder: string
    propertyId: string
}

const BaseUnitNameInput:React.FunctionComponent<IUnitNameInputProps> = (props) => {
    const { placeholder, propertyId, ...restInputProps } = props
    const { loading, obj: property } = useObject({ where: { id: propertyId } })

    // TODO(Dimitreee): move search to serverside
    const options = useMemo(() => {
        const sections = get(property, ['map', 'sections'], [])

        const unflattenFlats = sections.map((section) => {
            const floors = get(section, ['floors'], [])

            return floors.map((floor) => floor.units)
        })

        const flattenFlats:Array<{ id:string }> = flattenDeep(unflattenFlats)

        return flattenFlats.map(
            (flat, index) => (
                <Select.Option key={flat.id} value={flat.id} title={String(index)}>{index + 1}</Select.Option>
            )
        )

    }, [property, propertyId])

    return (
        <Select
            allowClear
            showSearch
            placeholder={placeholder}
            optionFilterProp={'title'}
            loading={loading}
            disabled={loading}
            {...restInputProps}
        >
            {options}
        </Select>
    )
}

export const UnitNameInput = (props:IUnitNameInputProps) => {
    const { propertyId, ...restInputProps } = props

    if (!propertyId) {
        return <Input {...restInputProps} disabled value={null}/>
    }

    return <BaseUnitNameInput {...props}/>
}
