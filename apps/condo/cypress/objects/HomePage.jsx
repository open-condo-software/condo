/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

class HomePage {

    static url = 'http://localhost:3000/'

    visit () {
        cy.visit(HomePage.url)
    }
}

export default HomePage
