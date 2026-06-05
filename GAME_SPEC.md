# Underplay — Game Build Specification

A complete, implementation-ready specification for building **Underplay**, a multiplayer
"shedding / climbing" card game in the Tapped-Four family. The name refers to the core mechanic:
each turn you play **under** (≤) the top card of a central pile.

This document covers **gameplay, rules, state, scoring, AI, and architecture only**. It deliberately
says nothing about visual design, card art, layout, graphics, animation, or sound — those are out of
scope and left entirely to the implementer.

It is written to be framework-agnostic. A reference implementation exists in TypeScript (a pure rules
engine + a web UI + an optional server-authoritative backend), but you may build it in any stack. The
**rules in Sections 1–9 are normative** and must be reproduced exactly. Section 10+ (architecture, AI,
config, tests) is strong guidance you should follow but may adapt to your platform.

---

## 1. Overview

- **Genre:** turn-based shedding/climbing card game (Crazy Eights / Palace / Shed family).
- **Players:** 2 to 4. (The original tabletop game allows 2–8; this build targets 2–4. Any mix of
  humans and CPU opponents.)
- **Goal of a round:** be the **first** player to get rid of **all** your cards.
- **Goal of the match:** across multiple rounds, have the **lowest cumulative score** when any player
  crosses the ending-score ceiling.
- **Core loop:** play clockwise. On your turn you place card(s) onto a central **Stack** whose top
  card sets a ceiling — you must play **equal to or lower** than it (an empty Stack accepts anything).
  Special cards and four-of-a-kinds clear the Stack; playing **higher** than the top is legal but you
  take the pile.

---

## 2. Glossary

- **Stack** — the central pile everyone plays onto. Only number cards ever live here. The **top** card
  sets the constraint **T** (the highest value you may safely play). An empty Stack imposes no
  constraint.
- **Hand** — your private cards (others see only a count).
- **Face-up cards** — your table cards, visible to everyone, each sitting on top of one face-down card.
- **Face-down cards** — your table cards, hidden from **everyone including you** until flipped.
- **Active pool** — your **hand + face-up cards combined**; while any of these remain you play from
  this combined pool (a single play may mix the two).
- **Blind phase** — once your hand and face-up cards are both gone, only face-down cards remain; you
  flip them one at a time, sight unseen.
- **Out of play** — cards permanently removed this round. Two sources: the **leftover** undealt cards
  (set aside at the deal; never used — there is no draw pile) and the **dead pile** (cards removed by
  clears). Out-of-play cards never score and never return.
- **Tap-out** — completing a set of **four or more** identical-value cards on top of the Stack. This
  clears the **entire** Stack out of play and lets you play again.
- **CLEAR card** ("Undercut") — a special card that clears the whole Stack and lets you play again.
- **SKIP card** ("Overcut") — a special card that makes a chosen opponent lose their next turn.
- **Going out** — emptying all three of your zones (hand, face-up, face-down). The first player to go
  out wins the round.

> Display names: the CLEAR card is shown as **"Undercut"** and the SKIP card as **"Overcut"**. These
> names are cosmetic and may be changed. Note: playing a card *higher than the top of the Stack* is
> always called **"playing a higher card"** — never an "overcut" — to avoid confusion with the SKIP
> (Overcut) card.

---

## 3. The Deck

A single combined deck of **160 cards**:

| Card type | Count | Value (for play & scoring) |
|---|---|---|
| **Number cards**, 12 distinct ranks | 144 (12 copies of each rank) | rank value: `2..10` = face value, `J = 11`, `Q = 12`, `K = 13` |
| **CLEAR** (Undercut) special | 11 | scores **20** points |
| **SKIP** (Overcut) special | 5 | scores **30** points |

Notes:

- There are **12 distinct number ranks**, ordered `2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K`.
  (The reference build derives these from 3 standard 52-card decks: ranks 2–K of four suits × 3 decks
  = 12 copies of each rank. **Suits carry no gameplay meaning** — all matching is by rank/value only.)
