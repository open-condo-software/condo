import { getPossibleStatuses } from './status'

describe('status', () => {
    describe('getPossibleStatuses', () => {
        describe('should return correct statuses collection', () => {
            it('if transitionsFromEmployee and transitionsFromOrganization is valid', () => {
                expect(getPossibleStatuses([{ id: '1' }, { id: '3' }], '1', { '1': ['3'] }, { '1': ['3'] })).toStrictEqual([
                    { id: '3' },
                ])
            })
        })

        describe('should return an empty statuses collection', () => {
            describe('if transitionsFromOrganization', () => {
                it('is not defined', () => {
                    expect(getPossibleStatuses([], '1')).toStrictEqual([])
                })

                it('has an empty Intersection rules for status id', () => {
                    expect(getPossibleStatuses([{ id: '1' }], '1', { '1': [] })).toStrictEqual([])
                })

                it('has no Intersection rules for status id', () => {
                    expect(getPossibleStatuses([{ id: '1' }], '1', { '2': [] })).toStrictEqual([])
                })
            })

            it('if intersections is XOR ', () => {
                expect(getPossibleStatuses([{ id: '1' }, { id: '3' }], '1', { '1': ['3'] }, { '1': ['2'] })).toStrictEqual([])

                expect(getPossibleStatuses([{ id: '1' }, { id: '3' }], '1', { '1': ['2'] }, { '2': ['2'] })).toStrictEqual([])

                expect(getPossibleStatuses([{ id: '1' }, { id: '3' }], '1', { '1': ['2'] }, { '1': [] })).toStrictEqual([])

                expect(getPossibleStatuses([{ id: '1' }, { id: '3' }], '1', { '1': [] }, { '1': ['2'] })).toStrictEqual([])
            })

            it('if there is no status id in statusList', () => {
                expect(getPossibleStatuses([], '1', { '1': ['2'] })).toStrictEqual([])

                expect(getPossibleStatuses([], '1', { '1': ['2'] }, { '1': ['2'] })).toStrictEqual([])
            })
        })
    })
})
