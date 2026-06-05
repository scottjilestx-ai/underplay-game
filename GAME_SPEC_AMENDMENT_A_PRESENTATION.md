# Underplay — Spec Amendment A: Presentation (Cards, Surface, Characters, Animation, Audio)

**Amends:** `GAME_SPEC.md`. The base spec states that visual design, card art, graphics, animation, and
sound are out of scope. **This amendment adds that presentation layer** and is normative for it. It
defines a **photorealistic** look and feel: realistic cards, a realistic play surface, realistic
character opponents, realistic shuffle/deal/play animation, and realistic gameplay sound.

**Precedence & non-negotiables.** Presentation must **never** change game logic, the rules in
`GAME_SPEC.md` §1–§9, the tunables in §13, or the **hidden-information / redaction rules** in
`GAME_SPEC.md` §10. Specifically:

- Face-down cards render as **face-down** for **everyone, including their owner** — their value is
  revealed only at the instant they are flipped/played. Photorealism must not leak a hidden value.
- Opponents' hand cards render as **backs** (or a fanned count), never their faces.
- If any presentation feature (a 3D camera, a slow animation, a heavy asset) would obscure or delay a
  legal action, **gameplay clarity wins** — see §A8.

---

## A1. Art direction

- **Overall target:** **photorealistic** — the game should read as a real deck of cards on a real
  table, viewed in a real, softly-lit room, with real people (or lifelike characters) seated around it.
- **Reference register:** premium physical card game / casino-quality table, warm and tactile, not
  cartoon or flat-vector. Think believable materials (paper/linen card stock, felt, wood, metal),
  physically-plausible lighting and shadows, subtle depth of field.
- **Tone:** inviting and classy, not garish. Realism is in service of *tactility and clarity*, not
  spectacle — the player must always be able to read the table at a glance (§A8).
- **Consistency:** one coherent lighting model, color temperature, and material vocabulary across
  cards, surface, characters, and effects.

---

## A2. Rendering approach (implementer's choice, with guidance)

Two viable paths; pick one and document it. Either must satisfy §A8–§A9.

1. **Real-time 3D** (recommended for the most convincing shuffle/deal/play): cards, table, and
   characters as 3D assets (PBR materials) rendered live, with a mostly-fixed "seat" camera looking
   down at the table. Pros: physically-real motion and lighting, free re-lighting, easy depth of
   field. Cons: heavier; needs LODs and a fallback.
2. **Pre-rendered + 2D compositing:** high-resolution pre-rendered card/table/character art and
   pre-baked animation sequences (sprite sheets / video) composited in 2D. Pros: cheaper at runtime,
   art-directed frames. Cons: less dynamic; animations are fixed paths.

A **hybrid** is acceptable (pre-rendered backgrounds/characters + real-time 3D cards). Whatever the
approach, the **card-value layer must be a crisp, resolution-independent overlay** so values stay
razor-sharp at any size (see §A3, §A8).

---

## A3. Cards

**Goal:** each card looks and behaves like a real physical playing card — with believable stock,
faces, backs, edges, thickness, slight wear, and light response — while remaining **instantly
legible**.

### A3.1 Physical realism
- Real card-stock material: subtle paper/linen texture, matte-to-satin finish with soft specular
  highlights, gentle micro-bevel and rounded corners, visible (thin) edge thickness when cards stack
  or lift.
- Plausible, individualized wear: faint edge softening, occasional micro-scuffs — **subtle**, never
  enough to impair reading.
- Cards cast and receive **soft contact shadows** on the surface and on each other; lifted/dragged
  cards cast a slightly larger, softer shadow (height cue).
- Light response: as a card tilts during motion, highlights and shadows shift believably.

### A3.2 Faces & readability (gameplay-critical)
- 12 number ranks (`2..10, J, Q, K`) plus the two special cards. Suits may be shown for realism but
  carry **no** gameplay meaning (matching is by value — see `GAME_SPEC.md` §3).
- **Legibility is a hard requirement.** Regardless of photoreal styling, a player must read at a glance
  (a) the **value of the top card of the Stack** (the constraint **T**) and (b) the **values of their
  own hand**. Keep clear corner indices / value markings; never let texture, glare, perspective, or
  depth-of-field blur make a value ambiguous. When in doubt, bias the value markings larger/clearer.
- The two specials must be **immediately distinguishable** from number cards and from each other:
  - **CLEAR card (Undercut)** — distinct, recognizable face reading as "clears the pile."
  - **SKIP card (Overcut)** — distinct, recognizable face reading as "skip a player."
  - Their on-card identity should make their effect guessable without a tutorial.

### A3.3 Backs & hidden cards
- A single realistic **card back** design used for: opponents' hand cards, all face-down cards, and the
  undealt/stock pile.