- Having **12 copies of every rank** is deliberate: it makes four-of-a-kind tap-outs achievable.
- Every physical card needs a **stable unique id** (because duplicates exist). Gameplay compares cards
  by **value**, never by id or suit.
- The 12/144/11/5 split is the default; treat the deck composition as **tunable** (see §13).

---

## 4. Setup & The Deal

1. Combine and shuffle the full 160-card deck (use a **seedable** RNG so games are reproducible for
   testing — see §12).
2. Deal **19 cards to each player**, into three zones, in this order (round-robin one card at a time):
   1. **4 face-down** cards to each player.
   2. **4 face-up** cards to each player — one placed on top of each face-down card (so each face-up
      "covers" a face-down).
   3. **11 cards to each player's hand.**
3. **All remaining undealt cards are set aside, out of play for the entire round. There is NO draw
   pile — hands are never refilled.**
4. The Stack starts **empty**. The dead pile starts empty.
5. Choose a starting player (seat 0 for round 1). Play proceeds **clockwise** (seat order).
6. Each subsequent round, the **starting seat rotates by one** (fairness).

Per-player deal totals: `4 + 4 + 11 = 19`. With N players, `19 × N` cards are dealt and the rest are
out of play.

---

## 5. A Turn (high level)

On your turn you make **one play**, which may be followed by **more plays in the same turn** if the
play grants you a continuation (see §7). Concretely:

- You select card(s) to play and commit them.
- The engine applies all consequences (landing on the Stack, clears, pickups, skips, going out).
- Your turn **continues** (you play again) after: a tap-out, a CLEAR card, a SKIP card, or a
  higher-card play. Your turn **ends** (passes to the next player) only after a **safe play** —
  a number play of value **≤ T** that does **not** complete a four-of-a-kind.

There is no "pass" or "draw" action. On your turn you must make a legal play, and a legal play always
exists (you can always either play a card or — in the blind phase — flip a face-down).

---

## 6. Where You Play From (zones)

1. **Active phase — while you hold any hand and/or face-up cards:**
   - Your playable pool is **hand + face-up cards, combined**. A single play of same-value cards may
     freely mix cards from your hand and your face-up row (e.g. "one from hand and two face-up 5s").
   - **Uncovered face-down cards are also playable in the active phase** (see below).
2. **Blind phase — once your hand AND face-up cards are both empty:**
   - Only face-down cards remain. You play them **one at a time**, **blind**: you do not see a
     face-down card until you flip it, and a flipped card **must be played immediately** as part of
     that move (you may not flip-and-peek).

### Face-down cards (important details)

- Each of your 4 face-down cards begins **covered** by one of your 4 face-up cards.
- When you play a face-up card, a face-down card beneath becomes **uncovered**. (Track this by count:
  the uncovered face-down cards are those beyond the number of face-up cards you still have.)
- An **uncovered** face-down card may be flipped and played on **any** of your turns — including while
  you still hold hand/face-up cards. There is no "clear the table first" gate. A face-down still
  covered by a face-up card may **not** be flipped.
- You may flip **at most one** face-down card per turn.
- A flipped **number** card may be **combined with same-value cards from your hand/face-up** in the
  same play (a play may span all three zones). A flipped **special** card is played **alone**.
- Flipping commits you: you do not get to look first and change your mind.

---

## 7. Playing — the rules in full

A play is one of:

- **A single number card.**
- **Two or more number cards of the same value**, played together (from the combined active pool,
  and/or including one flipped face-down of that same value).
- **A single special card** (CLEAR or SKIP) — specials are always played **alone**.
- **A single blind face-down flip** (in the blind phase, or an uncovered face-down in the active
  phase), optionally combined with same-value hand/face-up cards if it flips up a number.

> **Legality vs. outcome:** A move's *legality* (validation) does **not** consider value vs. T.
> Playing **higher** than the top is a **legal** move — it simply triggers the pickup outcome (§7.4).
> The value comparison is resolved when the play is *applied*, not when it is validated.

