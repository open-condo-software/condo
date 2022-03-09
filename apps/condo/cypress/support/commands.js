/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

Cypress.Commands.add('waitForCaptcha', function () {
    cy.get('iframe').first()
})

