async function canExportTicketsToExcel ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return true

    return { organization: { employees_some: { user: { id: user.id }, isBlocked: false } } }
}

module.exports = {
    canExportTicketsToExcel,
}