Let **T** = value of the current top card of the Stack (or `null` if the Stack is empty). Let the
played number cards all have value **V**.

### 7.1 Safe play (V ≤ T, or the Stack is empty)

- The card(s) land on top of the Stack; the new top is V.
- **Unless** this completes a four-of-a-kind (§7.2), your **turn ends** and play passes to the next
  player (skipping any player who owes a skip — §7.5).
- An empty Stack accepts **any** value (it is a safe play).

### 7.2 Tap-out — four or more of a kind (clears the whole Stack)

- If, after your card(s) land, the **top run** (the contiguous same-value cards on top of the Stack)
  numbers **four or more**, you have a **tap-out**.
- The **entire Stack** (the four-of-a-kind run *and every card beneath it*) is moved **out of play**
  (to the dead pile). The Stack becomes empty.
- You **play again** (turn continues).
- This fires whether the completing play was "safe" (V ≤ T) or not — completing four of a kind always
  clears. Examples:
  - Play four 7s at once onto an empty/any Stack → clear, play again.
  - Three 7s already on top; you add one 7 → four 7s → clear (the whole Stack), play again.
  - Stack top is three 9s under nothing relevant; you play a higher set that brings the count to four
    of that value — see §7.4 for how a *higher* play can also reach four via the pickup rule (it does
    **not**; the higher-play pickup is separate — read §7.4 carefully).

> Default threshold is **4** ("four of a kind"); treat it as tunable (`TAP_OUT_COUNT`).

### 7.3 CLEAR card (Undercut)

- May be played **at any time on your turn**, **alone**.
- Effect: the **entire Stack** is moved out of play (to the dead pile), **and the CLEAR card itself is
  also consumed** (out of play — it does not sit on the Stack). The Stack becomes empty.
- You then **play again** as if starting fresh (turn continues). You may now play any card (the Stack
  is empty).
- Use case: if you cannot or do not want to play a number card, a CLEAR card lets you wipe the Stack
  and continue.

### 7.4 Playing a HIGHER card (V > T) — the pickup, and the player-driven combine

This is the most nuanced rule. Implement it **exactly**.

When you deliberately play a number card (or same-value set) whose value **V is greater than T**:

1. Your played card(s) **stay on top** of the Stack as the new top (value V).
2. **Every other card currently in the Stack — the entire pile beneath your played card(s) — goes
   into YOUR HAND.** This **includes any cards of the same value V that were buried** in the Stack.
   Nothing is auto-combined onto the Stack; the buried matches come to your hand.
3. You **keep your turn** (it does **not** end).
4. You may now look at your (now larger) hand and **decide** whether to **add same-value cards onto
   the card you just played** — this is a **separate, second play** that *you* choose to make. For
   example, if you just played a single 7 (higher) and now hold three more 7s (one of which you just
   picked up from the Stack), you may select and play them onto your 7 to make four 7s → tap-out →
   clear. **This combine is always the player's choice, never automatic.**

Key invariants for §7.4:

- Because V > T, the previous top card has a different (lower) value than V, so **at least one card
  always goes to your hand** (you always "pick up" ≥ 1 card on a higher play).
- A higher play is only possible when the Stack is **non-empty** (an empty Stack is always a safe
  play, §7.1).
- This rule can be **strategic**: playing a high set on purpose lets you shed several high cards while
  picking up a smaller-value pile — a net reduction in the points you hold.

> ⚠️ Common implementation mistake (do not do this): **auto-combining** the buried same-value cards
> onto the Stack so they never reach the player's hand. That removes the player's choice and is
> **wrong**. The whole pile beneath must go to the hand; the player then decides what to add back.

### 7.5 SKIP card (Overcut)

- Must be played on your turn, **alone**. It may be used at any point in your turn before you finish.
- Effect: place it **in front of any one active opponent of your choice**. That opponent **loses
  their next turn**. The SKIP card is then consumed (out of play).
