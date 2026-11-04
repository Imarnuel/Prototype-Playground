# Figma notes — every one, with its node and how it was handled

Source: `LPXddONZ7IMNlIowbz161x`, flow node `9502:21986` ("Frame 5315", page `4001:1213` "📷 Capture"),
plus processing frame `4653:68091`. Collected with `use_figma` over the whole subtree (after
`setCurrentPageAsync`), not from screenshots.

## Result of the sweep

| Kind | Found | Detail |
|---|---|---|
| Annotations (`node.annotations`) | **0** | No node in `9502:21986` or `4653:68091` carries one. |
| Dev-mode notes / measurements | **0** | None surfaced by `get_design_context` or the node walk. |
| Sticky / text notes on the canvas | **0** in the flow's bounds | Nearest neighbours are not notes: `6337:39158` "Frame 5305" holds two switch instances (`6337:39154`, `6337:39171`). |
| Section labels | 1, outside the node | `4080:3240` "Scanning a purchase receipt - High confidence matching" — titles section `4810:31333`, where the processing frame comes from. |
| Layer descriptions | **0** | Frames and instances carry none (only components can). |
| Variable descriptions | **0** | All 95 bound variables have an empty description. |
| Motion (`get_motion_context`, recursive) | **0** | `{"nodes":[]}` — the file defines no motion. The brief's choreography stands. |
| Prototype reactions | 2 | See below. |
| Component descriptions | 23 | See below. |

## Prototype reactions

| Node | Reaction | Handled |
|---|---|---|
| `I9502:21685;4018:1211` Save | `ON_HOVER → CHANGE_TO 4018:710` (a variant swap) | Hover is not a phone interaction; Save instead saves through the mock API and opens the celebration. The file wires no navigation from Save to `9502:21212` — **flagged** (CORRECTIONS F4). |
| `9502:21323` Done | `ON_CLICK → NAVIGATE 4480:25837` (Receipt Details) | `4480:25837` is outside the flow node. Done ends the flow and returns to the camera. **Departs**; flagged (F4). |

## Component descriptions

| Component | Node | Description (verbatim) | Handled |
|---|---|---|---|
| Checkbox | `4241:7` | "Leading selection control for List Item. 20x20, bound to Semantic tokens." | Every Checkbox instance in Review (`9502:21344` …) is hidden — an edit mode not shown in this flow. Not built. |
| Lightning | `4022:49908` | "meteorology, stormy, thunderstorm, thunderbolt, charged, charger, charging, power, electricity, flash, system & devices" | Search keywords (Phosphor). Used as the flash control's icon. |
| X | `4022:56175` | "×, closed, cancelled, dismissed, times, multiply, …" | Keywords. Celebration close. |
| Check | `4022:47417` | "todo, to-do, task, list, checkbox, ok, done, system & devices" | Keywords. On hidden primary Button Icons only. |
| ChartBar | `4022:53113` | "graphs, graphing, charts, statistics, …" | Keywords. Insights tab. |
| Receipt | `4022:69392` | "purchase, money, clipping, expense, commerce" | Keywords. Receipts tab. |
| Plus | `4022:55605` | "addition, sum, …" | Keywords. Capture tab. |
| ListChecks | `4022:60164` | "\*updated\*, checklist, todo, office & editing" | Keywords. The "Notes" tab draws this glyph inside a layer named "Bag" — flagged (C5). |
| Bell | `4022:46442` | "alarm, notifications, …" | Keywords. Drawn by the tab named "profile" — flagged (C5). |
| ImageSquare | `4022:25866` | "pictures, photographs, …" | Keywords. Gallery control; also the default right icon of Text field. |
| FolderOpen | `4022:59325` | "directory, directories, files, …" | Keywords. Files control. |
| CaretLeft | `4022:76197` | "chevron, directional, …" | Keywords. Back. |
| CaretRight | `4022:76382` | "chevron, directional, …" | Keywords. Tags / Shared with disclosure. |
| Tag | `4022:70553` | "tags, hashtag, labels, …" | Keywords. |
| MinusCircle | `4022:54140` | "-, subtraction, …" | Keywords. Remove tag / @mention. |
| User | `4022:78924` | "person, users, profile, …" | Keywords. "Shared with". |
| x-close | `4018:337` | "x, close, exit, remove, cross, delete" | Keywords. Second @mention's remove (C/R5). |
| CalendarBlank | `4022:29361` | "dates, times, events, …" | Keywords. Date field. |
| Clock | `4022:29905` | "times, timer, alarm, …" | Keywords. Time field. |
| DotsThree | `4022:48927` | "menu, overflow, …, more" | Keywords. More. |
| Link | `4022:50027` | "\*updated\*, anchor, hyperlink, …" | Keywords. Receipt action. |
| Notepad | `4022:60567` | "\*updated\*, logs, logbook, notes, …" | Keywords. Receipt action, named "Shopping Note" here (terminology lock). |
| CircleNotch | `4022:35221` | "round, shapes, loading, loader, spinner, …" | Keywords. Processing spinner. |

All 22 icon descriptions are Phosphor's search keywords — no usage constraints. The one
constraint-bearing description (Checkbox) applies to a hidden state.

## What the brief said that the file does not

- The brief's "Showcase rules" section is an unfilled placeholder (`[PASTE SHOWCASE PROTOTYPE RULES HERE]`).
  The repository's working agreement (`/CLAUDE.md`) was applied as those rules.
- The "component ladder (levels a–e)" is not defined anywhere available. Interpreted in CORRECTIONS.md, "Components".

## Receipt Details — `9564:21987` (added after the first build)

Swept the same way (`use_figma` over the subtree): **0 annotations, 0 prototype reactions**,
no layer descriptions; Light mode pinned (`152:0`). Component descriptions are the same Phosphor
keyword lists as above, plus MoneyWavy (`4022:68375`: "\*new\*, cash, dollars, paper bills,
payment, paying, purchase, commerce") and PlusCircle (`4022:55643`). Hidden layers not built:
the edit-mode row controls, a "Tags & people" label, an "Item Total" / V.A.T / Total breakdown
(`9564:22156`, `9564:22179`, with "Paracetamol 50mg" and "₦14,,000" placeholders), and "Add a tag".
