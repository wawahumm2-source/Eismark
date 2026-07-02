# Eismark Canon Documents

This repository is the online home for the Eismark Canon Document system: the ECD Archive, Master Index, readable guide, audit register, and supporting protocol files.

The ECD Archive is the source of truth for canon. The readable guide is maintained as a parallel companion for easier browsing and campaign use.

## Primary Documents

- [ECD Master Index](outputs/ECD_Master_Index_v0.1.md)
- [ECD Archive](outputs/Eismark_ECD_Archive_v0.1.md)
- [Readable Guide](outputs/Eismark_Readable_Guide_v0.1.md)
- [Audit Register](outputs/Eismark_Audit_Register_v0.3.md)
- [Protocol Addendum](outputs/ECD_Protocol_Addendum_v0.2.md)

## Online Browser

The `website/` folder is kept in the repository so the ECD can be deployed as a browsable online archive through Netlify.

For Netlify deployment, use:

- Base directory: `website`
- Build command: `npm run build`
- Publish directory: `.next`

## Canon Status

Canon entries use these status labels:

- `Locked`: accepted source-of-truth canon.
- `Under Review`: canon-adjacent material awaiting audit, final placement, or later clarification.
- `DEV`: active design work that is not canon until promoted.
- `Archived Non-Canon`: preserved development material that has been superseded or deprecated.

## Maintenance Rule

When reader-facing lore changes, update both the ECD Archive and the Readable Guide, then update the Master Index as needed.
