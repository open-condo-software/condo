/**
 * @jest-environment node
 */
import { compareMobileAppVersions } from '@condo/domains/notification/helpers/compareMobileAppVersion'

describe('compareMobileAppVersions', () => {

    const cases = [
        ['1.12.0(1)', '1.12.1(1)', -1],
        ['1.12.0(1)', '2.1.12(1)', -1],
        ['1.12.0(1)', '1.12.0(1)', 0],
        ['1.12.0(2)', '1.12.0(1)', 1], //It is not always necessary to update to the latest version. Sometimes it is important that the device has a version higher than a certain one, but not necessarily the latest one
    ]

    test.each(cases)('%p compare to %p', (a, b, result) => {
        expect(compareMobileAppVersions(a, b) === result).toEqual(true)
        // NOTE: 0 === -0 is true, but Object.is(0, -0) is false
        expect(compareMobileAppVersions(b, a) === -result).toEqual(true)
    })

})