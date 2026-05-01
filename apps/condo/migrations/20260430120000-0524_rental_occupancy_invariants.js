exports.up = async (knex) => {
    await knex.raw(`
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS "occupancy_unique_active_tenant"
ON "Occupancy" ("tenant")
WHERE "status" = 'active' AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "rent_charge_unique_occupancy_billing_month"
ON "RentCharge" ("occupancy", "billingMonth")
WHERE "deletedAt" IS NULL;

CREATE OR REPLACE FUNCTION "check_occupancy_rental_unit_invariants"()
RETURNS trigger AS $$
DECLARE
    rental_unit_property uuid;
    rental_unit_organization uuid;
    rental_unit_capacity integer;
    active_count integer;
BEGIN
    SELECT "property", "organization", "capacity"
    INTO rental_unit_property, rental_unit_organization, rental_unit_capacity
    FROM "RentalUnit"
    WHERE "id" = NEW."rentalUnit"
    FOR UPDATE;

    IF rental_unit_property IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW."property" IS DISTINCT FROM rental_unit_property
        OR NEW."organization" IS DISTINCT FROM rental_unit_organization THEN
        RAISE EXCEPTION 'Occupancy scope must match rental unit scope'
            USING ERRCODE = '23514', CONSTRAINT = 'occupancy_rental_unit_scope_match';
    END IF;

    IF NEW."status" = 'active' AND NEW."deletedAt" IS NULL THEN
        SELECT COUNT(*)
        INTO active_count
        FROM "Occupancy"
        WHERE "rentalUnit" = NEW."rentalUnit"
            AND "status" = 'active'
            AND "deletedAt" IS NULL
            AND "id" IS DISTINCT FROM NEW."id";

        IF active_count >= rental_unit_capacity THEN
            RAISE EXCEPTION 'Rental unit active occupancy capacity is exceeded'
                USING ERRCODE = '23514', CONSTRAINT = 'occupancy_rental_unit_capacity';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "check_occupancy_rental_unit_invariants_trigger" ON "Occupancy";
CREATE TRIGGER "check_occupancy_rental_unit_invariants_trigger"
BEFORE INSERT OR UPDATE OF "organization", "property", "rentalUnit", "status", "deletedAt"
ON "Occupancy"
FOR EACH ROW
EXECUTE FUNCTION "check_occupancy_rental_unit_invariants"();

CREATE OR REPLACE FUNCTION "check_rent_charge_scope_invariants"()
RETURNS trigger AS $$
DECLARE
    occupancy_organization uuid;
    occupancy_property uuid;
    occupancy_rental_unit uuid;
BEGIN
    SELECT "organization", "property", "rentalUnit"
    INTO occupancy_organization, occupancy_property, occupancy_rental_unit
    FROM "Occupancy"
    WHERE "id" = NEW."occupancy";

    IF occupancy_organization IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW."organization" IS DISTINCT FROM occupancy_organization
        OR NEW."property" IS DISTINCT FROM occupancy_property
        OR NEW."rentalUnit" IS DISTINCT FROM occupancy_rental_unit THEN
        RAISE EXCEPTION 'Rent charge scope must match occupancy scope'
            USING ERRCODE = '23514', CONSTRAINT = 'rent_charge_occupancy_scope_match';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "check_rent_charge_scope_invariants_trigger" ON "RentCharge";
CREATE TRIGGER "check_rent_charge_scope_invariants_trigger"
BEFORE INSERT OR UPDATE OF "organization", "property", "rentalUnit", "occupancy"
ON "RentCharge"
FOR EACH ROW
EXECUTE FUNCTION "check_rent_charge_scope_invariants"();

CREATE OR REPLACE FUNCTION "check_billing_account_rental_unit_invariants"()
RETURNS trigger AS $$
DECLARE
    billing_organization uuid;
    billing_property_address_key text;
    rental_unit_organization uuid;
    rental_unit_property_address_key text;
BEGIN
    IF NEW."rentalUnit" IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT "organization"
    INTO billing_organization
    FROM "BillingIntegrationOrganizationContext"
    WHERE "id" = NEW."context";

    SELECT "addressKey"
    INTO billing_property_address_key
    FROM "BillingProperty"
    WHERE "id" = NEW."property";

    SELECT "RentalUnit"."organization", "Property"."addressKey"
    INTO rental_unit_organization, rental_unit_property_address_key
    FROM "RentalUnit"
    JOIN "Property" ON "Property"."id" = "RentalUnit"."property"
    WHERE "RentalUnit"."id" = NEW."rentalUnit";

    IF NEW."context" IS NOT NULL
        AND billing_organization IS DISTINCT FROM rental_unit_organization THEN
        RAISE EXCEPTION 'Billing account organization must match rental unit organization'
            USING ERRCODE = '23514', CONSTRAINT = 'billing_account_rental_unit_organization_match';
    END IF;

    IF billing_property_address_key IS NOT NULL
        AND billing_property_address_key IS DISTINCT FROM rental_unit_property_address_key THEN
        RAISE EXCEPTION 'Billing account property must match rental unit property'
            USING ERRCODE = '23514', CONSTRAINT = 'billing_account_rental_unit_property_match';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "check_billing_account_rental_unit_invariants_trigger" ON "BillingAccount";
CREATE TRIGGER "check_billing_account_rental_unit_invariants_trigger"
BEFORE INSERT OR UPDATE OF "context", "property", "rentalUnit"
ON "BillingAccount"
FOR EACH ROW
EXECUTE FUNCTION "check_billing_account_rental_unit_invariants"();

CREATE OR REPLACE FUNCTION "check_invoice_rental_invariants"()
RETURNS trigger AS $$
DECLARE
    rental_unit_property uuid;
    rent_charge_property uuid;
    rent_charge_rental_unit uuid;
BEGIN
    IF NEW."rentalUnit" IS NOT NULL THEN
        SELECT "property"
        INTO rental_unit_property
        FROM "RentalUnit"
        WHERE "id" = NEW."rentalUnit";

        IF NEW."property" IS DISTINCT FROM rental_unit_property THEN
            RAISE EXCEPTION 'Invoice property must match rental unit property'
                USING ERRCODE = '23514', CONSTRAINT = 'invoice_rental_unit_property_match';
        END IF;
    END IF;

    IF NEW."rentCharge" IS NOT NULL THEN
        SELECT "property", "rentalUnit"
        INTO rent_charge_property, rent_charge_rental_unit
        FROM "RentCharge"
        WHERE "id" = NEW."rentCharge";

        IF NEW."property" IS DISTINCT FROM rent_charge_property
            OR NEW."rentalUnit" IS DISTINCT FROM rent_charge_rental_unit THEN
            RAISE EXCEPTION 'Invoice scope must match rent charge scope'
                USING ERRCODE = '23514', CONSTRAINT = 'invoice_rent_charge_scope_match';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "check_invoice_rental_invariants_trigger" ON "Invoice";
CREATE TRIGGER "check_invoice_rental_invariants_trigger"
BEFORE INSERT OR UPDATE OF "property", "rentalUnit", "rentCharge"
ON "Invoice"
FOR EACH ROW
EXECUTE FUNCTION "check_invoice_rental_invariants"();

CREATE OR REPLACE FUNCTION "check_billing_receipt_rental_invariants"()
RETURNS trigger AS $$
DECLARE
    rent_charge_property uuid;
    rent_charge_rental_unit uuid;
    account_rental_unit uuid;
BEGIN
    IF NEW."rentCharge" IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT "property", "rentalUnit"
    INTO rent_charge_property, rent_charge_rental_unit
    FROM "RentCharge"
    WHERE "id" = NEW."rentCharge";

    IF NEW."property" IS DISTINCT FROM rent_charge_property THEN
        RAISE EXCEPTION 'Billing receipt property must match rent charge property'
            USING ERRCODE = '23514', CONSTRAINT = 'billing_receipt_rent_charge_property_match';
    END IF;

    IF NEW."account" IS NOT NULL THEN
        SELECT "rentalUnit"
        INTO account_rental_unit
        FROM "BillingAccount"
        WHERE "id" = NEW."account";

        IF account_rental_unit IS DISTINCT FROM rent_charge_rental_unit THEN
            RAISE EXCEPTION 'Billing receipt account must match rent charge rental unit'
                USING ERRCODE = '23514', CONSTRAINT = 'billing_receipt_rent_charge_account_match';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "check_billing_receipt_rental_invariants_trigger" ON "BillingReceipt";
CREATE TRIGGER "check_billing_receipt_rental_invariants_trigger"
BEFORE INSERT OR UPDATE OF "property", "account", "rentCharge"
ON "BillingReceipt"
FOR EACH ROW
EXECUTE FUNCTION "check_billing_receipt_rental_invariants"();

COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
BEGIN;

DROP TRIGGER IF EXISTS "check_billing_receipt_rental_invariants_trigger" ON "BillingReceipt";
DROP FUNCTION IF EXISTS "check_billing_receipt_rental_invariants"();

DROP TRIGGER IF EXISTS "check_invoice_rental_invariants_trigger" ON "Invoice";
DROP FUNCTION IF EXISTS "check_invoice_rental_invariants"();

DROP TRIGGER IF EXISTS "check_billing_account_rental_unit_invariants_trigger" ON "BillingAccount";
DROP FUNCTION IF EXISTS "check_billing_account_rental_unit_invariants"();

DROP TRIGGER IF EXISTS "check_rent_charge_scope_invariants_trigger" ON "RentCharge";
DROP FUNCTION IF EXISTS "check_rent_charge_scope_invariants"();

DROP TRIGGER IF EXISTS "check_occupancy_rental_unit_invariants_trigger" ON "Occupancy";
DROP FUNCTION IF EXISTS "check_occupancy_rental_unit_invariants"();

DROP INDEX IF EXISTS "rent_charge_unique_occupancy_billing_month";
DROP INDEX IF EXISTS "occupancy_unique_active_tenant";

COMMIT;
    `)
}
