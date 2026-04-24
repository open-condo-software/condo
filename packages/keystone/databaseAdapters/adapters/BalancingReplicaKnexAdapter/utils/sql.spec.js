const {
    extractCRUDQueryData,
} = require('./sql')

describe('SQL parsing utils', () => {
    describe('extractCRUDQueryData', () => {
        describe('Must correctly parse query table and method on CRUD (and show) operations', () => {
            const cases = [
                [
                    'health check select',
                    'select 1+1 as result',
                    { sqlOperationName: 'select', tableName: undefined },
                ],
                [
                    'show (internal KS call)',
                    'SHOW server_version;',
                    { sqlOperationName: 'show', tableName: undefined },
                ],
                [
                    'simple select (allModels)',
                    'select "t0".* from "public"."Model" as "t0" where true and ("t0"."deletedAt" is null) limit $1',
                    { sqlOperationName: 'select', tableName: 'Model' },
                ],
                [
                    'select with relation join filter (allModels (where: { v: 1, someRelation: { v_gt: 1 } }))',
                    'select "t0".* from "public"."Model" as "t0" left outer join "public"."RelationModel" as "t0__someRelation" on "t0__someRelation"."id" = "t0"."someRelation" where true and (true and ("t0__someRelation"."v" > $1) and ("t0"."v" = $2) and ("t0"."deletedAt" is null)) limit $3',
                    { sqlOperationName: 'select', tableName: 'Model' },
                ],
                [
                    'simple select with join (allModels (where: { v: 1, manyRelations_some: { v_gt: 1 } }))',
                    'select "t0".* from "public"."Model" as "t0" where true and (true and ("t0"."id" in (select "Model_left_id" from (select "t1"."Model_left_id" from "public"."Model_manyRelations_many" as "t1" inner join "public"."RelationModel" as "t1__manyRelations" on "t1__manyRelations"."id" = "t1"."RelationModel_right_id" where true and ("t1__manyRelations"."v" > $1)) as "unused_alias")) and ("t0"."v" = $2) and ("t0"."deletedAt" is null)) order by "id" DESC limit $3',
                    { sqlOperationName: 'select', tableName: 'Model' },
                ],
                [
                    'select with count',
                    'select count(*) as "count" from (select * from "public"."Model" as "t0" where true and ("t0"."deletedAt" is null)) as "unused_alias"',
                    { sqlOperationName: 'select', tableName: 'Model' },
                ],
                [
                    'select with count and join #1',
                    'select count(*) as "count" from (select * from "public"."Model" as "t0" left outer join "public"."RelationModel" as "t0__someRelation" on "t0__someRelation"."id" = "t0"."someRelation" where true and (true and ("t0__someRelation"."dv" > $1) and ("t0"."deletedAt" is null))) as "unused_alias"',
                    { sqlOperationName: 'select', tableName: 'Model' },
                ],
                [
                    'select with count and join #2',
                    'select count(*) as "count" from (select * from "public"."Contact" as "t0" left outer join "public"."Organization" as "t0__organization" on "t0__organization"."id" = "t0"."organization" where true and ("t0__organization"."id" = $1) and ("t0"."deletedAt" is null)) as "unused_alias"',
                    { sqlOperationName: 'select', tableName: 'Contact' },
                ],
                [
                    'select with relation join filter (allModels (where: { v: 1, someRelation: { v_gt: 1 } }))',
                    'select "t0".* from "public"."Model" as "t0" left outer join "public"."RelationModel" as "t0__someRelation" on "t0__someRelation"."id" = "t0"."someRelation" where true and (true and ("t0__someRelation"."v" > 1) and ("t0"."v" = 1) and ("t0"."deletedAt" is null)) limit 1001',
                    { sqlOperationName: 'select', tableName: 'Model' },
                ],
                [
                    'select with many relation join filter (allModels (where: { v: 1, manyRelations_some: { v_gt: 1 } }))',
                    'select "t0".* from "public"."Model" as "t0" where true and (true and ("t0"."id" in (select "Model_left_id" from (select "t2"."Model_left_id" from "public"."Model_manyRelations_many" as "t2" inner join "public"."RelationModel" as "t2__manyRelations" on "t2__manyRelations"."id" = "t2"."RelationModel_right_id" where true and ("t2__manyRelations"."v" > 1)) as "unused_alias")) and ("t0"."v" = 1) and ("t0"."deletedAt" is null)) limit 1001',
                    { sqlOperationName: 'select', tableName: 'Model' },
                ],
                [
                    'simple insert (createRelationModel)',
                    'insert into "public"."RelationModel" ("createdAt", "createdBy", "dv", "id", "name", "sender", "updatedAt", "updatedBy", "v") values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *',
                    { sqlOperationName: 'insert', tableName: 'RelationModel' },
                ],
                [
                    'insert historical (afterChange historical plugin)',
                    'insert into "public"."RelationModelHistoryRecord" ("createdAt", "createdBy", "deletedAt", "dv", "history_action", "history_date", "history_id", "id", "name", "newId", "sender", "updatedAt", "updatedBy", "v") values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) returning *',
                    { sqlOperationName: 'insert', tableName: 'RelationModelHistoryRecord' },
                ],
                [
                    'single connect select (relation by id resolver)',
                    'select "t0".* from "public"."RelationModel" as "t0" where true and ("t0"."deletedAt" is null) and ("t0"."id" = $1) limit $2',
                    { sqlOperationName: 'select', tableName: 'RelationModel' },
                ],
                [
                    'insert with relation ({ connect: { id: "123" } })',
                    'insert into "public"."Model" ("createdAt", "createdBy", "dv", "id", "name", "sender", "someRelation", "updatedAt", "updatedBy", "v") values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning *',
                    { sqlOperationName: 'insert', tableName: 'Model' },
                ],
                [
                    'insert with many relation ({ connect: [ { id: "123" } ] })',
                    'insert into "public"."Model_manyRelations_many" ("Model_left_id", "RelationModel_right_id") values ($1, $2) returning "RelationModel_right_id"',
                    { sqlOperationName: 'insert', tableName: 'Model_manyRelations_many' },
                ],
                [
                    'insert with many relation ({ connect: [ { id: "123" }, { id: "456" } ] })',
                    'insert into "public"."Model_manyRelations_many" ("Model_left_id", "RelationModel_right_id") values ($1, $2), ($3, $4) returning "RelationModel_right_id"',
                    { sqlOperationName: 'insert', tableName: 'Model_manyRelations_many' },
                ],
                [
                    'select with many relation (many relation field resolver)',
                    'select "t0".* from "public"."RelationModel" as "t0" left outer join "public"."Model_manyRelations_many" as "t1" on "t1"."RelationModel_right_id" = "t0"."id" where true and "t1"."Model_left_id" = $1 and ("t0"."deletedAt" is null) limit $2',
                    { sqlOperationName: 'select', tableName: 'RelationModel' },
                ],
                [
                    'simple update',
                    'update "public"."RelationModel" set "name" = $1, "v" = $2, "updatedAt" = $3, "updatedBy" = $4, "dv" = $5, "sender" = $6 where "id" = $7 returning "id", "name", "id", "v", "createdAt", "updatedAt", "createdBy", "updatedBy", "deletedAt", "newId", "dv", "sender"',
                    { sqlOperationName: 'update', tableName: 'RelationModel' },
                ],
                [
                    'update with file',
                    'update "public"."ContactExportTask" set "status" = $1, "file" = $2, "timeZone" = $3, "v" = $4, "updatedAt" = $5, "updatedBy" = $6, "dv" = $7, "sender" = $8 where "id" = $9 returning "id", "status", "format", "exportedRecordsCount", "totalRecordsCount", "file", "meta", "where", "sortBy", "locale", "timeZone", "user", "id", "v", "createdAt", "updatedAt", "createdBy", "updatedBy", "deletedAt", "newId", "dv", "sender"',
                    { sqlOperationName: 'update', tableName: 'ContactExportTask' },
                ],
                [
                    'many-relation disconnect all select #1',
                    'select "t0".* from "public"."RelationModel" as "t0" left outer join "public"."Model_manyRelations_many" as "t1" on "t1"."RelationModel_right_id" = "t0"."id" where true and "t1"."Model_left_id" = $1 limit $2',
                    { sqlOperationName: 'select', tableName: 'RelationModel' },
                ],
                [
                    'many-relation disconnect all select #2',
                    'select "RelationModel_right_id" from "public"."Model_manyRelations_many" where "Model_left_id" = $1',
                    { sqlOperationName: 'select', tableName: 'Model_manyRelations_many' },
                ],
                [
                    'disconnect all many relation',
                    'delete from "public"."Model_manyRelations_many" where "Model_left_id" = $1 and "RelationModel_right_id" in ($2, $3)',
                    { sqlOperationName: 'delete', tableName: 'Model_manyRelations_many' },
                ],
                [
                    'disconnect all single relation',
                    'update "public"."Model" set "name" = $1, "someRelation" = $2, "v" = $3, "updatedAt" = $4, "updatedBy" = $5, "dv" = $6, "sender" = $7 where "id" = $8 returning "id", "name", "someRelation", "id", "v", "createdAt", "updatedAt", "createdBy", "updatedBy", "deletedAt", "newId", "dv", "sender"',
                    { sqlOperationName: 'update', tableName: 'Model' },
                ],
                [
                    'grouped select (updateModels)',
                    'select "t0".* from "public"."Model" as "t0" where true and ("t0"."id" in ($1, $2)) limit $3',
                    { sqlOperationName: 'select', tableName: 'Model' },
                ],
                [
                    'single delete',
                    'delete from "public"."Model" where "id" = $1',
                    { sqlOperationName: 'delete', tableName: 'Model' },
                ],
                [
                    'SET_NULL policy',
                    'update "public"."Model" set "someRelation" = $1 where "someRelation" = $2',
                    { sqlOperationName: 'update', tableName: 'Model' },
                ],
                [
                    'delete many-to-many relations',
                    'delete from "public"."Model_manyRelations_many" where "RelationModel_right_id" = $1',
                    { sqlOperationName: 'delete', tableName: 'Model_manyRelations_many' },
                ],
            ]
            test.each(cases)('%p', (_, query, expectedData) => {
                expect(extractCRUDQueryData(query)).toStrictEqual(expectedData)
            })
        })
        describe('Must throw if operation is not CRUD (and show)', () => {
            const cases = [
                'ALTER TABLE "Ticket_executors_many" RENAME TO "Ticket_watchers_many";',
                'ALTER TABLE "OrganizationEmployeeRole" ALTER COLUMN "canManageOrganization" DROP DEFAULT;',
                'ALTER TABLE "TicketStatus" ALTER COLUMN "organization" SET NOT NULL;',
                'DROP TABLE "BillingIntegrationLog" CASCADE;',
                'CREATE INDEX "BillingAccount_bindingId_e1c2fc88_like" ON "BillingAccount" ("bindingId" text_pattern_ops);',
                'CREATE TABLE "BillingAccount" ("dv" integer NOT NULL, "sender" jsonb NOT NULL, "importId" text NULL, "bindingId" text NULL UNIQUE, "number" text NOT NULL, "unit" text NOT NULL, "raw" jsonb NOT NULL, "meta" jsonb NOT NULL, "id" uuid NOT NULL PRIMARY KEY, "v" integer NOT NULL, "createdAt" timestamp with time zone NULL, "updatedAt" timestamp with time zone NULL, "deletedAt" timestamp with time zone NULL, "newId" uuid NULL);',
            ]
            test.each(cases)('%p', (query) => {
                expect(() => extractCRUDQueryData(query))
                    .toThrow(/Unsupported operation provided/)
            })
        })
        describe('Must throw if operation cannot be parsed by node-sql-parser', () => {
            const cases = [
                'ALTER TABLE "TicketClassifier" DROP CONSTRAINT "TicketClassifier_organization_1327189b_fk_Organization_id";',
                'SET CONSTRAINTS "BillingAccountMeter_property_44558673_fk_BillingProperty_id" IMMEDIATE;',
                'ALTER TABLE "OrganizationEmployeeRole" RENAME COLUMN "canManageUsers" TO "canManageEmployees";',
            ]
            test.each(cases)('%p', (query) => {
                expect(() => extractCRUDQueryData(query))
                    .toThrow(/Provided SQL query cannot be parsed/)
            })
        })
    })
})
