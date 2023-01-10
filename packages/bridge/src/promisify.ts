import type {
    RequestIdType,
    AnyRequestMethodName,
    RequestId,
    RequestParams,
    CondoBridgeSubscriptionListener,
    AnyResponseMethodName,
    ResultResponseData,
} from './types/bridge'

type PromiseController = {
    resolve: (value: any) => unknown
    reject: (reason: unknown) => unknown
}

function createCounter () {
    return {
        current: 0,
        next () {
            return ++this.current
        },
    }
}

function createRequestResolver () {
    const requestIdCounter = createCounter()
    const controllers: Record<RequestIdType, PromiseController | null> = {}

    return {
        add (controller: PromiseController, customId?: RequestIdType): RequestIdType {
            const requestId = customId || requestIdCounter.next()
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
            if (requestId) {
                requestResolver.resolve(requestId, data, (data) => !('errorType' in data))
            }
        }
    })

    return function promisifiedSend<Method extends AnyRequestMethodName> (
        method: Method,
        params: RequestParams<Method> & RequestId = {} as RequestParams<Method> & RequestId
    ): Promise<Method extends AnyResponseMethodName ? ResultResponseData<Method> : void> {
        return new Promise((resolve, reject) => {
            const requestId = requestResolver.add({ resolve, reject }, params.requestId)

            send(method, {
                ...params,
                requestId,
            })
        })
    }
}