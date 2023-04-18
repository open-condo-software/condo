
const trackedVisit = (url) => {
    // transforms /auth/signin/ to auth.signin
    const normalizedUrl = url.replace(/^\/?|\/?$/g, '').replaceAll('/', '.')
    return cy.visit(url, {
        onBeforeLoad: (win) => {
            win.performance.mark(`${normalizedUrl}.startLoading`)
        },
        onLoad: (win) => {
            win.performance.mark(`${normalizedUrl}.stopLoading`)
        },
    }).its('performance').then((p) => {
        p.measure(`${normalizedUrl}.pageLoad`, `${normalizedUrl}.startLoading`, `${normalizedUrl}.stopLoading`)
        const measure = p.getEntriesByName(`${normalizedUrl}.pageLoad`)[0]

        cy.log(`[helpers.ts] ${normalizedUrl} loaded in: ${measure.duration}`)
        cy.task('metrics:histogram', [`${normalizedUrl}.pageload`, measure.duration])
    })
}

export {
    trackedVisit,
}