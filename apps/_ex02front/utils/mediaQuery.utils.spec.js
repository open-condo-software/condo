import { getScreenClassName } from './mediaQuery.utils'

test('getScreenClassName()', () => {
    expect(getScreenClassName()).toEqual('md')
})