- **Face-down cards always show the back** to everyone including the owner (no peek). Reveal happens
  only at flip time (§A6).

---

## A4. Play surface & environment

- A realistic **table**: e.g., a felt/baize playing surface (with woven texture and a subtle nap) set
  in a wood-rail table, or equivalent believable material. Soft, directional key light with gentle
  ambient fill; soft shadows; a hint of vignette so the play area is the focus.
- Defined, real-looking zones on the surface for: the central **Stack**, the **stock/out-of-play**
  area, each player's **face-up row** and **face-down row**, and a discard/dead-pile area.
- Optional shallow **environment** beyond the table (a softly out-of-focus room) for depth — must not
  distract from the table.
- Subtle ambient life is welcome (e.g., faint dust in a light shaft) but must stay in the background.

---

## A5. Characters (players & opponents)

- Each seat is represented by a **photorealistic character** — a lifelike person seated at the table —
  positioned at their seat around the surface (local player at the bottom/foreground; opponents across
  and to the sides).
- CPU opponents are characters with names/personae (e.g., the default CPU "Botley"); difficulty may be
  reflected in the persona. Humans in online play may have a chosen character/avatar.
- **Idle behavior:** believable small idle motion (breathing, minor weight shifts, occasional glances)
  so seats feel alive, not frozen.
- **Reactions to game events** (subtle, optional but desirable): a look toward the active player on
  turn change; a reaction when **dealt a strong/weak position is not knowable** (so reactions must be
  driven only by *public* events to avoid leaking info — see below); a wince/groan when **skipped**
  (Overcut placed on them); a satisfied reaction on **going out / winning**; a glance at the pile they
  just **picked up**.
- **Hidden-information safety:** character reactions and gaze may only respond to **public** state
  (whose turn it is, a clear, a skip, a pickup count, a win). A character must **never** react in a way
  that reveals their own hidden hand or face-down cards.

---

## A6. Animation

All motion is **realistic** — physically plausible weight, arcs, settle/overshoot, and timing — not
snappy UI tweens. Animations must be **interruptible/skippable** and respect a reduced-motion setting
(§A8). Each animation below is tied to a specific gameplay event from `GAME_SPEC.md`.

### A6.1 Core required animations
| Event (from base spec) | Animation |
|---|---|
| **Shuffle** (round start) | Realistic riffle/bridge or overhand shuffle of the full deck — cards interleaving with believable flex, sound-synced. |
| **Deal** | Cards flick/slide out one at a time to each seat into the three zones, in deal order (4 face-down, then 4 face-up, then 11 hand), with realistic flight arcs and landing. |
| **Play a card** | The played card lifts from hand/table, arcs to the Stack, and lands with a slight settle; the Stack's new top is clearly presented. Multi-card same-value plays fan/stack believably. |
| **Tap-out clear (4+ of a kind)** | The **entire Stack** sweeps off to the dead pile (a satisfying gather-and-clear), leaving the surface empty; emphasize the "you cleared" beat. |
| **CLEAR card (Undercut)** | The Stack is swept out of play and the CLEAR card is consumed; surface returns to empty; the player visibly retains the turn. |
| **Higher-card pickup (V > T)** | The played card stays on top while **the rest of the pile gathers and travels into the player's hand** (the hand visibly grows). For the local player this reads as the pile coming *to you*. This must match the rule precisely: the played card stays, the pile beneath goes to the hand, the turn continues. |
| **SKIP card (Overcut)** | The SKIP card slides from the player and is placed **in front of the chosen opponent**; that opponent is marked as owing a turn; the player retains the turn. On the skipped player's turn, show the card being discarded and the turn passing. |
| **Blind face-down flip** | The face-down card flips up (the reveal moment) and then resolves by its value (land / pickup / clear / skip). The flip is the only moment a face-down value becomes visible. |
| **Turn change** | A clear, believable hand-off of focus to the next active player (camera/lighting/character gaze), including visibly skipping a skipped seat. |
| **Go out / round end** | The winner's last card(s) leave; a round-result beat. |
| **Match end** | A match-winner moment. |

### A6.2 Realism guidance
- Cards have **weight**: arcs ease in/out, land with a small settle/overshoot, and never teleport.
- **Shuffle** and **deal** are the showcase moments — make them convincingly physical and keep them
  tight enough not to stall play (the base spec already gates CPU turns until the deal finishes).
- Keep **per-move** play animations brief and responsive so the game stays fluid; reserve longer,
  cinematic motion for round start (shuffle/deal) and end (win).
- Animations **never** change outcomes — they visualize an already-applied engine result. If an
  animation is skipped, the state is identical.

---

## A7. Audio

Realistic, physically-matched sound effects for gameplay, synced to the animations in §A6. All audio
respects a global **mute** toggle and a volume control; nothing autoplays loudly.

