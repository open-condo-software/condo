export type FrameId = string
export type FrameType = HTMLIFrameElement
export type WorkerType = ServiceWorker
export type RegisteredFrame = {
    ref: FrameType
    metadata?: SourceMetadata
}
export type EventType = string
export type EventName = string
export type EventParams = Record<string, unknown>
export type SourceMetadata = Record<string, unknown>
// TODO: Modify set signature to save persistent data (e.g. progress bars), like set(key, value, { persistent: true })
export type EventTypeStorage = Pick<Map<string, unknown>, 'set' | 'get' | 'has' | 'delete'>
export type DataStorage = Record<EventType, EventTypeStorage>
type ValidationResult<T> =
    | { success: true, data: T, error?: never }
    | { success: false, data?: never, error: string }
export type FrameSource = {
    ref: FrameType
    id: FrameId
    type: 'frame'
    metadata?: SourceMetadata
}
export type WindowSource = {
    ref: Window
    id: 'parent'
    type: 'window'
}
export type WorkerSource = {
    ref: WorkerType
    id: 'worker'
    type: 'worker'
}
export type MessageSource = FrameSource | WindowSource | WorkerSource

export type ParamsValidator<Params extends EventParams> = (params: unknown) => ValidationResult<Params>
export type HandlerResult = Record<string, unknown>
export type HandlerArgs<Params extends EventParams> = {
    source: MessageSource
    storage: {
        events: EventTypeStorage
    }
    params: Params
    eventName: EventName
    eventType: EventType
}
export type Handler<Params extends EventParams, Result extends HandlerResult> = (args: HandlerArgs<Params>) => Result | Promise<Result>
export type HandlerMethods<Params extends EventParams, Result extends HandlerResult> = {
    validator: ParamsValidator<Params>
    handler: Handler<Params, Result>
}
export type HandlerScope = MessageSource['id'] | '*'
export type AddHandlerType = <Params extends EventParams, Result extends HandlerResult>(
    eventType: EventType,
    eventName: EventName,
    handlerScope: HandlerScope,
    validator: ParamsValidator<Params>,
    handler: Handler<Params, Result>
) => void
export type MiddlewareArgs<Params extends EventParams, Result extends HandlerResult> = HandlerArgs<Params> & {
    next: Handler<Params, Result>
}
export type MiddlewareFn<Params extends EventParams, Result extends HandlerResult> = (args: MiddlewareArgs<Params, Result>) => Result | Promise<Result>
export type MiddlewareId = string
export type RegisteredMiddleware<Params extends EventParams, Result extends HandlerResult> = {
    id: MiddlewareId
    eventType?: EventType
    eventName?: EventName
    scope: HandlerScope
    order?: number
    fn: MiddlewareFn<Params, Result>
}
export type Middleware<Params extends EventParams, Result extends HandlerResult> = Omit<RegisteredMiddleware<Params, Result>, 'id'>
export type ControllerState = {
    isBridgeReady: boolean
}