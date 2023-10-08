import React, { useEffect, useState } from 'react'

type SizeType = { width: number, height: number }
type HookReturnType<K> = [SizeType, React.Dispatch<React.SetStateAction<K>>]

export function useContainerSize<K extends HTMLElement> (): HookReturnType<K> {
    const [size, setSize] = useState<SizeType>({ width: 1200, height: 1000 })
    const [refElement, setRefElement] = useState<K>(null)
    useEffect(() => {
        if (!refElement) return
        setSize({ width: refElement.offsetWidth, height: refElement.offsetHeight })
        const observer = new ResizeObserver((entries) => {
            if (entries.length == 1) {
                const entry = entries[0]
                setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
            }
        })
        observer.observe(refElement)
        return () => {
            observer.unobserve(refElement)
        }
    }, [refElement])

    return [size, setRefElement]
}