const { deleteContactDuplicates } = require('./contact/deleteContactDuplicates')

async function main () {
    await deleteContactDuplicates()
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)