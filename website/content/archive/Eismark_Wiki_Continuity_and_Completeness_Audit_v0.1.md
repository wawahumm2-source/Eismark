# Eismark Wiki Continuity and Completeness Audit v0.1

Status: Development Audit / Non-Canon

Audit Date: 2026-07-18

Authority Checked:

1. ECD Master Index as source map.
2. Eismark ECD Archive as canon authority.
3. Eismark Audit Register as the record of resolved and pending canon conflicts.
4. Eismark Readable Guide as the parallel reader-facing document.
5. Website manifest, deployed image references, and rendered handbook as publication surfaces.

This document records audit results. It does not create canon by itself.

## Structural Result

- ECD archive entries: 190.
- Readable-guide entries: 190.
- Master-index records: 224, including audit, DEV, and evolution records that do not require archive bodies.
- Duplicate archive IDs: none.
- Duplicate index IDs: none.
- Canon archive entries missing from the index: none.
- Reader-facing canon entries missing from the readable guide: none.
- Readable-guide entries without ECD bodies: none.
- Broken Related Entries IDs: none.
- Related-entry status mismatches: none after this audit pass.
- Referenced deployed image files missing from website assets: none.

The repeatable check is website/scripts/audit-lore.mjs.

## Resolved In This Pass

### Early Creation Chronology

The resolved CAP-003 chronology states:

1. The Creator creates the First Ones.
2. The Creator creates Creation.
3. The Creator sends the First Ones into Vardheim.

The history chapter previously contradicted this by placing Creation at HIS-001 and stating that the First Ones could be created afterward. The entries are now aligned:

- HIS-001 - The First Ones Are Created.
- HIS-002 - Creation.

The ECD Archive, readable guide, master index, audit register, and archived compile document were corrected together.

### Great Forgetting Sequence

HIS-014 through HIS-016 looked strictly consecutive even though their events overlap. The chronology is now explicit:

1. The Joivians disappear.
2. Uriel separates from the Communion.
3. The Great Forgetting begins.
4. The Great Pilgrimage begins.
5. The Great Forgetting worsens across the generations in which Kaltheim and Veloria emerge.

The history IDs group related developments; they do not imply that the Great Forgetting began after Veloria already existed.

### Pantheon and Species Patrons

Locked species entries named Elaris, Khorun, and Grom, but REL-001 omitted them. REL-001 now includes:

- Elaris: ancestral memory, continuity, and elven inheritance.
- Khorun: endurance, mountains, craft, and dwarven inheritance.
- Grom: strength, courage, mastered instinct, and orcish inheritance.

The Great Six are now explicitly identified as the Iron Church's emphasized First Ones rather than the entire pantheon. The ECD names at least eighteen First Ones; the exact historical total remains unfinalized.

### Thin Species Entries

Humans, Giants, Gnomes, and Halflings previously had one-sentence entries. They now preserve the implications already supported by their locked First One associations without inventing complete cultures.

Goblins remain separate from Dwarves and now appear in correct numerical order after SPE-008.

### Status and Index Drift

- Three Related Entries links still described locked SOC-003 as Future. They now say Locked.
- MON-012 described CAM-003 as Locked even though CAM-003 is Under Review. The link now matches the actual status.
- The Audit Register summary claimed nineteen resolved CAP items. The register actually contains seventeen resolved and three pending items; the count now matches the entries.
- MON-006 was removed during the Aberrations merge but left an unexplained numbering gap. The Master Index now marks it as a retired ID whose material was merged into MON-002.

### Publication Status Leakage

The public handbook previously exposed Under Review monsters, equipment, and placeholder NPCs while the reader cleaned their status labels from article pages. Development material could therefore appear to players as locked canon.

Under Review entries now default to Draft / GM-only visibility. A GM/Editor may explicitly publish an individual entry through its visibility control when showing unfinished material is intentional.

The home page's Start with History feature also pointed directly to Creation after the chronology was corrected. It now selects the first visible history entry, The First Ones Are Created.

GM-locked entries also displayed a Public visibility selection even though section and title policy prevented publication. Their controls now identify the GM-only policy and disable the inapplicable visibility action.

### Safe Lore Expansion

The following entries were expanded only with facts already locked elsewhere in the ECD:

- REL-002 - The Iron Church.
- GEO-002 - The Iron Mountains.
- GEO-003 - The Crown Lands.
- GEO-006 - Veloria.
- GEO-007 - Voss.
- GEO-008 - Rauk.
- GEO-009 - Lan Cao.
- GEO-010 - Ostmark.
- GEO-011 - The Sylvan Veil.
- GEO-014 - The Iron Coast and Shattered Isles.
- MIL-003 - Voss Doctrine.
- MIL-004 - Rauk Doctrine.
- MIL-005 - Lan Cao Doctrine.

## Open Canon Decisions

These cannot be filled safely from current locked canon.

### CAP-010 - Ancient Kaltheim Geography

Ancient Kaltheim's exact location and relationship to modern Kaltheim and Veloria still require a final map decision. Existing prose can describe historical relationships, but exact borders or coordinates should not be locked yet.

### CAP-019 - Free Marches and Final Map

The political identity of the Free Marches is locked. Exact borders, neighboring relationships, and final cartographic placement remain provisional.

### CAP-020 - Project Resurgence

The project must decide whether Project Resurgence is:

- active hidden canon,
- an archived campaign concept, or
- an under-review option that exists only if selected for the campaign.

