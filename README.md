# Eismark Canon Documents

This repository is the online home for the Eismark Canon Document system: the ECD Archive, Master Index, readable guide, audit register, and supporting protocol files.

The ECD Archive is the source of truth for canon. The readable guide is maintained as a parallel companion for easier browsing and campaign use.

## Primary Documents

- [ECD Master Index](outputs/ECD_Master_Index_v0.1.md)
- [ECD Archive](outputs/Eismark_ECD_Archive_v0.1.md)
- [Readable Guide](outputs/Eismark_Readable_Guide_v0.1.md)
- [Audit Register](outputs/Eismark_Audit_Register_v0.3.md)
- [Protocol Addendum](outputs/ECD_Protocol_Addendum_v0.2.md)
- [Source Hierarchy and Canonization Workflow](outputs/ECD_Source_Hierarchy_and_Canonization_Workflow_v0.1.md)
- [New Canonization Ideas Backlog](outputs/Eismark_New_Canonization_Ideas_From_Chat_Export_v0.1.md)
- [Additional Interesting Ideas Second Pass](outputs/Eismark_Additional_Interesting_Ideas_Second_Pass_v0.1.md)
- [New Canonization Ideas Triage](outputs/Eismark_New_Canonization_Ideas_Triage_v0.1.md)

## Online Browser

The `website/` folder is kept in the repository so the ECD can be deployed as a browsable online archive through Netlify from this GitHub repository.

This repository includes a root `netlify.toml`, so a GitHub-connected Netlify site should automatically use:

- Base directory: `website`
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: `20`

GitHub Pages is not the preferred target for this site because the handbook uses Next.js route handlers for GM/player filtering and session state.

GM/Editor mode is opened from the site with `Alt+G` and the local editor password. It can save handbook edits, upload deployable image assets, and mark entries as public, draft, or hidden for review before committing the repository back to GitHub.

## Canon Status

Canon entries use these status labels:

- `Locked`: accepted source-of-truth canon.
- `Under Review`: canon-adjacent material awaiting audit, final placement, or later clarification.
- `DEV`: active design work that is not canon until promoted.
- `Archived Non-Canon`: preserved development material that has been superseded or deprecated.

The New Canonization Ideas backlog is intake material only. It is useful for recovering strong ideas from previous chats, but it is not a canon authority. If it conflicts with the ECD Archive, the ECD Archive wins unless a topic is explicitly reopened for retcon or promotion.

## Maintenance Rule

When reader-facing lore changes, update both the ECD Archive and the Readable Guide, then update the Master Index as needed.
