import { useEffect, useRef } from 'react'


export function useExecuteWithLock (
    lockName: string,
    fn: () => void
) {
    const releaseLockRef = useRef<(value?) => void>()
    const fnRef = useRef(fn)

    useEffect(() => {
        if (typeof window === 'undefined') return

        navigator.locks.request(lockName, () => {
            fnRef.current()

            return new Promise(resolve => {
                releaseLockRef.current = resolve
            })
        })
    }, [lockName])

    // Release lock when tab closes
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (releaseLockRef.current) {
                releaseLockRef.current()
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            if (releaseLockRef.current) {
                return releaseLockRef.current()
            }
        }
    }, [])

    return { releaseLock: releaseLockRef.current }
}