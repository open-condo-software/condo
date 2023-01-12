import type { RequestParamValidator, AllRequestMethods, RequestParams } from './types'
import Ajv, { JSONSchemaType } from 'ajv'

const ajv = new Ajv()

const CondoWebAppResizeWindowParamsSchema: JSONSchemaType<RequestParams<'CondoWebAppResizeWindow'>> = {
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