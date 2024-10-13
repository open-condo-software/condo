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
                    { operation: 'select', table: undefined },
                ],
                [
                    'show (internal KS call)',
                    'SHOW server_version;',
                    { operation: 'show', table: undefined },
                ],
                [
                    'simple select (allModels)',
                    'select "t0".* from "public"."Model" as "t0" where true and ("t0"."deletedAt" is null) limit 1001;',
                    { operation: 'select', table: 'Model' },
                ],
                [
                    'simple select with join',
                    'select "t0".* from "public"."Model" as "t0" join "public"."Model" as "t1" on "t1".id = "t0".id where true and ("t0"."deletedAt" is null) limit 1001',
                    { operation: 'select', table: 'Model' },
                ],
                [
                    'select with relation join filter (allModels (where: { v: 1, someRelation: { v_gt: 1 } }))',
                    'select "t0".* from "public"."Model" as "t0" left outer join "public"."RelationModel" as "t0__someRelation" on "t0__someRelation"."id" = "t0"."someRelation" where true and (true and ("t0__someRelation"."v" > 1) and ("t0"."v" = 1) and ("t0"."deletedAt" is null)) limit 1001',
                    { operation: 'select', table: 'Model' },
                ],
                [
                    'select with many relation join filter (allModels (where: { v: 1, manyRelations_some: { v_gt: 1 } }))',
                    'select "t0".* from "public"."Model" as "t0" where true and (true and ("t0"."id" in (select "Model_left_id" from (select "t2"."Model_left_id" from "public"."Model_manyRelations_many" as "t2" inner join "public"."RelationModel" as "t2__manyRelations" on "t2__manyRelations"."id" = "t2"."RelationModel_right_id" where true and ("t2__manyRelations"."v" > 1)) as "unused_alias")) and ("t0"."v" = 1) and ("t0"."deletedAt" is null)) limit 1001',
                    { operation: 'select', table: 'Model' },
                ],
                [
                    'simple insert (createRelationModel)',
                    'insert into "public"."RelationModel" ("createdAt", "createdBy", "dv", "id", "name", "sender", "updatedAt", "updatedBy", "v") values (\'2024-10-10T06:39:40.224Z\', NULL, 1, \'806c73ae-808d-4aeb-a9e0-b8b6c8a2d2d6\', \'name\', \'{"dv":1,"fingerprint":"test-print"}\', \'2024-10-10T06:39:40.224Z\', NULL, 1) returning *',
                    { operation: 'insert', table: 'RelationModel' },
                ],
                [
                    'insert historical (afterChange historical plugin)',
                    'insert into "public"."RelationModelHistoryRecord" ("createdAt", "createdBy", "deletedAt", "dv", "history_action", "history_date", "history_id", "id", "name", "newId", "sender", "updatedAt", "updatedBy", "v") values (\'2024-10-10T06:39:40.224Z\', NULL, NULL, 1, \'c\', \'2024-10-10T06:41:58.809Z\', \'806c73ae-808d-4aeb-a9e0-b8b6c8a2d2d6\', \'69b7e8a6-edfd-4d3c-ac80-8d65e1eff97a\', \'name\', \'null\', \'{"dv":1,"fingerprint":"test-print"}\', \'2024-10-10T06:39:40.224Z\', NULL, 1) returning *',
                    { operation: 'insert', table: 'RelationModelHistoryRecord' },
                ],
                [
                    'single connect select (relation by id resolver)',
                    'select "t0".* from "public"."RelationModel" as "t0" where true and ("t0"."deletedAt" is null) and ("t0"."id" = \'cc776b13-e414-45c3-b44c-b48623b37df9\') limit 1',
                    { operation: 'select', table: 'RelationModel' },
                ],
                [
                    'insert with relation ({ connect: { id: "123" } })',
                    'insert into "public"."Model" ("createdAt", "createdBy", "dv", "id", "name", "sender", "someRelation", "updatedAt", "updatedBy", "v") values (\'2024-10-10T06:47:27.347Z\', NULL, 1, \'c9c2839b-73f0-4f50-9603-98fa42350324\', \'name\', \'{"dv":1,"fingerprint":"test-print"}\', \'cc776b13-e414-45c3-b44c-b48623b37df9\', \'2024-10-10T06:47:27.347Z\', NULL, 1) returning *',
                    { operation: 'insert', table: 'Model' },
                ],
                [
                    'insert with many relation ({ connect: [ { id: "123" } ] })',
                    'insert into "public"."Model_manyRelations_many" ("Model_left_id", "RelationModel_right_id") values (\'f345ffaf-cbd5-4a80-8d09-ac00e2eba666\', \'cc776b13-e414-45c3-b44c-b48623b37df9\') returning "RelationModel_right_id"',
                    { operation: 'insert', table: 'Model_manyRelations_many' },
                ],
                [
                    'insert with many relation ({ connect: [ { id: "123" }, { id: "456" } ] })',
                    'insert into "public"."Model_manyRelations_many" ("Model_left_id", "RelationModel_right_id") values (\'f0d4132e-bf7f-4cbd-9496-2ca9acea2111\', \'cc776b13-e414-45c3-b44c-b48623b37df9\'), (\'f0d4132e-bf7f-4cbd-9496-2ca9acea2111\', \'fc3b80a3-cc9e-41f9-a5f4-d02685f6181d\') returning "RelationModel_right_id"',
                    { operation: 'insert', table: 'Model_manyRelations_many' },
                ],
                [
                    'select with many relation (many relation field resolver)',
                    'select "t0".* from "public"."RelationModel" as "t0" left outer join "public"."Model_manyRelations_many" as "t1" on "t1"."RelationModel_right_id" = "t0"."id" where true and "t1"."Model_left_id" = \'f0d4132e-bf7f-4cbd-9496-2ca9acea2111\' and ("t0"."deletedAt" is null) limit 1001',
                    { operation: 'select', table: 'RelationModel' },
                ],
                [
                    'simple update',
                    'update "public"."RelationModel" set "name" = \'new name\', "v" = 2, "updatedAt" = \'2024-10-10T06:58:41.230Z\', "updatedBy" = NULL, "dv" = 1, "sender" = \'{"dv":1,"fingerprint":"test-print"}\' where "id" = \'cc776b13-e414-45c3-b44c-b48623b37df9\' returning "id", "name", "id", "v", "createdAt", "updatedAt", "createdBy", "updatedBy", "deletedAt", "newId", "dv", "sender"',
                    { operation: 'update', table: 'RelationModel' },
                ],
                [
                    'many-relation disconnect all select #1',
                    'select "t0".* from "public"."RelationModel" as "t0" left outer join "public"."Model_manyRelations_many" as "t1" on "t1"."RelationModel_right_id" = "t0"."id" where true and "t1"."Model_left_id" = \'02ec093b-ed88-400f-8800-e38da1ca4ef1\' limit 1001',
                    { operation: 'select', table: 'RelationModel' },
                ],
                [
                    'many-relation disconnect all select #2',
                    'select "RelationModel_right_id" from "public"."Model_manyRelations_many" where "Model_left_id" = \'02ec093b-ed88-400f-8800-e38da1ca4ef1\'',
                    { operation: 'select', table: 'Model_manyRelations_many' },
                ],
                [
                    'disconnect all many relation',
                    'delete from "public"."Model_manyRelations_many" where "Model_left_id" = \'02ec093b-ed88-400f-8800-e38da1ca4ef1\' and "RelationModel_right_id" in (\'cc776b13-e414-45c3-b44c-b48623b37df9\', \'310cb400-c2d2-402d-8b29-8b10b14c4fc2\')',
                    { operation: 'delete', table: 'Model_manyRelations_many' },
                ],
                [
                    'disconnect all single relation',
                    'update "public"."Model" set "name" = \'new name\', "someRelation" = NULL, "v" = 2, "updatedAt" = \'2024-10-10T07:06:33.740Z\', "updatedBy" = NULL, "dv" = 1, "sender" = \'{"dv":1,"fingerprint":"test-print"}\' where "id" = \'56908ec5-889d-4e9d-80a1-41cf472daf19\' returning "id", "name", "someRelation", "id", "v", "createdAt", "updatedAt", "createdBy", "updatedBy", "deletedAt", "newId", "dv", "sender"',
                    { operation: 'update', table: 'Model' },
                ],
                [
                    'grouped select (updateModels)',
                    'select "t0".* from "public"."Model" as "t0" where true and ("t0"."id" in (\'1aba78fe-64b5-41a1-9be1-0c73cd4b1fd3\', \'f345ffaf-cbd5-4a80-8d09-ac00e2eba666\')) limit 1001',
                    { operation: 'select', table: 'Model' },
                ],
                [
                    'single delete',
                    'delete from "public"."Model" where "id" = \'f345ffaf-cbd5-4a80-8d09-ac00e2eba666\'',
                    { operation: 'delete', table: 'Model' },
                ],
                [
                    'SET_NULL policy',
                    'update "public"."Model" set "someRelation" = NULL where "someRelation" = \'8e68f296-9193-4f02-bdfe-67185c9da748\'',
                    { operation: 'update', table: 'Model' },
                ],
                [
                    'delete many-to-many relations',
                    'delete from "public"."Model_manyRelations_many" where "RelationModel_right_id" = \'8e68f296-9193-4f02-bdfe-67185c9da748\'',
                    { operation: 'delete', table: 'Model_manyRelations_many' },
                ],
                [
                    'manual insert',
                    'INSERT INTO "TicketSource" (dv, sender, type, name, id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", "updatedBy") VALUES (1, \'{"dv": 1, "fingerprint": "initial"}\', \'mobile_app\', \'ЛК приложение\', \'3068d49a-a45c-4c3a-a02d-ea1a53e1febb\', 1, \'2020-11-24 00:00:00.000000\', \'2020-11-24 00:00:00.000000\', null, null, null, null);',
                    { operation: 'insert', table: 'TicketSource' },
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