- After playing a SKIP, you **continue your turn** (play again).
- A given player may be under only **one** pending skip at a time. (When choosing a target, prefer
  opponents who are not already skipped; if a target is not specified or is invalid, default to the
  next active player.)
- When the skipped player's turn would come up, that turn is **forfeited** (the skip is consumed and
  play moves on to the next player). The skipped player makes no other play that turn.

### 7.6 Blind face-down flips (resolving an unknown card)

When you flip a face-down card (blind phase, or an uncovered face-down in the active phase), the
flipped card is revealed and resolved **immediately** by its kind:

- **Number card:** treat it as if you had just played that value (optionally combined with same-value
  hand/face-up cards you included in the move):
  - V ≤ T → safe play (§7.1) — turn ends unless it makes four of a kind.
  - V > T → higher play (§7.4) — it stays on top, the pile beneath comes to your hand, you continue.
  - Completing four of a kind → tap-out (§7.2).
- **CLEAR card:** resolve as §7.3 (clear the Stack, play again). If it flips up with no companions,
  it simply clears.
- **SKIP card:** resolve as §7.5 (place on a chosen opponent, continue).

---

## 8. Ending a Round & Scoring

### 8.1 Going out

- The **first player to empty all three zones** (hand, face-up, face-down) **wins the round**, and the
  round ends **immediately** (no one else gets further turns).

### 8.2 Round scoring

When the round ends:

- The **round winner scores 0**.
- **Every other player** scores the total point value of **all cards they still hold** across hand +
  face-up + face-down:
  - Number card = its value (`2..10` face, `J=11`, `Q=12`, `K=13`).
  - CLEAR card = **20**.
  - SKIP card = **30**.
- Cards in the Stack, dead pile, and out-of-play leftovers are **not** scored against anyone.
- These per-round points are **added to each player's cumulative total**.

### 8.3 Match end

- Play repeats round after round (starting seat rotating each round), accumulating scores.
- The **match ends** as soon as **any** player's cumulative total **reaches or exceeds the ending-score
  ceiling** (default **250**; selectable — see §13).
- The **lowest cumulative total wins** the match ("the winner").
- **Ties:** if multiple players share the lowest total, they all tie for the win.

---

## 9. Turn-flow algorithm (normative pseudocode)

This pseudocode pins down §5–§8. `apply(move)` takes the current player's chosen, validated move and
mutates a copy of the game state, returning the new state. The Stack is an ordered list, top = last.

```
function applyMove(state, move):
    assert validate(state, state.currentSeat, move).ok
    s = clone(state)
    seat = s.currentSeat
    player = s.players[seat]

    played       = cards named by move.cardIds, removed from player's zones
                   (a move may span faceDown + hand + faceUp; the flipped
                    face-down, if any, leads the played set)
    keepsTurn    = false

    if played[0] is CLEAR:                      # §7.3
        deadPile += s.stack + played            # whole stack + the CLEAR card leave play
        s.stack   = []
        keepsTurn = true

    else if played[0] is SKIP:                  # §7.5
        deadPile += played                      # the SKIP card leaves play; stack untouched
        target    = move.targetSeat or nextActiveSeat(seat)
        s.players[target].pendingSkip = true
        keepsTurn = true                        # you continue your turn

    else:                                       # number play
        V       = played[0].value
        T       = topValue(s)                   # null if stack empty
        s.stack += played                       # land on top
        run     = contiguous same-value count on top of s.stack
        if run >= TAP_OUT_COUNT:                # §7.2 four-of-a-kind
            deadPile += s.stack                 # ENTIRE stack leaves play
            s.stack   = []
            keepsTurn = true
        else if T != null and V > T:            # §7.4 higher play
            below      = everything in s.stack except the just-played cards
            player.hand += below                # the WHOLE pile beneath → your hand
            s.stack     = [just-played cards]   # only your played card(s) remain on top
            keepsTurn   = true                  # you continue; you choose what to add next
        # else: safe play (§7.1) → keepsTurn stays false

    if player has 0 cards in all zones:         # §8.1 went out
        finalizeRound(s, winner = seat)         # score everyone, maybe end match
        return s

    if keepsTurn:
        # currentSeat unchanged — same player plays again
    else:
        # pass the turn, consuming any pending skips along the way (§7.5)
        next = nextActiveSeat(seat)
        while s.players[next].pendingSkip and activePlayers(s) > 1:
            s.players[next].pendingSkip = false  # that player forfeits this turn
            next = nextActiveSeat(next)
        s.currentSeat = next

    return s
```

