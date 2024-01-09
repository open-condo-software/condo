import React, { useCallback, useState } from 'react'

type Elements = Array<React.ReactElement>
type Patcher = (el: React.ReactElement) => (() => void)

export function usePatchElement (): [Elements, Patcher] {
    const [elements, setElements] = useState<Elements>([])

    const patchElement = useCallback((el: React.ReactElement) => {
        setElements(prev => [...prev, el])

        return () => {
            setElements(prev => prev.filter(item => item !== el))
        }
    }, [])

    return [elements, patchElement]
}