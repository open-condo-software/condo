import { useCallback, useEffect, useRef } from 'react'


type UseBroadcastChannelOptions = {
    sendInCurrentTab?: boolean
}

const DEFAULT_OPTIONS: UseBroadcastChannelOptions = {
    sendInCurrentTab: true,
}

export function useBroadcastChannel<T> (
    channelName: string,
    onMessageReceived: (message: T) => void,
    options: UseBroadcastChannelOptions = DEFAULT_OPTIONS
) {
    const { sendInCurrentTab } = options

    const messageSender = useRef<BroadcastChannel | null>(null)
    const messageReceiver = useRef<BroadcastChannel | null>(null)

    useEffect(() => {
        messageSender.current = new BroadcastChannel(channelName)
        messageReceiver.current = sendInCurrentTab ? new BroadcastChannel(channelName) : messageSender.current

        messageReceiver.current.onmessage = (event) => onMessageReceived(event.data)
    }, [channelName, onMessageReceived, sendInCurrentTab])

    useEffect(() => {
        return () => {
            messageSender.current = null
            messageReceiver.current = null
        }
    }, [])

    const sendMessage = useCallback((message: T) => {
        if (messageSender.current) {
            messageSender.current.postMessage(message)
        }
    }, [messageSender])

    return {
        sendMessage,
    }
}