No neutral wording can erase this conflict because the alternatives produce different GM truths.

### COS-004 - The Entity

The Entity entry has strong working constraints but remains Under Review. The unresolved issue is not its behavior; that is well defined. The project still needs to decide whether any additional statement about its origin, awareness, or relationship to realities beyond Creation can ever become knowable.

### MON-005 - Dragons

Dragon morality and rarity are usable. Dragon origin, Dragonborn theology, ancient Dragon relationships, and the role of Drakharion remain open. Older descent claims should stay excluded.

### MIL-010 - Kaltheim Armor Families

The visual and equipment taxonomy is not complete enough to lock. Finalization needs named armor families, role distinctions, procurement logic, and visual references.

### CAM-003 and CAM-004

The Abandoned One exists as an NPC and Joivian truth, but its campaign use remains Under Review. Project Resurgence is directly connected to the CAP-020 decision.

### Under-Review NPC Roster

NPC-005 through NPC-027 contain useful recovered character material, but most still lack one or more of:

- final name approval,
- stable office or faction relationship,
- age and chronology checks,
- campaign role,
- public-versus-GM knowledge boundary,
- visual reference,
- confirmation that the figure exists in the current campaign.

King Alaric IV is explicitly still a placeholder.

Because every currently Locked figure is protected by GM-only title policy and every remaining figure is Under Review, the public Figures chapter is presently empty and therefore hidden. This is correct behavior, not a display failure. At least one player-safe figure should be completed and explicitly published before the chapter is restored to public navigation.

## Largest Lore Gaps

### Major Nations

Voss, Rauk, Lan Cao, and Ostmark have locked identities but remain much thinner than Kaltheim and Veloria. Each needs:

- government structure,
- internal political factions,
- ordinary civic life,
- religion,
- class structure,
- postwar grievances,
- foreign-policy goals,
- military command culture,
- signature cities,
- names and naming conventions.

Recovered backlog material exists for all four, but it is not canon authority and requires explicit promotion.

### Peoples

Giant, Gnomish, and Halfling divine origins are now clearer, but their living cultures remain largely unwritten. Tieflings appear in visual design concepts but currently have no ECD species entry. They should not appear as established public canon until their origin and place in Eismark are decided.

The project also needs a consistent answer for whether every playable people has:

- a First One patron,
- a creation tradition,
- a distinct response to the Great Forgetting,
- one or more modern homelands,
- a diaspora history,
- common stereotypes and internal disagreements.

### Religion Outside Kaltheim

The Iron Church is well developed. Other faiths are not. The wiki needs public religious life for:

- Veloria,
- Voss,
- Rauk,
- Lan Cao,
- Ostmark,
- Gn'ure,
- the Sylvan Veil,
- the Shattered Isles,
- the Free Marches.

This should include disagreement, reform movements, funerary practice, holidays, sacred architecture, and what ordinary believers think happens after death.

### Daily Life

The setting has strong institutions but less ordinary texture. Priority subjects include:

- food and drink,
- housing,
- work schedules,
- courtship and marriage outside Kaltheim,
- fashion and uniforms,
- newspapers and radio,
- popular music,
- sports and recreation,
- slang and insults,
- funerals and mourning,
- childhood,
- disability and medicine,
- travel costs and border controls.

These details are the strongest route to making the world feel inhabited rather than merely documented.

### Cities and Local Places

Many map labels have no individual entries. Major capitals and campaign hubs need articles covering districts, landmarks, smells, sounds, class divisions, transit, law enforcement, nightlife, sacred spaces, and adventure hooks.

### Economics

Marks and Crosses establish currency symbolism, but the economy still needs wages, prices, banking, trade routes, industrial ownership, debt, labor movements, black markets, and the economic consequences of the Great Continental War.

### Law Beyond Two Entries

Kaltheimian justice and the Velorian Public Safety and Temperance Act are developed. The broader legal systems of Veloria and the other nations are not. The wiki needs civil procedure, property law, labor law, press freedom, arcane regulation, citizenship disputes, and frontier jurisdiction.

## Reference Image Priorities

Five deployed visual references currently exist:

- The Blood.
- Brother Remembrance in monastic form.
- Remembrance the Unyielding in war.
- The tentative map.
- Uriel in Joivian form.

The mechanical gap audit identifies entries without direct image links, but not every article needs art. The highest-value next images are:

1. One establishing image for each major nation.
2. One public-facing portrait or cultural scene for each playable people.
3. Kaltheimian and Velorian technology comparison plates.
4. Major capitals and campaign hubs.
5. Consecrated, Exalted, Automatons, and the three Joivian frame patterns.
6. Core monster categories with clear separation between Bloodspawn, aberrations, undead, and regional creatures.
7. Finalized major NPC portraits after names and roles are locked.

Do not commission final art for map-sensitive regions, placeholder NPCs, Project Resurgence, or unsettled dragon theology before the corresponding canon decision.

## Recommended Canonization Order

1. Resolve CAP-020 because it affects campaign truth and GM visibility.
2. Complete the final map and close CAP-010 and CAP-019.
3. Promote or reject the recovered nation expansions for Voss, Rauk, Lan Cao, and Ostmark.
4. Define missing playable peoples, beginning with Tieflings if they are intended to remain on the website.
5. Establish non-Iron-Church religious life.
6. Build city and daily-life entries.
7. Commission reference images only after the associated text is stable.
