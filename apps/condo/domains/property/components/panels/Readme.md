## Folder contains all panels from the property page

For now, there are only 2 panels: 
1. Building panel - where we design the structure of a property: sections, floors, units (flats) ...
1. Resident panel - a place where we gather all information about people who live in flats
1. General information - this panel is in TODO

Each panel can have read and edit mode.

# Create validation schema for json from typescript type
```bash
npm install typescript-json-schema -g

typescript-json-schema './MapType.ts' BuildingMap -o ./schema.json --titles --noExtraProps --required --strictNullChecks --id

--noExtraProps # do not allow to save extra fields 

```