### A7.1 SFX catalog (map each to its event)
| Event | Sound |
|---|---|
| Shuffle | Realistic riffle/bridge shuffle — cards interleaving and the bridge snap. |
| Deal | Per-card flick/slide and soft landing on felt; a light cadence as cards go out. |
| Pick up a card / take the pile (higher play) | Cards sliding together and being gathered into a hand; weight scales with pile size. |
| Play / place a card | A soft card-on-felt (or card-on-card) tap; crisper when landing on a stack. |
| Flip a face-down card | A distinct flip/snap as the card turns face-up. |
| Tap-out clear (4+) | A satisfying sweep/gather of the whole pile off the surface. |
| CLEAR card (Undercut) | A clear/whoosh that reads as "the pile is gone." |
| SKIP card (Overcut) | A distinct "you're skipped" sting as the card is placed in front of a player. |
| Turn change | A subtle cue marking the active player's hand-off. |
| Go out / round win | A positive resolution sound. |
| Match win / lose | A short win or lose stinger. |
| Invalid / blocked action | A gentle, non-harsh negative cue. |

### A7.2 Ambient & music
- Optional low **ambient room tone** (very quiet) for presence.
- Optional, **off-by-default** background music with its own volume control; gameplay SFX must remain
  clearly audible over it.
- Optional, subtle **character vocalizations** (a sigh on being skipped, a chuckle on a win) — public
  events only (§A5), kept tasteful and skippable.

### A7.3 Mixing & behavior
- Per-card deal/shuffle sounds should have **slight pitch/timing variation** so repetition never feels
  robotic.
- Sounds are **synced to the animation** (e.g., the place sound hits on card contact).
- A single **mute** control silences everything instantly; remember the setting.

---

## A8. Readability, accessibility & comfort (non-negotiable)

- **Value legibility first.** The top-of-Stack value and the player's own hand values must be
  unmistakable at all supported sizes and on small screens. Photoreal glare, perspective, blur, or
  low contrast may **never** make a value ambiguous. If realism and legibility conflict, legibility
  wins (enlarge/contrast-boost the value markings).
- **Reduced motion.** A "reduce motion" setting must shorten/replace shuffle, deal, fly, and clear
  animations with quick, minimal transitions while keeping state changes obvious.
- **Mute / volume.** Audio fully controllable and off-able (§A7).
- **Colorblind-safe:** never rely on suit color alone to convey anything (suits are non-functional
  anyway); the value mark is the source of truth.
- **No info leak via presentation:** reiterate §A5/§A-precedence — animations, characters, and audio
  reveal only public information.
- **Responsive:** the photoreal scene must remain readable and playable across desktop and mobile
  viewports; provide a compact arrangement on small screens without losing the value layer.

---

## A9. Performance budgets

- Target **smooth interaction** (aim 60 fps on mainstream hardware; degrade gracefully below).
- The first meaningful interaction should not wait on the entire photoreal asset set — **lazy-load /
  stream** heavy assets and show a lightweight loading state; never block a legal move on a
  non-essential asset.
- Provide a **fidelity fallback** (e.g., reduced shadows/DOF/character detail, or the pre-rendered 2D
  path from §A2) for low-power devices, auto-selected or user-selectable.
- Animations must **never** gate input: the engine result is already computed; if frames drop or the
  user skips, the game stays responsive and correct.

---

## A10. Asset pipeline & deliverables

- **Cards:** 12 number-rank faces + 2 special faces + 1 back, at high resolution / 3D models with PBR
  materials; plus the crisp, scalable **value-mark overlay** layer.
- **Surface/environment:** table + felt + room, with the defined play zones.
- **Characters:** one rig/model (or pre-rendered set) per seat persona, with idle and the public-event
  reaction set; named CPU personae including the default "Botley."
- **Animation:** the clips/sequences (or real-time rigs) for every event in §A6.1.
- **Audio:** the SFX set in §A7.1 (with variation), optional ambient bed and music, mixed and
  normalized.
- Document the chosen rendering approach (§A2), the fidelity tiers (§A9), and how each asset maps to
  its gameplay event.

---

## A11. Acceptance criteria

A build satisfies this amendment when:

1. Cards, surface, and characters read as **photorealistic** and materially believable.
2. Shuffle, deal, and play (plus pickup, clear, flip, skip, win) are **realistically animated** and
   correctly tied to the underlying engine events — with the **higher-card pickup** showing the pile
   move **into the hand** and the played card staying on top.
3. **Realistic, event-synced sound** plays for the §A7.1 catalog, with working mute/volume.
4. Photorealism **never** leaks hidden information (face-down and opponent hands stay hidden) and
   **never** makes a card value ambiguous.
5. Reduced-motion, mute, colorblind-safety, responsiveness, and the performance/fallback budgets all
   hold; animations never block input or alter outcomes.
</content>
