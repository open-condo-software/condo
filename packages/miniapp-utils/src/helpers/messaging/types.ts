export type FrameId = string
export type FrameType = HTMLIFrameElement
export type EventType = string
export type EventName = string
export type EventParams = Record<string, unknown>
// TODO: Modify set signature to save persistent data (e.g. progress bars), like set(key, value, { persistent: true })
export type EventTypeStorage = Pick<Map<string, unknown>, 'set' | 'get' | 'has' | 'delete'>
export type DataStorage = Record<EventType, EventTypeStorage>
type ValidationResult<T> =
    | { success: true, data: T, error?: never }
    | { success: false, data?: never, error: string }

export type ParamsValidator<Params extends EventParams> = (params: unknown) => ValidationResult<Params>
export type HandlerResult = Record<string, unknown>
export type Handler<Params extends EventParams, Result extends HandlerResult> = (params: Params, storage: EventTypeStorage, frame?: FrameType) => Result | Promise<Result>
export type HandlerMethods<Params extends EventParams, Result extends HandlerResult> = {
    validator: ParamsValidator<Params>
    handler: Handler<Params, Result>
}
export type HandlerScope = FrameId | '*' | 'parent'
export type AddHandlerType = <Params extends EventParams, Result extends HandlerResult>(
    eventType: EventType,
    eventName: EventName,
    handlerScope: HandlerScope,
    validator: ParamsValidator<Params>,
    handler: Handler<Params, Result>
) => void
export type ControllerState = {
    isBridgeReady: boolean
}