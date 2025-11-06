export type FrameId = string
export type FrameType = HTMLIFrameElement
export type EventType = string
export type EventName = string
export type EventParams = Record<string, unknown>
type ValidationResult<T> =
    | { success: true, data: T, error?: never }
    | { success: false, data?: never, error: string }

export type ParamsValidator<Params extends EventParams> = (params: unknown) => ValidationResult<Params>
export type HandlerResult = Record<string, unknown>
export type Handler<Params extends EventParams, Result extends HandlerResult> = (params: Params, frame?: FrameType) => Result | Promise<Result>
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