const path = require('path')

async function main () {
    process.env.PHASE = process.env.PHASE || 'build'
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'undefined') {
        process.env.DATABASE_URL = 'prisma:postgresql://user:pass@localhost:5432/condo?schema=public'
    }
    const entryPoint = path.resolve(__dirname, '../index.js')
    const { keystone } = require(entryPoint)


    const rels = keystone._consolidateRelationships()
    await keystone.adapter._generateClient(rels)

    console.log('Prisma client generated successfully')
}

main().then(
    () => process.exit(0),
    (error) => {
        console.error('Failed to generate Prisma client:', error.stack || error.message)
        process.exit(1)
    },
)
