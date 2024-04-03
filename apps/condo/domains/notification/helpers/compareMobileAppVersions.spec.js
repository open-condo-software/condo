/**
 * @jest-environment node
 */
import { compareMobileAppVersions } from '@condo/domains/notification/helpers/compareMobileAppVersion'

describe('compareMobileAppVersions', () => {

    it('when the device has an outdated build version. The difference is 1 minor version', async () => {
        const versionFromRemoteClient = '1.12.0(1)'
        const versionOfActualRealise = '1.12.1(1)'
        const result = compareMobileAppVersions(versionFromRemoteClient, versionOfActualRealise)
        expect(result).toEqual(-1)
    })

    it('when the device has an outdated build version. The difference is 1 major version', async () => {
        const versionFromRemoteClient = '1.12.0(1)'
        const versionOfActualRealise = '2.1.12(1)'
        const result = compareMobileAppVersions(versionFromRemoteClient, versionOfActualRealise)
        expect(result).toEqual(-1)
    })

    it('when the device has an actual build version.', async () => {
        const versionFromRemoteClient = '1.12.0(1)'
        const versionOfActualRealise = '1.12.0(1)'
        const result = compareMobileAppVersions(versionFromRemoteClient, versionOfActualRealise)
        expect(result).toEqual(0)
    })

    //It is not always necessary to update to the latest version. Sometimes it is important that the device has a version higher than a certain one, but not necessarily the latest one
    it('when the device has the latest build version', async () => {
        const versionFromRemoteClient = '1.12.0(2)'
        const versionOfActualRealise = '1.12.0(1)'
        const result = compareMobileAppVersions(versionFromRemoteClient, versionOfActualRealise)
        expect(result).toEqual(1)
    })

})