import React, { useEffect, useState } from 'react'

type SizeType = { width: number, height: number }

export const useContainerSize = (ref: React.MutableRefObject<HTMLElement | null>): SizeType => {
    const [size, setSize] = useState<SizeType>({ width: 1200, height: 1000 })
    useEffect(() => {
        if (!ref || !ref.current) return
        setSize({ width: ref.current.offsetWidth, height: ref.current.offsetHeight })
        const observer = new ResizeObserver((entries) => {
            if (entries.length == 1) {
                const entry = entries[0]
                setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
            }
        })
        observer.observe(ref.current)
        return () => observer.disconnect()
    }, [ref])

    return size
}