exports.up = async (knex) => {
    await knex.raw(`
DROP INDEX IF EXISTS "occupancy_unique_active_tenant";
`)
}

exports.down = async (knex) => {
    await knex.raw(`
CREATE UNIQUE INDEX IF NOT EXISTS "occupancy_unique_active_tenant"
ON "Occupancy" ("tenant")
WHERE "status" = 'active' AND "deletedAt" IS NULL;
`)
}
