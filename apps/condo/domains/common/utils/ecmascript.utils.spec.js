/* eslint  @typescript-eslint/no-empty-function: 0 */

import { isAsyncFunction, isFunction } from './ecmascript.utils'

describe('Function objects', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    const functionExpression = () => {}
    const functionStatementExpression = function () {}
    const asyncFunctionExpression = async () => {}
    const asyncFunctionStatementExpression = async function () {}

    function functionDefinition () {}

    async function asyncFunctionDefinition () {}

    function * generator () {}

    async function * asyncGenerator () {}

    test.skip('isFunction()', () => {
        expect(isFunction(functionDefinition)).toBeTruthy()
        expect(isFunction(asyncFunctionDefinition)).toBeFalsy() // depends on node version
        expect(isFunction(functionExpression)).toBeTruthy()
        expect(isFunction(asyncFunctionExpression)).toBeFalsy()
        expect(isFunction(functionStatementExpression)).toBeTruthy()
        expect(isFunction(asyncFunctionStatementExpression)).toBeFalsy() // depends on node version
        expect(isFunction(generator)).toBeFalsy() // should we change it ?
        expect(isFunction(asyncGenerator)).toBeFalsy() // should we change it ?
        expect(isFunction({})).toBeFalsy()
        expect(isFunction(null)).toBeFalsy()
        expect(isFunction()).toBeFalsy()
    })

    test.skip('isAsyncFunction()', () => {
        expect(isAsyncFunction(functionDefinition)).toBeFalsy()
        expect(isAsyncFunction(asyncFunctionDefinition)).toBeTruthy() // depends on node version
        expect(isAsyncFunction(functionExpression)).toBeFalsy()
        expect(isAsyncFunction(asyncFunctionExpression)).toBeTruthy()
        expect(isAsyncFunction(functionStatementExpression)).toBeFalsy()
        expect(isAsyncFunction(asyncFunctionStatementExpression)).toBeTruthy() // depends on node version
        expect(isAsyncFunction(generator)).toBeFalsy()
        expect(isAsyncFunction(asyncGenerator)).toBeFalsy()
        expect(isAsyncFunction({})).toBeFalsy()
        expect(isAsyncFunction(null)).toBeFalsy()
        expect(isAsyncFunction()).toBeFalsy()
    })
})
