import { Spin } from 'antd'
import React, { useEffect, useState } from 'react'

import { Select } from '@open-condo/ui'

import type { SelectProps } from 'antd/es/select'

export interface DebounceSelectProps<ValueType = any>
    extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
    fetchOptions: () => Promise<ValueType[]>;
    debounceTimeout?: number;
}

export function AsyncOptionsSelect<
    ValueType extends { key?: string; label: React.ReactNode; value: string | number } = any,
> ({ fetchOptions, debounceTimeout = 800, ...props }: DebounceSelectProps<ValueType>) {
    const [fetching, setFetching] = useState(false)
    const [options, setOptions] = useState<ValueType[]>([])

    useEffect(() => {
        getInitialOptions()
    }, [fetchOptions])

    const getInitialOptions = async () => {
        setOptions([])
        setFetching(true)
        const newOpts = await fetchOptions()
        setOptions(newOpts)
        setFetching(false)
    }

    return (
        <Select
            notFoundContent={fetching ? <Spin size='small' /> : null}
            {...props}
            // @ts-ignore
            options={options}
        />
    )
}
