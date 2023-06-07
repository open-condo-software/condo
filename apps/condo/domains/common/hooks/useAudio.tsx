import getConfig from 'next/config'
import { useEffect, useRef } from 'react'

const {
    publicRuntimeConfig,
} = getConfig()

const { audioConfig } = publicRuntimeConfig

interface IUseAudio {
    playNewItemsFetchedSound: () => void
}

let newItemsAudio
if (typeof window !== 'undefined') {
    if (audioConfig.newItemsAudioPath) {
        newItemsAudio = new Audio(audioConfig.newItemsAudioPath)
    } else {
        console.warn('Missing or incorrect AUDIO_CONFIG. Notification sounds will not be available')
    }
}

const warnOnMissingAudioConfig = () => {
    console.warn('Could not play sound, because AUDIO_CONFIG is missing or incorrect')
}

export const useAudio = (): IUseAudio => {
    const isTabTouched = useRef(false)

    const playNewItemsFetchedSound = () => {
        // TODO(antonal): Find what permissions are not allowing to play audio in script without user action
        // When this function will be called on button click, audio will be played
        // When this function will be called from useEffect, following error occurs:
        // > NotAllowedError: The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.
        if (isTabTouched.current) {
            newItemsAudio.play()
        }
    }

    useEffect(() => {
        const onPageFocusChange = () => { isTabTouched.current = true }

        if (typeof window !== 'undefined') {
            window.addEventListener('focus', onPageFocusChange)
        }

        return () => {
            window.removeEventListener('focus', onPageFocusChange)
        }
    }, [])

    return {
        playNewItemsFetchedSound: newItemsAudio ? playNewItemsFetchedSound : warnOnMissingAudioConfig,
    }
}
