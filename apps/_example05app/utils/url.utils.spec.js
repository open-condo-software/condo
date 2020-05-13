import { getQueryParams } from './url.utils'

test('getQueryParams()', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password?token=bc55276e&name=Nika');
    expect(getQueryParams()).toEqual({ token: 'bc55276e', name: 'Nika' })
})

test('getQueryParams() check url with #', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password?token=bc55276e&name=Nika#!someval=some2');
    expect(getQueryParams()).toEqual({ token: 'bc55276e', name: 'Nika' })
})

test('getQueryParams() check no params', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password#!nothing');
    expect(getQueryParams()).toEqual({ })
})

test('getQueryParams() check no params', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/auth/change-password');
    expect(getQueryParams()).toEqual({ })
})
