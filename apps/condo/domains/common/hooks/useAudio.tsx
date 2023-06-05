import getConfig from 'next/config'

const {
    publicRuntimeConfig,
} = getConfig()

const { audioConfig } = publicRuntimeConfig

interface IUseAudio {
    playNewItemsFetchedSound: () => void
}

let newItemsAudio

if (audioConfig.newItemsAudioPath) {
    newItemsAudio = new Audio(audioConfig.newItemsAudioPath)
} else {
    console.warn('Missing or incorrect AUDIO_CONFIG. Notification sounds will not be available')
}

const warnOnMissingAudioConfig = () => {
    console.warn('Could not play sound, because AUDIO_CONFIG is missing or incorrect')
}

export const useAudio = (): IUseAudio => {
    const playNewItemsFetchedSound = () => {
        // TODO(antonal): Find what permissions are not allowing to play audio in script without user action
        // When this function will be called on button click, audio will be played
        // When this function will be called from useEffect, following error occurs:
        // > NotAllowedError: The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.
        newItemsAudio.play()
    }

    return {
        playNewItemsFetchedSound: newItemsAudio ? playNewItemsFetchedSound : warnOnMissingAudioConfig,
    }
}

