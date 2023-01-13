// TODO(DOMA-5122): Provide documentation
export const ACCESS_DENIED = 'ACCESS_DENIED'
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR'
export const UNKNOWN_METHOD = 'UNKNOWN_METHOD'
export const INVALID_PARAMETERS = 'INVALID_PARAMETERS'
export const HANDLER_ERROR = 'HANDLER_ERROR'
export const TIMEOUT_REACHED = 'TIMEOUT_REACHED'

export const ERROR_REASONS = [ACCESS_DENIED, UNKNOWN_ERROR, UNKNOWN_METHOD, INVALID_PARAMETERS, HANDLER_ERROR, TIMEOUT_REACHED] as const
export type ErrorReason = typeof ERROR_REASONS[number]
export const ERROR_CODES: { [reason in ErrorReason]: number } = {
    ACCESS_DENIED:0,
    UNKNOWN_ERROR: 1,
    UNKNOWN_METHOD: 2,
    INVALID_PARAMETERS: 3,
    HANDLER_ERROR: 4,
    TIMEOUT_REACHED: 5,
} as const

export type ErrorCode<Reason extends ErrorReason> = typeof ERROR_CODES[Reason]