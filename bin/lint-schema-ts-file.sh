# Validates whether generated schema.ts file is up to date with actual GraphQL API
# Renames original schema.ts file, generates a new one, compares and rolls changes back

mv apps/condo/schema.ts apps/condo/schema.temp.ts
yarn workspace @app/condo maketypes
FILES_ARE_IDENTICAL="$(cmp --silent -- "apps/condo/schema.ts" "apps/condo/schema.temp.ts"; echo $?)"
rm apps/condo/schema.ts
mv apps/condo/schema.temp.ts apps/condo/schema.ts
if [[ $FILES_ARE_IDENTICAL -ne 0 ]]; then
  echo "Error: Outdated schema.ts file! Please execute `maketypes` script and commit changes"
  exit 1
else
  echo "schema.ts file is up to date"
fi
