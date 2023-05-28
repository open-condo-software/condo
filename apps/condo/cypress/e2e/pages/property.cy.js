import { faker } from '@faker-js/faker'

import { Condo } from '../../objects/Condo'
import { SimpleTracer } from '../../objects/helpers'
import {
    Property,
    PropertyMapCreate,
    PropertyMapEdit,
    PropertyMapUnitEdit,
} from '../../objects/Property'
import { authUserWithCookies } from '../../plugins/auth'

describe('Property', function () {
    describe('User', function () {
        it('can create properties and manipulate their maps', () => {
            const trace = new SimpleTracer('user.canCreatePropertyMap', 'property')
            const spanPrepare = trace.startSpan('1.createUserWithOrganization')
            cy.task('keystone:createUserWithOrganization').then(async (response) => {
                authUserWithCookies(response)
                spanPrepare.finish()

                const organization = response.organization

                const condo = new Condo()
                condo.visit()

                cy.task('keystone:createProperty', organization).then(property => {
                    condo.clickOnMenu('property')

                    const propertyMapCreate = new PropertyMapCreate()
                    propertyMapCreate
                        .clickOnPropertyTableRow()
                        .clickEditPropertyMapButton()
                        .clickSection()
                        .clickRemoveSection()
                        .clickOnEditMenu()
                        .clickEditSection()
                        .typeFloorCount()
                        .typeUnitsOnFloorCount()
                        .clickSubmitButton()
                        .clickSavePropertyMap()
                })

                cy.task('keystone:createProperty', organization).then(property => {
                    condo.clickOnMenu('property')

                    const propertyMapEdit = new PropertyMapEdit()
                    propertyMapEdit
                        .clickOnPropertyTableRow()
                        .clickEditPropertyMapButton()
                        .cleanUp()
                        .createTestSection()
                        .clickOnEditMenu()
                        .clickEditSection()
                        .clickSectionEditMode()
                        .clickSubmitButton()
                        .clickSavePropertyMap()
                })

                cy.task('keystone:createProperty', organization).then(property => {
                    condo.clickOnMenu('property')

                    const propertyMapUnitEdit = new PropertyMapUnitEdit()
                    propertyMapUnitEdit
                        .clickOnPropertyTableRow()
                        .clickEditPropertyMapButton()
                        .openUnitAddModal()
                        .changeUnitType()
                        .typeUnitLabel()
                        .changeUnitSection()
                        .changeUnitFloor()
                        .clickSubmitButton()
                        .quickSave()
                        .selectUnit()
                        .clickRemoveUnit()
                        .quickSave()
                        .renameUnit()
                        .clickSavePropertyMap()
                })

            }).then(() => {
                trace.finish()
            })
        })
    })
})