`nextActiveSeat(from)` walks clockwise to the next seat that still holds cards (skipping players who
have gone out). If only one active player remains, it returns that player.

### Move validation (normative)

A move is **legal** iff all of the following hold (value-vs-T is **not** checked here):

- The game phase is "playing" and it is this seat's turn.
- `cardIds` is non-empty with no duplicates.
- The player is not already out.
- Every id resolves to a card the player owns (hand, face-up, or face-down).
- If the move flips a face-down card:
  - Exactly **one** face-down id is included, and that card is currently **uncovered**.
  - Any companion cards are same-value number cards from hand/face-up (a flipped special must be
    alone).
- Else (a hand/face-up play):
  - If any special is included, the move must be exactly that one special card (specials play alone).
  - Otherwise all played cards must **share the same value**.

### Enumerating legal moves (for AI / UI hints)

- One blind-flip move per **uncovered** face-down card (when face-down flipping is allowed).
- For the combined hand+face-up pool: each special yields a singleton move; for each value held in
  multiples (counting both zones together), enumerate playing `1..count` copies.

---

## 10. Game state model

The full state should be plain, **JSON-serializable** data (so it round-trips through storage and the
network). Recommended shape:

```
GameState {
  players: [ {
    seat, name, isCpu, difficulty?,
    hand:     Card[],   // private to owner
    faceUp:   Card[],   // public
    faceDown: Card[],   // hidden from everyone, including owner
    pendingSkip: bool,  // owes a forfeited turn
  } ],                  // length 2..4, players[i].seat === i
  stack:    Card[],     // central pile, top = last; only number cards
  deadPile: Card[],     // cards permanently out of play (clears)
  leftover: Card[],     // undealt cards, out of play this round (never drawn)
  currentSeat: int,
  phase: "playing" | "roundOver" | "matchOver",
  scores: int[],        // cumulative totals by seat (lowest wins)
  roundScores: int[] | null,  // points added in the round just ended
  roundNumber: int,
  roundWinner: int | null,
  matchWinner: int | null,
  matchTiedWinners: int[],
  startingSeat: int,    // rotates +1 each round
  rules: { ...snapshot of tunables captured at match start... },
  version: int,         // monotonic, bump on every applied move
}

Card {
  id: string,           // globally unique (duplicates exist)
  kind: "play" | "clear" | "skip",
  value?: int,          // present for "play": 2..13
}
```

**Hidden-information rule (critical for multiplayer):** the authoritative state above is the *full*
truth. Clients must only ever receive a **redacted** view:

- Your **own hand**: visible to you only. Opponents see a **count**, not the cards.
- **Face-down cards**: hidden from **everyone, including the owner** (send only counts). The values are
  revealed only at the moment they are flipped/played.
- **Face-up cards**, the **Stack**, dead-pile count, and out-of-play counts are public.

Never send another player's hand or anyone's face-down values to a client.

---

## 11. Game modes & architecture

Two play modes, built on **one shared rules engine**:

1. **Local** (single device):
   - **vs CPU:** one human + 1–3 CPU opponents.
   - **Hotseat / pass-and-play:** 2–4 humans take turns on one device. Hide the active player's hand
     until they confirm they're ready (privacy on hand-off). Do **not** hide it when the same player
     continues their turn (after a tap-out / CLEAR / SKIP / higher-play) — only on an actual hand-off.
