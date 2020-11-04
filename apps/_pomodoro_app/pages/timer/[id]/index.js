import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import io from 'socket.io-client'
// TODO(toplenboren): remove hardcoded ENDPOINT value
const ENDPOINT = 'http://127.0.0.1:3001'

const Timer = () => {
    const [response, setResponse] = useState({})
    const [socket, setSocket] = useState(null)
    const {
        query: { id },
    } = useRouter()

    useEffect(() => {
        const sock = io(ENDPOINT, { query: `timer=${id}` })
        setSocket(sock)

        sock.on('timer', (data) => {
            setResponse(data)
        })

        return () => {
            sock.disconnect()
            setSocket(null)
        }
    }, [])

    if (socket === null) {
        return <p>Connecting...</p>
    }

    return (
        <>
            <p>Last Response: {JSON.stringify(response)}</p>
            <button
                onClick={() => {
                    socket.emit('start')
                }}
            >
                Run Timer
            </button>

            <button
                onClick={() => {
                    socket.emit('pause')
                }}
            >
                Pause Timer
            </button>

            <button
                onClick={() => {
                    socket.emit('clear')
                }}
            >
                Clear Timer
            </button>

            <button
                onClick={() => {
                    socket.emit('check')
                }}
            >
                Check time (check your server logs!)
            </button>
        </>
    )
}

/**
 * An indicator function that tells next not to use static optimization in order to make query populated
 * more: https://nextjs.org/docs/routing/dynamic-routes#caveats
 * @return {Promise<{}>}
 */
export async function getServerSideProps () {
    return { props: {} }
}

export default Timer
