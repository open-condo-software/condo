import { isAsyncFunction, isFunction } from './ecmascript.utils'

describe('Function objects', () => {
    const functionExpression = () => {}
    const functionStatementExpression = function () {}
    const asyncFunctionExpression = async () => {}
    const asyncFunctionStatementExpression = async function () {}

    function functionDefinition () {}

    async function asyncFunctionDefinition () {}

    function * generator () {}

    async function * asyncGenerator () {}

    test('isFunction()', () => {
        expect(isFunction(functionDefinition)).toBeTruthy()
        expect(isFunction(asyncFunctionDefinition)).toBeFalsy()
        expect(isFunction(functionExpression)).toBeTruthy()
        expect(isFunction(asyncFunctionExpression)).toBeFalsy()
        expect(isFunction(functionStatementExpression)).toBeTruthy()
        expect(isFunction(asyncFunctionStatementExpression)).toBeFalsy()
        expect(isFunction(generator)).toBeFalsy() // should we change it ?
        expect(isFunction(asyncGenerator)).toBeFalsy() // should we change it ?
        expect(isFunction({})).toBeFalsy()
        expect(isFunction(null)).toBeFalsy()
        expect(isFunction()).toBeFalsy()
    })

    test('isAsyncFunction()', () => {
        expect(isAsyncFunction(functionDefinition)).toBeFalsy()
        expect(isAsyncFunction(asyncFunctionDefinition)).toBeTruthy()
        expect(isAsyncFunction(functionExpression)).toBeFalsy()
        expect(isAsyncFunction(asyncFunctionExpression)).toBeTruthy()
        expect(isAsyncFunction(functionStatementExpression)).toBeFalsy()
        expect(isAsyncFunction(asyncFunctionStatementExpression)).toBeTruthy()
        expect(isAsyncFunction(generator)).toBeFalsy()
        expect(isAsyncFunction(asyncGenerator)).toBeFalsy()
        expect(isAsyncFunction({})).toBeFalsy()
        expect(isAsyncFunction(null)).toBeFalsy()
        expect(isAsyncFunction()).toBeFalsy()
    })
})
