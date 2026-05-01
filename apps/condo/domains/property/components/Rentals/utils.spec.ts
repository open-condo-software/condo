import { getOccupancyLifecycleActions, getRentalWorkspaceActions } from './utils'


describe('rental workspace UI state helpers', () => {
    test('hides management actions for read-only users', () => {
        expect(getRentalWorkspaceActions(false)).toEqual([])
        expect(getOccupancyLifecycleActions('planned', false)).toEqual([])
        expect(getOccupancyLifecycleActions('active', false)).toEqual([])
    })

    test('shows full planned lifecycle actions to property managers', () => {
        expect(getOccupancyLifecycleActions('planned', true)).toEqual([
            'checkIn',
            'renew',
            'transfer',
            'checkOut',
            'cancel',
        ])
    })

    test('shows active lifecycle actions without planned-only actions', () => {
        expect(getOccupancyLifecycleActions('active', true)).toEqual([
            'renew',
            'transfer',
            'checkOut',
        ])
    })

    test('shows rental workspace management actions only to property managers', () => {
        expect(getRentalWorkspaceActions(true)).toEqual(['createUnit', 'checkIn'])
    })
})
