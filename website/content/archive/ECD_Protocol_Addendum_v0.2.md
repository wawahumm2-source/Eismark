# ECD Protocol Addendum v0.2

Status: Draft Protocol Update

Purpose: This addendum extends ECD Protocol v1.0 to separate canon, contradictions, superseded canon, active development work, and recovered development history.

## Core Rule

The ECD remains canon-only.

Do not import unfinished design work, unresolved ideas, deprecated drafts, or recovered conversation fragments into the ECD as canon entries. Preserve them in the correct supporting category until a final decision is made.

## Source of Truth Hierarchy

The ECD is the living source of truth for Eismark.

Earlier PDFs, recovered chats, images, drafts, and markdown exports are source material for the ECD. They are evidence, context, and recovery material, but they are not equal authorities once the ECD has ruled on a subject.

Authority structure:

```text
ECD
+-- Canon
+-- Audit Register
+-- DEV
+-- ARC
+-- ARP
```

Definitions:

- Canon: locked ECD entries and resolved canon rulings.
- Audit Register: CAP entries and other formal contradiction tracking used to clarify or repair canon.
- DEV: active design work that is not canon until promoted.
- ARC: development history and important recovered conversations.
- ARP: recovery reports explaining what was recovered, from where, and how reliable it is.

When an ECD entry conflicts with an older PDF or recovered source, the ECD entry takes precedence unless the creator reopens the issue in the Audit Register.

## Parallel Document Rule

The ECD Archive and the Eismark Reader Guide are distinct but parallel documents.

- The ECD Archive is the source-of-truth database. It preserves IDs, canon status, sources, related entries, audit links, DEV/ARC/ARP structure, and administrative metadata.
- The Eismark Reader Guide is the reader-facing companion. It presents the same accepted lore in a cleaner, more approachable format for browsing, sharing, and campaign reading.
- Lore changes should be applied to both documents when they affect reader-facing canon.
- Database-only changes, such as source IDs, internal audit wiring, and recovery metadata, may remain only in the ECD Archive.
- Reader-facing summaries may be clearer and more polished, but they must not contradict the ECD Archive.
- If the two documents ever conflict, the ECD Archive takes precedence until the Reader Guide is updated.

## Four Supporting Categories

### 1. CAP - Canon Inconsistencies

Definition: Two or more canon sources conflict.

Use when action is required before ECD v1.0 can be locked.

Examples:

- HIS-005 numbering conflict.
- Joivian construction conflict.
- Great Forgetting timing conflict.

Required Fields:

- Unique ID
- Title
- Status
- Conflicting Sources
- Conflict Summary
- Required Action
- Related ECD Entries

### 2. Canon Evolutions

Definition: Old canon or near-canon has been replaced by newer canon.

Use for historical interest only. No action is required unless old wording keeps reappearing.

Examples:

- "The Free City of Veloria."
- "The Iron Marches of Kaltheim."
- Hararozther's cleansing role if confirmed superseded by timeline v3.

Required Fields:

- Unique ID
- Superseded Concept
- Replacement / Current Canon
- Source Trail
- Notes

### 3. DEV - Development Evolutions

Definition: Ideas still being actively designed, revised, or tested.

These are not canon and may change tomorrow. They should not be imported into the ECD until a final decision is made.

Examples:

- Heavy Weapons Harness redesign.
- Flame Suit / Heavy Weapons Harness merge.
- Exalted Engine visual redesign until locked.
- Any ongoing equipment overhaul.

Required Fields:

- Unique ID
- Title
- Status: Work in Progress
- Development History
- Current Status
- Notes
- Promotion Criteria

### 4. Archive Notes

Definition: Recovered ideas that were never promoted to canon.

Use for interesting development history, inspiration, discarded possibilities, or context. No action required.

Examples:

- Early design sketches.
- Brainstorming that never became canon.
- Recovered discussions useful for tone but not binding.

Required Fields:

- Unique ID
- Title
- Summary
- Source
- Why It Matters

## Relationship Between Systems

- ECD: canon only.
- ECD is the source of truth; all other files are supporting systems or source material.
- ARC: development history and important recovered conversations.
- ARP: recovery reports explaining what was recovered and from where.
- CAP: canon inconsistencies requiring ruling.
- DEV: active design work not yet canon.
- Canon Evolutions: superseded canon, preserved for history.
- Archive Notes: recovered non-canon material.

## Promotion Rule

A DEV entry may become ECD canon only when the creator makes a final decision.

When promoted:

1. Create or update the relevant ECD entry.
2. Preserve the DEV entry as development history.
3. Add a source note showing the promotion decision.
4. Remove the item from active DEV tracking.

## Example

### DEV-001 - Heavy Weapons Harness

Status: Work in Progress

Development History:

- Early concepts: Flame Suit, Fire Support Harness, Heavy Weapons Harness.
- Intermediate concept: merge the Flame Suit and Heavy Weapons Harness into a single armor platform.

Current Status:

- Non-canon.
- Active design work.
- Awaiting final equipment overhaul.

Notes:

This represents the evolution of an unfinished design rather than established canon. Future revisions may completely replace this concept.
