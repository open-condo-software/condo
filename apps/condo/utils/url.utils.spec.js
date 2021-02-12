import { getQueryParams } from './url.utils'

describe('getQueryParams()', () => {
    test('with ? case', () => {
        window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password?token=bc55276e&name=Nika')
        expect(getQueryParams()).toEqual({ token: 'bc55276e', name: 'Nika' })
    })

    test('with # case', () => {
        window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password?token=bc55276e&name=Nika#!someval=some2')
        expect(getQueryParams()).toEqual({ token: 'bc55276e', name: 'Nika' })
    })

    test('no ? just # case', () => {
        window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password#!nothing')
        expect(getQueryParams()).toEqual({})
    })

    test('no ? no # case', () => {
        window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password')
        expect(getQueryParams()).toEqual({})
    })
})
