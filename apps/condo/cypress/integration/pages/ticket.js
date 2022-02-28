import sample from 'lodash/sample'
import faker from 'faker'

import { TicketCreate } from '../../objects/Ticket'

describe('Ticket create',  function () {
    describe('User', function () {
        before(() => {
            cy.task('keystone:createUserWithProperty').then((response) => {
                this.userData = response

                cy.setCookie('locale', 'en')
                cy.setCookie('keystone.sid', response.cookie.replace('keystone.sid=', ''))
                cy.setCookie('organizationLinkId', response.organizationLinkId)
            })
        })

        it('can create ticket',  () => {
            const { address: propertyAddress, map: propertyMap } = this.userData.property
            const propertyUnits = propertyMap.sections
                .map(section => section.floors.map(floor => floor.units.map(unit => unit.label))).flat(2)

            const ticketCreate = new TicketCreate()
            ticketCreate
                .visit()
                .clickAndInputAddress(propertyAddress)
                .chooseAddressForTicket()
                .clickAndInputUnitName(sample(propertyUnits))
                .chooseUnitName()
                .clickAndInputDescription(faker.lorem.sentence(3))
                .selectProblemWithCategoryClassifier()
                .clickOnSubmitButton()
        })
    })
})
