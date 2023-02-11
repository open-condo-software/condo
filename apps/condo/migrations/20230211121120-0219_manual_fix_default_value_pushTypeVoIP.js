exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;

    SET statement_timeout = '1500s'; 
    
    -- fixes wrong default value introduced in migration 20230203103827-0216_auto_20230203_0538.js
    
    UPDATE "RemoteClient" SET "pushTypeVoIP" = 'default' WHERE "pushTypeVoIP" NOT IN ('default', 'silent_data'); 

    SET statement_timeout = '10s'; 

    COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;

    COMMIT;

    `)
}
