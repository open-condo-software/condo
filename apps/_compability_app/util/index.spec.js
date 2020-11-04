import { flatten } from './index'

describe('utils', function () {
    describe('flatten', () => {
        it('should correctly flatten an object', () => {
            const mock_object = {
                foo: {
                    bar: {
                        baz: 'fiz',
                    },
                },
            }

            expect(flatten(mock_object)).toStrictEqual({ 'foo.bar.baz': 'fiz' })
        })

        it('should correctly flatten an object with nested array', () => {
            const mock_object = {
                foo: {
                    bar: {
                        baz: ['fiz', 'fuz', 'faz'],
                    },
                },
            }

            expect(flatten(mock_object)).toStrictEqual({
                'foo.bar.baz.0': 'fiz',
                'foo.bar.baz.1': 'fuz',
                'foo.bar.baz.2': 'faz',
            })
        })

        it('should skip works correctly with empty object', () => {
            expect(flatten({})).toStrictEqual({})
        })
    })
})
