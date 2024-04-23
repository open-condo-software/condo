import React, { createContext, useContext, useEffect, useRef } from 'react'


type RefetchContextType = {
    broadcast,
    messageReceiver
}

const BroadcastContext = createContext<RefetchContextType>({
    broadcast: {},
    messageReceiver: {},
})

export const useBroadcastContext = () => useContext<RefetchContextType>(BroadcastContext)

export const BroadcastContextProvider: React.FC = ({ children }) => {
    const broadcast = useRef<BroadcastChannel | null>(null)
    const messageReceiver = useRef<BroadcastChannel | null>(null)

    console.log(broadcast, messageReceiver)

    useEffect(() => {
        broadcast.current = new BroadcastChannel('channel')
        messageReceiver.current = new BroadcastChannel('channel')

        // Receiving messages
        messageReceiver.current.onmessage = (event) => {
            console.log(event.data) // Outputs: Hello, World!
        }

        // Cleanup function
        return () => {
            // Close the broadcast when component unmounts
            if (broadcast.current) {
                broadcast.current.close()
            }
            if (messageReceiver.current) {
                messageReceiver.current.close()
            }
        }
    }, [])

    return (
        <BroadcastContext.Provider value={{ broadcast: broadcast.current, messageReceiver: messageReceiver.current }}>
            {children}
        </BroadcastContext.Provider>
    )
}