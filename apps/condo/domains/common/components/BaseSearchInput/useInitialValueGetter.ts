import React, { useEffect, useState } from 'react'

export type InitialValuesGetter = (id: string) => Promise<string>

type UseInitialValueGetter = (value: string, getter?: InitialValuesGetter) => [string, boolean]

export const useInitialValueGetter: UseInitialValueGetter = (value, getter) => {
    const [initialValue, setInitialValue] = useState(value)
    const [isLoading, setLoading] = useState(false)

    const fetchInitialValue = React.useCallback(async () => {
        if (!getter) {
            setInitialValue(value)
            return
        }

        try {
            const initialValue = await getter(value)

            if (initialValue) {
                setInitialValue(initialValue)
            }
        } catch (e) {
            console.warn('error while trying to fetch initial Value for search input: ', e)
        }
    }, [])

    useEffect(() => {
        if (value) {
            setLoading(true)

            fetchInitialValue().then(() => {
                setLoading(false)
            })
        }
    }, [])

    return [initialValue, isLoading]
}
