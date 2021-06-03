const { quickSort } = require('./sort')

describe('Custom quick sort', () => {
    describe('should sort ascend', () => {
        it('without predicate', () => {
            const arr = [4, 2, 3, 4, 4, 2, 1, 4, 5, 7]

            quickSort(arr, 0, arr.length - 1, arr.length, true)

            expect(arr).toEqual([1, 2, 2, 3, 4, 4, 4, 4, 5, 7])
        })

        it('with predicate', () => {
            const arr = [{ value: 4 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 4 }, { value: 2 }, { value: 1 }, { value: 4 }, { value: 5 }, { value: 7 }]

            quickSort(arr, 0, arr.length - 1, arr.length, true, ({ value }) => value)

            expect(arr).toEqual([{ value: 1 }, { value: 2 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 4 }, { value: 4 }, { value: 4 }, { value: 5 }, { value: 7 }])
        })
    })

    describe('should sort descend', () => {
        it('without predicate', () => {
            const arr = [4, 2, 3, 4, 4, 2, 1, 4, 5, 7]

            quickSort(arr, 0, arr.length - 1, arr.length, false)

            expect(arr).toEqual([7, 5, 4, 4, 4, 4, 3, 2, 2, 1])
        })

        it('with predicate', () => {
            const arr = [{ value: 4 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 4 }, { value: 2 }, { value: 1 }, { value: 4 }, { value: 5 }, { value: 7 }]

            quickSort(arr, 0, arr.length - 1, arr.length, false, ({ value }) => value)

            expect(arr).toEqual([{ value: 7 }, { value: 5 }, { value: 4 }, { value: 4 }, { value: 4 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 2 }, { value: 1 }])
        })

    })
})
