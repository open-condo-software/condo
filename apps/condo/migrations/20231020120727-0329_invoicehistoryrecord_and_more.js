// auto generated by kmigrator
// KMIGRATOR:0329_invoicehistoryrecord_and_more:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMi40IG9uIDIwMjMtMTAtMjAgMDc6MDgKCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zLCBtb2RlbHMKaW1wb3J0IGRqYW5nby5kYi5tb2RlbHMuZGVsZXRpb24KCgpjbGFzcyBNaWdyYXRpb24obWlncmF0aW9ucy5NaWdyYXRpb24pOgoKICAgIGRlcGVuZGVuY2llcyA9IFsKICAgICAgICAoJ19kamFuZ29fc2NoZW1hJywgJzAzMjhfbWFya2V0aXRlbWhpc3RvcnlyZWNvcmRfYW5kX21vcmUnKSwKICAgIF0KCiAgICBvcGVyYXRpb25zID0gWwogICAgICAgIG1pZ3JhdGlvbnMuQ3JlYXRlTW9kZWwoCiAgICAgICAgICAgIG5hbWU9J2ludm9pY2VoaXN0b3J5cmVjb3JkJywKICAgICAgICAgICAgZmllbGRzPVsKICAgICAgICAgICAgICAgICgnY29udGV4dCcsIG1vZGVscy5VVUlERmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ251bWJlcicsIG1vZGVscy5KU09ORmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ3Byb3BlcnR5JywgbW9kZWxzLlVVSURGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpKSwKICAgICAgICAgICAgICAgICgndW5pdFR5cGUnLCBtb2RlbHMuVGV4dEZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSkpLAogICAgICAgICAgICAgICAgKCd1bml0TmFtZScsIG1vZGVscy5UZXh0RmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ2FjY291bnROdW1iZXInLCBtb2RlbHMuVGV4dEZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSkpLAogICAgICAgICAgICAgICAgKCd0b1BheScsIG1vZGVscy5EZWNpbWFsRmllbGQoYmxhbms9VHJ1ZSwgZGVjaW1hbF9wbGFjZXM9NCwgbWF4X2RpZ2l0cz0xOCwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ3Jvd3MnLCBtb2RlbHMuSlNPTkZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSkpLAogICAgICAgICAgICAgICAgKCd0aWNrZXQnLCBtb2RlbHMuVVVJREZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSkpLAogICAgICAgICAgICAgICAgKCdjb250YWN0JywgbW9kZWxzLlVVSURGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpKSwKICAgICAgICAgICAgICAgICgnY2xpZW50JywgbW9kZWxzLlVVSURGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpKSwKICAgICAgICAgICAgICAgICgnc3RhdHVzJywgbW9kZWxzLlRleHRGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpKSwKICAgICAgICAgICAgICAgICgnaWQnLCBtb2RlbHMuVVVJREZpZWxkKHByaW1hcnlfa2V5PVRydWUsIHNlcmlhbGl6ZT1GYWxzZSkpLAogICAgICAgICAgICAgICAgKCd2JywgbW9kZWxzLkludGVnZXJGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpKSwKICAgICAgICAgICAgICAgICgnY3JlYXRlZEF0JywgbW9kZWxzLkRhdGVUaW1lRmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ3VwZGF0ZWRBdCcsIG1vZGVscy5EYXRlVGltZUZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSkpLAogICAgICAgICAgICAgICAgKCdjcmVhdGVkQnknLCBtb2RlbHMuVVVJREZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSkpLAogICAgICAgICAgICAgICAgKCd1cGRhdGVkQnknLCBtb2RlbHMuVVVJREZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSkpLAogICAgICAgICAgICAgICAgKCdkZWxldGVkQXQnLCBtb2RlbHMuRGF0ZVRpbWVGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpKSwKICAgICAgICAgICAgICAgICgnbmV3SWQnLCBtb2RlbHMuSlNPTkZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSkpLAogICAgICAgICAgICAgICAgKCdkdicsIG1vZGVscy5JbnRlZ2VyRmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ3NlbmRlcicsIG1vZGVscy5KU09ORmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ2hpc3RvcnlfZGF0ZScsIG1vZGVscy5EYXRlVGltZUZpZWxkKCkpLAogICAgICAgICAgICAgICAgKCdoaXN0b3J5X2FjdGlvbicsIG1vZGVscy5DaGFyRmllbGQoY2hvaWNlcz1bKCdjJywgJ2MnKSwgKCd1JywgJ3UnKSwgKCdkJywgJ2QnKV0sIG1heF9sZW5ndGg9NTApKSwKICAgICAgICAgICAgICAgICgnaGlzdG9yeV9pZCcsIG1vZGVscy5VVUlERmllbGQoZGJfaW5kZXg9VHJ1ZSkpLAogICAgICAgICAgICBdLAogICAgICAgICAgICBvcHRpb25zPXsKICAgICAgICAgICAgICAgICdkYl90YWJsZSc6ICdJbnZvaWNlSGlzdG9yeVJlY29yZCcsCiAgICAgICAgICAgIH0sCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLlJlbmFtZUZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdpbnZvaWNlY29udGV4dCcsCiAgICAgICAgICAgIG9sZF9uYW1lPSd2YXQnLAogICAgICAgICAgICBuZXdfbmFtZT0ndmF0UGVyY2VudCcsCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLlJlbmFtZUZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdpbnZvaWNlY29udGV4dGhpc3RvcnlyZWNvcmQnLAogICAgICAgICAgICBvbGRfbmFtZT0ndmF0JywKICAgICAgICAgICAgbmV3X25hbWU9J3ZhdFBlcmNlbnQnLAogICAgICAgICksCiAgICAgICAgbWlncmF0aW9ucy5BZGRGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0naW52b2ljZWNvbnRleHQnLAogICAgICAgICAgICBuYW1lPSdjdXJyZW5jeUNvZGUnLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuVGV4dEZpZWxkKGRlZmF1bHQ9J1JVQicpLAogICAgICAgICAgICBwcmVzZXJ2ZV9kZWZhdWx0PUZhbHNlLAogICAgICAgICksCiAgICAgICAgbWlncmF0aW9ucy5BZGRGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0naW52b2ljZWNvbnRleHQnLAogICAgICAgICAgICBuYW1lPSdzYWxlc1RheFBlcmNlbnQnLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuRGVjaW1hbEZpZWxkKGJsYW5rPVRydWUsIGRlY2ltYWxfcGxhY2VzPTQsIG1heF9kaWdpdHM9MTgsIG51bGw9VHJ1ZSksCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLkFkZEZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdpbnZvaWNlY29udGV4dGhpc3RvcnlyZWNvcmQnLAogICAgICAgICAgICBuYW1lPSdjdXJyZW5jeUNvZGUnLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuVGV4dEZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSksCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLkFkZEZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdpbnZvaWNlY29udGV4dGhpc3RvcnlyZWNvcmQnLAogICAgICAgICAgICBuYW1lPSdzYWxlc1RheFBlcmNlbnQnLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuRGVjaW1hbEZpZWxkKGJsYW5rPVRydWUsIGRlY2ltYWxfcGxhY2VzPTQsIG1heF9kaWdpdHM9MTgsIG51bGw9VHJ1ZSksCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLkFsdGVyRmllbGQoCiAgICAgICAgICAgIG1vZGVsX25hbWU9J2ludm9pY2Vjb250ZXh0JywKICAgICAgICAgICAgbmFtZT0ndGF4UmVnaW1lJywKICAgICAgICAgICAgZmllbGQ9bW9kZWxzLlRleHRGaWVsZChkZWZhdWx0PSdnZW5lcmFsJyksCiAgICAgICAgICAgIHByZXNlcnZlX2RlZmF1bHQ9RmFsc2UsCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLkNyZWF0ZU1vZGVsKAogICAgICAgICAgICBuYW1lPSdpbnZvaWNlJywKICAgICAgICAgICAgZmllbGRzPVsKICAgICAgICAgICAgICAgICgnbnVtYmVyJywgbW9kZWxzLkludGVnZXJGaWVsZCgpKSwKICAgICAgICAgICAgICAgICgndW5pdFR5cGUnLCBtb2RlbHMuVGV4dEZpZWxkKCkpLAogICAgICAgICAgICAgICAgKCd1bml0TmFtZScsIG1vZGVscy5UZXh0RmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ2FjY291bnROdW1iZXInLCBtb2RlbHMuVGV4dEZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSkpLAogICAgICAgICAgICAgICAgKCd0b1BheScsIG1vZGVscy5EZWNpbWFsRmllbGQoYmxhbms9VHJ1ZSwgZGVjaW1hbF9wbGFjZXM9OCwgbWF4X2RpZ2l0cz0xOCwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ3Jvd3MnLCBtb2RlbHMuSlNPTkZpZWxkKCkpLAogICAgICAgICAgICAgICAgKCdzdGF0dXMnLCBtb2RlbHMuVGV4dEZpZWxkKCkpLAogICAgICAgICAgICAgICAgKCdpZCcsIG1vZGVscy5VVUlERmllbGQocHJpbWFyeV9rZXk9VHJ1ZSwgc2VyaWFsaXplPUZhbHNlKSksCiAgICAgICAgICAgICAgICAoJ3YnLCBtb2RlbHMuSW50ZWdlckZpZWxkKGRlZmF1bHQ9MSkpLAogICAgICAgICAgICAgICAgKCdjcmVhdGVkQXQnLCBtb2RlbHMuRGF0ZVRpbWVGaWVsZChibGFuaz1UcnVlLCBkYl9pbmRleD1UcnVlLCBudWxsPVRydWUpKSwKICAgICAgICAgICAgICAgICgndXBkYXRlZEF0JywgbW9kZWxzLkRhdGVUaW1lRmllbGQoYmxhbms9VHJ1ZSwgZGJfaW5kZXg9VHJ1ZSwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ2RlbGV0ZWRBdCcsIG1vZGVscy5EYXRlVGltZUZpZWxkKGJsYW5rPVRydWUsIGRiX2luZGV4PVRydWUsIG51bGw9VHJ1ZSkpLAogICAgICAgICAgICAgICAgKCduZXdJZCcsIG1vZGVscy5VVUlERmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSksCiAgICAgICAgICAgICAgICAoJ2R2JywgbW9kZWxzLkludGVnZXJGaWVsZCgpKSwKICAgICAgICAgICAgICAgICgnc2VuZGVyJywgbW9kZWxzLkpTT05GaWVsZCgpKSwKICAgICAgICAgICAgICAgICgnY2xpZW50JywgbW9kZWxzLkZvcmVpZ25LZXkoYmxhbms9VHJ1ZSwgZGJfY29sdW1uPSdjbGllbnQnLCBudWxsPVRydWUsIG9uX2RlbGV0ZT1kamFuZ28uZGIubW9kZWxzLmRlbGV0aW9uLlNFVF9OVUxMLCByZWxhdGVkX25hbWU9JysnLCB0bz0nX2RqYW5nb19zY2hlbWEudXNlcicpKSwKICAgICAgICAgICAgICAgICgnY29udGFjdCcsIG1vZGVscy5Gb3JlaWduS2V5KGJsYW5rPVRydWUsIGRiX2NvbHVtbj0nY29udGFjdCcsIG51bGw9VHJ1ZSwgb25fZGVsZXRlPWRqYW5nby5kYi5tb2RlbHMuZGVsZXRpb24uU0VUX05VTEwsIHJlbGF0ZWRfbmFtZT0nKycsIHRvPSdfZGphbmdvX3NjaGVtYS5jb250YWN0JykpLAogICAgICAgICAgICAgICAgKCdjb250ZXh0JywgbW9kZWxzLkZvcmVpZ25LZXkoZGJfY29sdW1uPSdjb250ZXh0Jywgb25fZGVsZXRlPWRqYW5nby5kYi5tb2RlbHMuZGVsZXRpb24uUFJPVEVDVCwgcmVsYXRlZF9uYW1lPScrJywgdG89J19kamFuZ29fc2NoZW1hLmludm9pY2Vjb250ZXh0JykpLAogICAgICAgICAgICAgICAgKCdjcmVhdGVkQnknLCBtb2RlbHMuRm9yZWlnbktleShibGFuaz1UcnVlLCBkYl9jb2x1bW49J2NyZWF0ZWRCeScsIG51bGw9VHJ1ZSwgb25fZGVsZXRlPWRqYW5nby5kYi5tb2RlbHMuZGVsZXRpb24uU0VUX05VTEwsIHJlbGF0ZWRfbmFtZT0nKycsIHRvPSdfZGphbmdvX3NjaGVtYS51c2VyJykpLAogICAgICAgICAgICAgICAgKCdwcm9wZXJ0eScsIG1vZGVscy5Gb3JlaWduS2V5KGJsYW5rPVRydWUsIGRiX2NvbHVtbj0ncHJvcGVydHknLCBudWxsPVRydWUsIG9uX2RlbGV0ZT1kamFuZ28uZGIubW9kZWxzLmRlbGV0aW9uLlNFVF9OVUxMLCByZWxhdGVkX25hbWU9JysnLCB0bz0nX2RqYW5nb19zY2hlbWEucHJvcGVydHknKSksCiAgICAgICAgICAgICAgICAoJ3RpY2tldCcsIG1vZGVscy5Gb3JlaWduS2V5KGJsYW5rPVRydWUsIGRiX2NvbHVtbj0ndGlja2V0JywgbnVsbD1UcnVlLCBvbl9kZWxldGU9ZGphbmdvLmRiLm1vZGVscy5kZWxldGlvbi5TRVRfTlVMTCwgcmVsYXRlZF9uYW1lPScrJywgdG89J19kamFuZ29fc2NoZW1hLnRpY2tldCcpKSwKICAgICAgICAgICAgICAgICgndXBkYXRlZEJ5JywgbW9kZWxzLkZvcmVpZ25LZXkoYmxhbms9VHJ1ZSwgZGJfY29sdW1uPSd1cGRhdGVkQnknLCBudWxsPVRydWUsIG9uX2RlbGV0ZT1kamFuZ28uZGIubW9kZWxzLmRlbGV0aW9uLlNFVF9OVUxMLCByZWxhdGVkX25hbWU9JysnLCB0bz0nX2RqYW5nb19zY2hlbWEudXNlcicpKSwKICAgICAgICAgICAgXSwKICAgICAgICAgICAgb3B0aW9ucz17CiAgICAgICAgICAgICAgICAnZGJfdGFibGUnOiAnSW52b2ljZScsCiAgICAgICAgICAgIH0sCiAgICAgICAgKSwKICAgIF0K

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Create model invoicehistoryrecord
--
CREATE TABLE "InvoiceHistoryRecord" ("context" uuid NULL, "number" jsonb NULL, "property" uuid NULL, "unitType" text NULL, "unitName" text NULL, "accountNumber" text NULL, "toPay" numeric(18, 4) NULL, "rows" jsonb NULL, "ticket" uuid NULL, "contact" uuid NULL, "client" uuid NULL, "status" text NULL, "id" uuid NOT NULL PRIMARY KEY, "v" integer NULL, "createdAt" timestamp with time zone NULL, "updatedAt" timestamp with time zone NULL, "createdBy" uuid NULL, "updatedBy" uuid NULL, "deletedAt" timestamp with time zone NULL, "newId" jsonb NULL, "dv" integer NULL, "sender" jsonb NULL, "history_date" timestamp with time zone NOT NULL, "history_action" varchar(50) NOT NULL, "history_id" uuid NOT NULL);
--
-- Rename field vat on invoicecontext to vatPercent
--
ALTER TABLE "InvoiceContext" RENAME COLUMN "vat" TO "vatPercent";
--
-- Rename field vat on invoicecontexthistoryrecord to vatPercent
--
ALTER TABLE "InvoiceContextHistoryRecord" RENAME COLUMN "vat" TO "vatPercent";
--
-- Add field currencyCode to invoicecontext
--
ALTER TABLE "InvoiceContext" ADD COLUMN "currencyCode" text DEFAULT 'RUB' NOT NULL;
ALTER TABLE "InvoiceContext" ALTER COLUMN "currencyCode" DROP DEFAULT;
--
-- Add field salesTaxPercent to invoicecontext
--
ALTER TABLE "InvoiceContext" ADD COLUMN "salesTaxPercent" numeric(18, 4) NULL;
--
-- Add field currencyCode to invoicecontexthistoryrecord
--
ALTER TABLE "InvoiceContextHistoryRecord" ADD COLUMN "currencyCode" text NULL;
--
-- Add field salesTaxPercent to invoicecontexthistoryrecord
--
ALTER TABLE "InvoiceContextHistoryRecord" ADD COLUMN "salesTaxPercent" numeric(18, 4) NULL;
--
-- Alter field taxRegime on invoicecontext
--
ALTER TABLE "InvoiceContext" ALTER COLUMN "taxRegime" SET DEFAULT 'general';
UPDATE "InvoiceContext" SET "taxRegime" = 'general' WHERE "taxRegime" IS NULL; SET CONSTRAINTS ALL IMMEDIATE;
ALTER TABLE "InvoiceContext" ALTER COLUMN "taxRegime" SET NOT NULL;
ALTER TABLE "InvoiceContext" ALTER COLUMN "taxRegime" DROP DEFAULT;
--
-- Create model invoice
--
CREATE TABLE "Invoice" ("number" integer NOT NULL, "unitType" text NOT NULL, "unitName" text NULL, "accountNumber" text NULL, "toPay" numeric(18, 8) NULL, "rows" jsonb NOT NULL, "status" text NOT NULL, "id" uuid NOT NULL PRIMARY KEY, "v" integer NOT NULL, "createdAt" timestamp with time zone NULL, "updatedAt" timestamp with time zone NULL, "deletedAt" timestamp with time zone NULL, "newId" uuid NULL, "dv" integer NOT NULL, "sender" jsonb NOT NULL, "client" uuid NULL, "contact" uuid NULL, "context" uuid NOT NULL, "createdBy" uuid NULL, "property" uuid NULL, "ticket" uuid NULL, "updatedBy" uuid NULL);
CREATE INDEX "InvoiceHistoryRecord_history_id_d42ebe41" ON "InvoiceHistoryRecord" ("history_id");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_client_95ec5986_fk_User_id" FOREIGN KEY ("client") REFERENCES "User" ("id") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contact_56992863_fk_Contact_id" FOREIGN KEY ("contact") REFERENCES "Contact" ("id") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_context_f82e2da9_fk_InvoiceContext_id" FOREIGN KEY ("context") REFERENCES "InvoiceContext" ("id") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdBy_daaa134b_fk_User_id" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_property_117054a5_fk_Property_id" FOREIGN KEY ("property") REFERENCES "Property" ("id") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_ticket_eb180e52_fk_Ticket_id" FOREIGN KEY ("ticket") REFERENCES "Ticket" ("id") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_updatedBy_a40231e2_fk_User_id" FOREIGN KEY ("updatedBy") REFERENCES "User" ("id") DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX "Invoice_createdAt_28992401" ON "Invoice" ("createdAt");
CREATE INDEX "Invoice_updatedAt_ec3478b9" ON "Invoice" ("updatedAt");
CREATE INDEX "Invoice_deletedAt_7cf57a3c" ON "Invoice" ("deletedAt");
CREATE INDEX "Invoice_client_95ec5986" ON "Invoice" ("client");
CREATE INDEX "Invoice_contact_56992863" ON "Invoice" ("contact");
CREATE INDEX "Invoice_context_f82e2da9" ON "Invoice" ("context");
CREATE INDEX "Invoice_createdBy_daaa134b" ON "Invoice" ("createdBy");
CREATE INDEX "Invoice_property_117054a5" ON "Invoice" ("property");
CREATE INDEX "Invoice_ticket_eb180e52" ON "Invoice" ("ticket");
CREATE INDEX "Invoice_updatedBy_a40231e2" ON "Invoice" ("updatedBy");
COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Create model invoice
--
DROP TABLE "Invoice" CASCADE;
--
-- Alter field taxRegime on invoicecontext
--
ALTER TABLE "InvoiceContext" ALTER COLUMN "taxRegime" DROP NOT NULL;
--
-- Add field salesTaxPercent to invoicecontexthistoryrecord
--
ALTER TABLE "InvoiceContextHistoryRecord" DROP COLUMN "salesTaxPercent" CASCADE;
--
-- Add field currencyCode to invoicecontexthistoryrecord
--
ALTER TABLE "InvoiceContextHistoryRecord" DROP COLUMN "currencyCode" CASCADE;
--
-- Add field salesTaxPercent to invoicecontext
--
ALTER TABLE "InvoiceContext" DROP COLUMN "salesTaxPercent" CASCADE;
--
-- Add field currencyCode to invoicecontext
--
ALTER TABLE "InvoiceContext" DROP COLUMN "currencyCode" CASCADE;
--
-- Rename field vat on invoicecontexthistoryrecord to vatPercent
--
ALTER TABLE "InvoiceContextHistoryRecord" RENAME COLUMN "vatPercent" TO "vat";
--
-- Rename field vat on invoicecontext to vatPercent
--
ALTER TABLE "InvoiceContext" RENAME COLUMN "vatPercent" TO "vat";
--
-- Create model invoicehistoryrecord
--
DROP TABLE "InvoiceHistoryRecord" CASCADE;
COMMIT;

    `)
}
