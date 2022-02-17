/* eslint-disable no-undef */
import sample from 'lodash/sample'
import faker from 'faker'

import { TicketCreate } from '../../objects/Ticket'

describe('Ticket user scenario',  function () {
    describe('User', function () {
        before(() => {
            const createUserWithProperty = cy.task('keystone:createUserWithProperty')
            createUserWithProperty.then((response) => {
                this.userData = response
                cy.setCookie('locale', 'en')
                cy.setCookie('keystone.sid', this.userData.cookie.replace('keystone.sid=', ''))
                cy.setCookie('organizationLinkId', '')
            })
        })

        it('can create ticket',  () => {
            const { address: propertyAddress, map: propertyMap } = this.userData.user.property
            const propertyUnits = propertyMap.sections
                .map(section => section.floors.map(floor => floor.units.map(unit => unit.label))).flat(2)

            const ticketCreate = new TicketCreate()
            ticketCreate
                .visit()
                .chooseOrganization()
                .clickAndInputAddress(propertyAddress)
                .chooseAddressForTicket()
                .clickAndInputUnitName(sample(propertyUnits))
                .chooseUnitName()
                .clickAndInputDescription(faker.lorem.paragraph())
        })
    })
})
