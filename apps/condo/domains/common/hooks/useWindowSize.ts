import { useState, useEffect } from 'react'

type SizeType = {
    width: number | undefined,
    height: number | undefined,
}

export const useWindowSize: () => SizeType = () => {
    const [windowSize, setWindowSize] = useState<SizeType>({
        width: undefined,
        height: undefined,
    })

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize =  () => {
                setWindowSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                })
            }

            window.addEventListener('resize', handleResize)

            handleResize()

            return () => window.removeEventListener('resize', handleResize)
        }
    }, [])
    return windowSize
}