2. **Online** (multiple devices): **server-authoritative**.
   - A **room** has a short join code and holds the authoritative game state.
   - Clients **send a move** to the server; the server **validates and applies** it via the same
     engine, persists the new state, and pushes the redacted state to each client (real-time
     subscription / push). Clients render optimistically but the server is the source of truth.
   - **CPU turns online:** the host client (or the server) detects a CPU's turn and calls an
     "advance" step that computes and applies the CPU move, chaining through extra-turn continuations
     until it's a human's turn or the round ends.
   - **Resilience:** mark a seat disconnected; allow the same client (by a stable client id) to
     reclaim its seat within a grace window (default 30s). Optionally have a CPU auto-play a
     disconnected human's turns until they return. Promote a new host if the host leaves.

**Engine separation is required:** keep the rules engine as **pure functions** with no UI, network, or
randomness side effects (RNG is injected/seeded). The UI and the server both call the same engine.
This is what makes the game testable and keeps local and online behavior identical.

---

## 12. Determinism & testing requirements

- **Seedable RNG:** all shuffling goes through an injected, seeded PRNG. The same seed + same moves
  must produce byte-identical state (enables reproducible tests and fair replays).
- **Unit tests for every rule** in §6–§8, including edge cases:
  - safe play passes the turn; higher play takes the whole pile to hand **and continues**; the buried
    same-value cards land in the **hand** (not the Stack); the two-step combine (higher play, then add
    matches to make four) clears.
  - four-of-a-kind clears the **entire** Stack and continues — both when completed by a safe play and
    by adding to an existing run.
  - CLEAR clears stack + consumes itself + continues; SKIP marks a chosen target, continues, and the
    target forfeits exactly one turn; only one skip per player at a time.
  - blind face-down flips: ≤ T lands and passes; > T leaves the flipped card on top and picks the rest
    up to hand; flipped specials resolve their effect.
  - face-up must be played before the face-down beneath becomes flippable; combined hand+face-up
    same-value plays.
  - round scoring (winner 0, others sum held; specials at 20/30); match ends at the ceiling; lowest
    wins; ties reported.
  - **card conservation invariant:** the multiset of all card ids across all zones + stack + dead pile
    + leftover is constant for the whole round (no card is duplicated or lost by any move).
- **Fuzz/property harness:** play hundreds of full random-legal matches (2–4 players, varied seeds)
  asserting: no illegal state ever arises, the conservation invariant always holds, and **every match
  terminates** and reports a valid winner.
- **Stalemate guard:** the shedding ruleset can livelock under stubborn play (especially CPU vs CPU
  ping-pong). If a single round exceeds a large turn cap (default **600** turns) without anyone going
  out, end the round in favor of the player holding the **fewest points**. (A normal round is well
  under 200 turns; the cap is only a safety valve.)

---

## 13. Tunable parameters (centralize these)

Put every balance constant in one module; the engine, AI, server, and UI all read from it.

| Constant | Default | Meaning |
|---|---|---|
| players (min/max) | 2 / 4 | supported player counts |
| number ranks | 12 (`2..K`) | distinct number values, low→high |
| copies per rank | 12 | duplicates of each number value |
| CLEAR card count | 11 | number of CLEAR (Undercut) specials |
| SKIP card count | 5 | number of SKIP (Overcut) specials |
| total deck size | 160 | `144 + 11 + 5` |
| face-down per player | 4 | hidden table cards |
| face-up per player | 4 | public table cards (cover the face-downs) |
| hand size | 11 | starting hand (19 dealt total) |
| draw-to-refill | false | **no draw pile**; hands never refill |
| tap-out count | 4 | same-value cards on top that clear the Stack |
| CLEAR card points | 20 | scored if held at round end |
| SKIP card points | 30 | scored if held at round end |
| ending score (ceiling) | 250 | match ends when a total reaches it; presets e.g. 100/150/200/250/300/500 |
| end on first out | true | round ends the instant someone goes out |
| SKIP grants extra turn | (behavioral) | playing a SKIP continues your turn |
| stalemate turn cap | 600 | round auto-resolves to fewest-points player past this |
| reconnect grace | 30 s | window for a client to reclaim its seat (online) |
| auto-CPU on disconnect | true | a CPU plays an absent human's turns (online) |

