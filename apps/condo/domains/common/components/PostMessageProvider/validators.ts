import type { RequestParamValidator, AllRequestMethods } from './types'
import Ajv from 'ajv'

const ajv = new Ajv()

const CondoWebAppResizeWindowParamsSchema = {
    type: 'object',
    properties: {
        height: { type: 'number' },
    },
    required: ['height'],
    additionalProperties: false,
}

export type ValidatorsType = { [Method in AllRequestMethods]: RequestParamValidator<Method> }

export const validators: ValidatorsType = {
    CondoWebAppResizeWindow: ajv.compile(CondoWebAppResizeWindowParamsSchema),
}