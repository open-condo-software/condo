import type {
    RequestIdType,
    AnyRequestMethodName,
    RequestId,
    RequestParams,
    CondoBridgeSubscriptionListener,
    AnyResponseMethodName,
    ResultResponseData,
    ErrorResponseData,
} from './types/bridge'

const DEFAULT_METHOD_TIMEOUTS: Partial<Record<AnyRequestMethodName, number>> = {
    CondoWebAppRequestAuth: 10_000, // 10 sec
}
const DEFAULT_TIMEOUT_MS = 1_000 // 1 sec

function getNoResponseError (timeout: number): ErrorResponseData {
    return {
        errorType: 'client',
        errorCode: 5,
        errorReason: 'TIMEOUT_REACHED',
        errorMessage: `Request was failed. Response was not received in ${timeout} ms timeout.`,
    }
}

type PromiseController = {
    resolve: (value: any) => unknown
    reject: (reason: unknown) => unknown
}

function* createCounter (): Generator<number, number> {
    let counter = 0
    while (true) {
        yield counter++
    }
}

function createRequestResolver () {
    const requestIdCounter = createCounter()
    const controllers: Record<RequestIdType, PromiseController> = {}

    return {
        add (controller: PromiseController, customId?: RequestIdType): RequestIdType {
            const requestId = customId || requestIdCounter.next().value
            controllers[requestId] = controller

            return requestId
        },

        resolve<T>(requestId: RequestIdType, data: T, isSuccess: (data: T) => boolean) {
            const controller = controllers[requestId]

            if (controller) {
                if (isSuccess(data)) {
                    controller.resolve(data)
                } else {
                    controller.reject(data)
                }
                delete controllers[requestId]
            }
        },
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function promisifySend (
    send: <Method extends AnyRequestMethodName>(method: Method, params?: RequestParams<Method> & RequestId) => void,
    subscribe: (listener: CondoBridgeSubscriptionListener) => void
) {
    const requestResolver = createRequestResolver()

    subscribe((event) => {
        if (!event || !event.data || typeof event.data !== 'object') {
            return
        }

        if ('requestId' in event.data) {
            const { requestId, ...data } = event.data
            if (typeof requestId !== 'undefined') {
                requestResolver.resolve(requestId, data, (data) => !('errorType' in data))
            }
        }
    })

    return function promisifiedSend<Method extends AnyRequestMethodName> (
        method: Method,
        params: RequestParams<Method> & RequestId = {} as RequestParams<Method> & RequestId,
        timeout?: number
    ): Promise<Method extends AnyResponseMethodName ? ResultResponseData<Method> : void> {
        const timeoutInMs = timeout || DEFAULT_METHOD_TIMEOUTS[method] || DEFAULT_TIMEOUT_MS

        return Promise.race([
            new Promise<Method extends AnyResponseMethodName ? ResultResponseData<Method> : void>((resolve, reject) => {
                const requestId = requestResolver.add({ resolve, reject }, params.requestId)

                send(method, {
                    ...params,
                    requestId,
                })
            }),
            new Promise<Method extends AnyResponseMethodName ? ResultResponseData<Method> : void>((_, reject) => {
                setTimeout(() => reject(getNoResponseError(timeoutInMs)), timeoutInMs)
            }),
        ])
    }
}