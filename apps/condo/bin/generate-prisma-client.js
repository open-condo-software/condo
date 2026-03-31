const path = require('path')

async function main () {
    const entryPoint = path.resolve(__dirname, '../index.js')
    const { keystone } = require(entryPoint)


    const rels = keystone._consolidateRelationships()
    await keystone.adapter._generateClient(rels)

    console.log('Prisma client generated successfully')
}

main().then(
    () => process.exit(0),
    (error) => {
        console.error('Failed to generate Prisma client:', error.message)
        process.exit(1)
    },
)