---

## 14. CPU opponents (three difficulties)

All CPUs act on **public information + their own hand only** — they must **never** read their own (or
anyone's) face-down cards; in the blind phase a CPU picks a face-down to flip at random (no peeking).
Provide `chooseMove(state, seat, difficulty)` over the enumerated legal moves (§9).

- **Easy:** play a **random safe** move (V ≤ T or empty Stack). Only play a higher card / take the
  pile when **forced** (no safe play exists). Burns special cards indiscriminately.
- **Medium:** one-ply evaluation — strongly prefer **minimizing the number of cards held** (a pickup
  balloons your hand and is avoided), and form four-of-a-kind tap-outs when possible. Largely ignores
  card *point values*.
- **Hard:** the Medium evaluation plus: value **keeping the turn** (tempo) and completing **tap-outs**;
  avoid **wasting a special** when a plain safe play exists; weigh the **point value** of cards shed
  (dump high cards and specials before someone goes out); push to **empty out** in the end-game.

A useful evaluation skeleton (simulate the move, then score the resulting state) with reference weights
you can tune: `goOut` dominates everything; `−cardsHeld × ~120`; `−pointsHeld × ~3` (Hard only);
`+keepTurn ~60` (Hard); `+tapOut ~220` (Hard); `−wasteSpecial ~90` (Hard); small end-game dump bonus.
Validate the difficulty gradient empirically: in large CPU-vs-CPU simulations, **Hard should beat
Medium should beat Easy**, and all games must terminate.

---

## 15. Build order (suggested milestones)

1. **Engine + tests:** deck, deal, `validate`, `legalMoves`, `applyMove` (all of §6–§9), scoring, and
   the full unit + fuzz test suites. Do not proceed on red tests.
2. **CPU AI:** the three difficulties (§14) + the strength-gradient simulation.
3. **Local UI:** vs-CPU and hotseat, driving the engine client-side. Get the *feel* right here.
4. **Online backend:** rooms, server-authoritative moves, real-time state push, redacted per-player
   views, CPU advancement, reconnection/auto-CPU.
5. **Polish & end screens:** lobby, round-result and match-winner summaries, "play again."

---

## Appendix A — Worked examples

1. **Safe play.** Top is 5. You play a 3. → 3 is the new top; turn passes.
2. **Build a tap-out.** Top is three 3s. You add one 3 → four 3s → the whole Stack clears out of play;
   you play again.
3. **Tap-out over a mixed Stack.** Stack (bottom→top) is `5,5,8`. You play four 3s (3 ≤ 8, safe) →
   four 3s complete a set → the **entire** Stack (`5,5,8` and the four 3s) leaves play; you play again.
4. **Higher play + player combine.** Top is 4, with a 10 buried under it. You play a 10 (10 > 4). →
   your 10 stays on top; **the 4 and the buried 10 go into your hand**; it's still your turn. You now
   hold extra 10s; you may select three 10s from your hand and play them onto your 10 → four 10s →
   clear. (If you don't want to, you can instead just make any safe play to end your turn.)
5. **Strategic higher play.** Stack shows two 5s and a 3 (13 points). You hold three Kings (39 points).
   You play the three Kings (higher) → they stay on top, you pick up the `5,5,3` into your hand — a net
   reduction in the points you're holding — and you continue.
6. **CLEAR.** You can't (or don't want to) play under the top. You play a CLEAR card → the whole Stack
   leaves play, the CLEAR card is consumed, the Stack is empty, and you play again (any card).
7. **SKIP.** You play a SKIP card onto an opponent of your choice → they will forfeit their next turn →
   you continue your turn. (You can't put a second SKIP on someone who already owes one.)
8. **Blind flip, higher.** In the blind phase you flip a face-down card; it's a J and the top is a 7.
   J > 7 → the J stays on top, you pick the rest of the pile into your hand, and you continue.
```
