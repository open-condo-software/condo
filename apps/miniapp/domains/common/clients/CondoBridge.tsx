import { Organization, User } from '@app/condo/schema'
import { useState } from 'react'
import { v4 as uuid } from 'uuid'

const parentType = typeof parent

interface CondoBridge {
    getOrganization: () => Promise<Organization>,
    useOrganization: () => { result: Organization | null, isLoading: boolean },
    useUser: () => { result: User | null, isLoading: boolean },
}

interface CondoBridgeOptions {
    receiverOrigin: string,
    waitTimeout?: number,
}

interface CondoBridgeCommandOptions {
    command: string,
    data?: Record<string, unknown>,
    receiver?: Window,
    receiverOrigin: string,
    waitTimeout?: number,
}

interface ICommandResult<T = any> {
    result: T,
    isLoading: boolean,
}

function sendCommand<T> (options: CondoBridgeCommandOptions): Promise<T> {
    const id = uuid()
    let timeout = null
    const { command, data = {}, receiver = parent, receiverOrigin, waitTimeout = 30000 } = options

    return new Promise<T>((resolve, reject) => {
        const answerHandler = (event) => {
            if (event.origin !== receiverOrigin) {
                return
            }

            const { id: answerId, data: answerData } = event.data

            if (id !== answerId) {
                return
            }

            clearTimeout(timeout)
            window.removeEventListener('message', answerHandler)

            console.debug(`Received data ${id}`, answerData)
            resolve(answerData as T)
        }

        window.addEventListener('message', answerHandler, false)
        console.debug(`Send command ${id}`, options)
        //todo: maybe move `command` type to some constant or import `COMMAND_MESSAGE_TYPE` from `iframe.utils`
        receiver.postMessage({ type: 'command', id, command, data }, receiverOrigin)

        if (waitTimeout) {
            timeout = setTimeout(() => {
                console.error(`Command '${command}' timeout`)
                reject(new Error(`Command '${command}' timeout`))
            }, waitTimeout)
        }
    })
}

const useCommand = function <T = any> (options: CondoBridgeCommandOptions): ICommandResult<T> {
    const [result, setResult] = useState<T>(undefined)
    const [isLoading, setIsLoading] = useState(false)

    if (parentType !== 'undefined' && !isLoading && !result) {
        setIsLoading(true)
        sendCommand<T>(options)
            .then((data) => {
                setResult(data)
            })
            .catch((err) => {
                setResult(null)
                console.error(err)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }

    return { result, isLoading }
}

export function createCondoBridge (options: CondoBridgeOptions): CondoBridge {
    const getOrganization = (): Promise<Organization> => {
        if (parentType !== 'undefined') {
            return sendCommand<Organization>({
                command: 'getOrganization',
                receiver: parent,
                receiverOrigin: options.receiverOrigin,
            })
        }
    }

    const useOrganization = (): ICommandResult<Organization> => {
        return useCommand<Organization>({
            command: 'getOrganization',
            receiverOrigin: options.receiverOrigin,
        })
    }

    //todo (AleX83Xpert): wrap calling of useCommand
    const useUser = (): ICommandResult<User> => {
        return useCommand<User>({
            command: 'getUser',
            receiverOrigin: options.receiverOrigin,
        })
    }

    return {
        getOrganization, useOrganization,
        useUser,
    }
}
