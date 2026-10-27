# Chapter 2: Tree Search review and rewrite

Status: the author has reviewed and refined the opening through MCTS and the
opponent-search explanation. On 2026-10-27, the author requested a concise
lecture-based revision from AlphaZero onward, with a 4,500-word chapter cap.
The revised chapter is about 4,100 words, retains the approved prefix verbatim,
and has three independent editorial/scientific reviews. AlphaZero keeps its
two subsections and self-play diagram. MuZero follows the lecture's model and
training explanation. Comparison uses one consolidated table and a single
explanatory paragraph. The author's review of the revised remainder is pending.

## Files to open

- [Primary article](../../content/docs/04-model-based/alphazero-and-muzero/index.mdx)
- [Detailed original](variants/detailed/alphazero-and-muzero/index.mdx)
- [PaoShou-China original](variants/paoshou-china/alphazero-and-muzero/index.mdx)
- [Preceding Framework chapter](../../content/docs/04-model-based/model-based-rl-framework/index.mdx)
- [Following Dyna chapter](../../content/docs/04-model-based/dyna-and-learned-models/index.mdx)

Keep the existing `alphazero-and-muzero` URL while revising the title or text.
The sidebar, homepage, README, and chapter transitions already place this
article second in the model-based section.

## What the two originals offer

| Topic | Detailed draft | PaoShou-China draft | Question for the rewrite |
|---|---|---|---|
| Opening | Search setting, assumptions, and representative environments | Introduces one MCTS iteration directly | Which small example makes the decision problem clear before notation? |
| Search loop | Search statistics, priors, value estimates, and action selection | Compact selection, expansion, evaluation, and backup explanation | Can the reader trace one complete simulation and see which numbers change? |
| Neural guidance | AlphaGo, AlphaGo Zero, and AlphaZero developed in sequence | Short AlphaZero explanation and historical comparison | Which historical steps explain a new mechanism and deserve full treatment? |
| Value perspective | Explicit two-player backup example | Short player-perspective explanation | Are reward, value perspective, signs, and terminal values fixed before any backup? |
| MuZero | Model interfaces, recorded-action unrolling, and indexed training losses | Concise representation, dynamics, prediction, and loss description | Can the reader distinguish search branches from the sequence used for training? |
| Presentation | More equations, numerical details, assumptions, and source links | A compact flow diagram and shorter explanations | Where can a diagram clarify a derivation without replacing it? |

Compare the actual passages before adopting either treatment. This table is a
starting inventory, not a scientific endorsement of every statement.

## Approved narrative and implemented outline

The narrative follows Pavel Temirchev's *AlphaZero* lecture of 7 May 2024,
provided as `~/Downloads/2024-05-07 Лекция - Павел Темирчев - AlphaZero.mp4`.
The recording's slides were inspected and its post-MPC speech transcribed
locally. The opening MPC material is already covered by Framework and is not
repeated. Approximate lecture times identify the source of the progression:

1. **Tree Search as Planning** (19:40): exact backward reasoning in a small
   deterministic tree, branching cost, then a brief stochastic extension.
2. **A First Approximation: Monte Carlo Rollouts** (27:25): a fixed-depth
   prefix and rollout estimates, distinguishing rollout value from optimum.
3. **From Uniform Search to UCT** (34:25): the need for directed investigation,
   edge statistics, exploration bonus, and explicit initialization.
4. **Monte Carlo Tree Search** (37:35): incremental expansion, four operations
   and their diagram, concise edge-statistic updates, final action selection,
   and the approved opponent-search explanation.
5. **AlphaZero: Neural Search and Self-Play** (drawing on 52:40–1:07:20): a
   neural-reuse motivation followed by two substantial subsections: MCTS with
   Neural Guidance, then Learning through Self-Play. Covers leaf prediction,
   PUCT, visits, nested search/game loops, replay, a shared two-head network,
   and the joint loss. A diagram following AlphaGo Zero Figure 1 illustrates
   the loop. Repeated explanations and historical detail are omitted.
6. **MuZero: Searching with a Learned Model** (1:29:50–1:38:10): representation,
   dynamics, and prediction used in search, then one compact training
   subsection with recorded-action unrolls, aligned targets, and a joint loss.
   Full-episode returns and scalar reward/value losses follow the lecture as
   explicit teaching choices, distinguished from original Atari MuZero.
7. **Comparing MCTS, AlphaZero, and MuZero** (1:40:50): one table of mechanisms,
   costs, and risks for all three, followed by one explanatory paragraph.
   The author removed the learning curves and experimental-budget discussion.
   What Comes Next introduces Dyna separately.

The first four sections now develop search before neural guidance. The running
tree has leaf rewards `(1, 0)` after L and `(-1, 2)` after R. Single-agent
optimal values are 1 and 2, uniform-rollout values are both 0.5, and adversarial
continuation values for the first player are 0 and -1.

## Review checkpoints

- [x] Adopt the running example and prerequisites in the approved plan.
- [x] Read both originals and record what to keep, change, or omit.
- [x] Define notation and value perspectives in the rewritten draft.
- [x] Work through search statistics, leaf evaluation, and backup numerically.
- [x] Separate inference, search, policy/value learning, and model learning.
- [x] Check the discussed algorithm forms and differences against primary sources.
- [x] Check internal links, retained anchors, math rendering, and mobile layout.
- [ ] Record the author's review outcome and next editing step.

## Decisions during the rewrite

- **Abstract approved and applied (2026-10-23):** motivate tree search as the
  first detailed example of model-based methods, using discrete actions and
  known game rules as an accessible starting point. Briefly introduce MCTS,
  AlphaZero's learned policy/value guidance, and MuZero's learned search
  dynamics. Both archived openings were compared. The running example and
  chapter outline remain proposals awaiting discussion.
  Diff and whitespace checks passed. Browser verification was attempted at
  localhost:3000, but navigation failed with ERR_CONNECTION_RESET and a
  separate HTTP request timed out. Rendered-page verification remains pending.
- **First introductory paragraph approved and applied (2026-10-23):** connect
  to decision-time planning in the Framework chapter. Distinguish tree search
  from trajectory planning by how they organize computation, explain MPC's
  replanning loop, and use discrete versus continuous actions as a practical
  teaching orientation rather than a strict boundary. Both archived openings
  were compared. Review the following transition, "These assumptions", when
  revising the environment table, since its original antecedent was replaced.
  Diff and whitespace checks passed. The local server refused the HTTP
  connection on this attempt, so rendered-page verification remains pending.

- **Full rewrite requested and drafted (2026-10-24):** the author accepted the
  lecture-based plan above and authorized rewriting the remaining chapter.
  The detailed archive supplied mathematical depth, value bookkeeping, and
  MuZero target alignment. The shorter archive supplied a clear separation of
  search from learning. The lecture supplied the progression through exhaustive
  search, rollout approximation, UCT, MCTS, minimax, neural guidance, and model
  learning. Both archives remain byte-for-byte unchanged.

  The opening environment inventory was replaced by the numerical tree. Backup
  is explained when first needed, before AlphaZero. Terminal rewards are on
  incoming transitions, with zero post-terminal continuation. Two-player values
  explicitly change from a fixed-player minimax explanation to player-to-move
  edge statistics. Search statistics use N/W/Q, with the exploration bonus U,
  avoiding the lecture's use of W for a selection score.

  Technical corrections to the lecture include a complete PUCT numerator,
  powered visit normalization rather than softmax of raw counts, separation of
  AlphaGo's rollout/value mixture from AlphaZero, and no requirement to discard
  all replay data after every update. The deterministic worked example is not
  presented as a general restriction of MCTS. MuZero's internal terminal and
  legality handling follows its Appendix A rather than retaining simulator
  tests from AlphaZero. Scalar Atari losses are labeled as a teaching version.

  The nine-simulation UCT sequence was independently calculated with c=1 and
  fixed initial rollout outcomes. Rollout means, minimax choices, signed backup,
  PUCT scores, temperature examples, policy loss, discounted model backup, and
  n-step targets were checked numerically. The final `pnpm build` passed with
  136 pages. The final production HTML contains 417 rendered KaTeX expressions
  and no KaTeX errors, matching the browser review. All 11 previous heading
  anchors, seven internal link occurrences, and previous/next chapter navigation
  were verified. Desktop screenshots cover the tree, simulation table, PUCT,
  and MuZero alignment. At 390 px, the page has no horizontal overflow and wide
  tables scroll within their containers. Long formulas were split into readable
  lines and rechecked. All 20 archived files match the manifest. Unrelated
  pre-existing changes and the approved opening were verified byte-for-byte.

  The development preview exhausted Node's heap during verification, including
  a recurrence after a restart. It was restarted again with `pnpm dev` on the
  same localhost:3000 endpoint after the final build. Development-server
  stability remains an unresolved application concern despite the successful
  production build and browser review. No dependencies or application
  configuration were changed. Earlier page-verification failures above describe
  previous edits and are superseded by this browser review.

- **Opening presentation revised with the author (2026-10-24):** removed the
  small-tree subheading, merged the reward convention and tree setup into one
  paragraph, and condensed the full-tree cost discussion into a paragraph with
  a chess motivation. The stochastic-transition discussion now starts with a
  bold question and uses two prose paragraphs. It distinguishes action choices
  from chance outcomes, explains sampling from a generative model without
  explicit transition probabilities, and avoids treating stochastic dynamics
  as a restriction that rules out tree search. Small noise alone does not
  justify ignoring costly outcomes. Removed heading anchors remain available.

- **Rollout motivation moved with the author's approval (2026-10-24):** the
  full-tree cost paragraph now opens the Monte Carlo Rollouts section and
  replaces its previous introductory question. Its final sentence introduces
  limited-depth search and continuation estimates. The existing anchor moved
  with the paragraph.

- **Stochastic scope paragraph approved (2026-10-24):** replaced the two-paragraph
  explanation with the author's accepted single paragraph. It motivates the
  extra difficulty of random outcomes, describes deterministic approximation
  when noise has little effect on action preferences, and limits the worked
  examples to deterministic dynamics. Generative-model terminology and the
  early UCT citation were removed from this introductory aside.

- **Rollout explanation condensed and illustrated (2026-10-27):** the author
  accepted a shorter numerical example without the value-estimation subheading
  and requested a compact replacement for the explicit-prefix subsection.
  Both removed headings retain their anchors. The new SVG follows the lecture's
  two-level search and rollout structure, using a larger schematic task whose
  frontier states are unfinished. Solid branches compare actions, while dashed
  paths show sampled continuations under the rollout policy. Depth-indexed
  equations define action values, state values, and the root action, preserving
  immediate rewards and the existing undiscounted convention. The transition
  question before UCT is unchanged. Both archived treatments were compared.

  Rollout arithmetic and expected policy values were checked. `pnpm build`
  passed, including TypeScript and 136 generated pages. Production HTML and
  browser checks found no KaTeX errors. Desktop, dark-theme, and 390 px mobile
  screenshots were inspected, with no page-width overflow. The development
  preview failed during verification and was restarted on localhost:3000.

- **Backward reasoning rewritten as a worked example (2026-10-27):** at the
  author's request, replaced the depth-indexed recursion after the rollout
  diagram with frontier estimates 0.2, 0.8, 0.4, and 0.6. Three explicit steps
  show the two parent maxima and the root action. The text distinguishes
  averaging sampled returns during rollouts from maximizing over actions in
  the explicit prefix. These are hypothetical estimates for the larger
  schematic tree, with zero prefix rewards and discount one. The question
  leading into UCT is preserved.

- **UCT condensed with the author's approval (2026-10-27):** replaced only
  "From Uniform Search to UCT" with the agreed continuous explanation.
  Removed its two subheadings while retaining their anchors. Linked the
  existing bandit UCB explanation and retained the greedy-search example,
  N/W/Q statistics, departure-count convention, UCT bonus and selection rule,
  unvisited-action initialization, and separation of simulated computation
  from real action selection. Kept W as accumulated return, rather than the
  lecture slide's selection score. The slide's confidence inequality was not
  added, since stationary-bandit assumptions do not transfer directly to
  changing tree continuations. Detailed backup and the numerical MCTS trace
  remain in the next section. Both archived passages were compared.

  The diff and whitespace checks passed. Content outside the UCT section and
  both archived Tree Search files were verified unchanged against the state
  before this edit. `pnpm build` passed, including TypeScript and all 136
  generated pages. Browser inspection on localhost:3000 confirmed both display
  formulas render without KaTeX errors, both old anchors remain available, and
  the removed subheadings no longer appear in the table of contents. Desktop
  screenshots of the statistics and selection formulas were inspected. The
  development preview exited during the first browser attempt and was restored
  with `pnpm dev` on the same port before the successful page check.

  `pnpm build` passed, including TypeScript and 136 generated pages. The maxima
  and root choice were checked numerically. Desktop and 390 px mobile browser
  screenshots show the new explanation and formulas without KaTeX errors or
  page-width overflow. The local preview was restarted after the build.

- **UCT opening merged (2026-10-27):** at the author's request, joined the
  greedy-search example and bandit connection into one paragraph, explicitly
  naming the shared exploration–exploitation problem. Formulas are unchanged.
  The diff and whitespace checks passed. The page check could not complete
  because localhost:3000 refused the connection.

- **UCT initialization paragraph merged (2026-10-27):** at the author's
  request, joined initialization to the preceding explanation of the UCT
  bonus, with a transition from positive-count selection to initial sampling.
  Formulas and the unvisited-action rule are unchanged. The diff and whitespace checks passed. The local page check could not complete: timed out.

- **MCTS iteration illustrated (2026-10-27):** at the author's request, added
  an original four-panel SVG after the four-operation list, following the
  supplied diagram's progression. Existing edges, one new successor, the
  rollout outside the explicit tree, and upward backup are shown separately.
  Labels follow the chapter's Selection / Expansion / Evaluation / Backup
  terminology. The caption specifies rollout-based MCTS and separates the
  internal simulation loop from real action execution. Both archived search
  explanations were compared.

  Next.js compiled the MDX through Fast Refresh on the existing localhost:3000
  process, with no restart. Browser inspection confirmed all four panels and
  no KaTeX errors. Desktop light/dark and 390 px mobile screenshots were
  inspected. The figure scrolls within its container on mobile without page
  overflow. The diff and whitespace checks passed. All prior chapter content
  and both archived Tree Search files were verified unchanged.

- **MCTS figure refined (2026-10-27):** removed the caption at the author's
  request, shortened and smoothed the dashed rollout with a smaller arrowhead,
  and split the upward path into three independently arrowed edges. Renamed
  the fourth panel Backpropagation, matching Chaslot et al. (2008), Figure 1,
  and introduced it as Backpropagation (backup) in the operation list.
  Source: https://ojs.aaai.org/index.php/AIIDE/article/download/18700/18475.
  Kocsis and Szepesvari (2006), Introduction, explicitly use successor nodes
  and successor states. The author's terminology question and the proposed
  clearer rollout paragraph remain discussion items, with neither passage
  replaced in the chapter.

  The diff and whitespace checks passed. Browser inspection confirmed no
  caption, all three upward arrows, the smaller rollout marker, and a fourth
  panel title that fits its box. The screenshot was inspected. The preview
  independently exhausted its 8 GiB heap during this task. Its fatal error
  was recorded in the persistent dev log. After the process exited, the sole
  preview was restored on port 3000 for verification, without configuration
  edits. Memory growth remains unresolved and will be investigated separately.

- **MCTS explanation and closing subsections approved (2026-10-27):** applied
  the accepted next-state/child-node expansion wording and the orange-node
  rollout explanation. Aligned the nearby diagram labels with child-node
  terminology. At the author's request, replaced the indexed backup recursion,
  incremental-mean identity, complete nine-simulation trace, and pseudocode
  with Updating the Tree and From Search to Action: six prose paragraphs and
  two display blocks. The first defines one shared return G under zero
  intermediate rewards and gamma=1, then updates N, W, and Q. The second
  separates UCT investigation from the chosen most-visited root-action rule,
  preserves tie handling, and leads into the opponent's objective. Legacy
  subsection anchors remain available. The guide and current outline were
  updated, while historical checks above still describe earlier drafts.

  Both archived treatments were compared. The backpropagation/action-selection
  progression was checked against Mastering Reinforcement Learning
  (https://uq.pressbooks.pub/mastering-reinforcement-learning/chapter/monte-carlo-tree-search/).
  That book selects by Q; our chosen visit-count variant is instead supported
  by Browne et al. (2012), Section 3.1, page 7
  (https://www.lamsade.dauphine.fr/~cazenave/A+Survey+of+Monte+Carlo+Tree+Search+Methods.pdf#page=7).
  Their max-child and robust-child alternatives are distinguished in the text.

  The diff and whitespace checks passed. First-sample, zero-return, and
  negative-return update arithmetic was checked. All chapter content outside
  MCTS and both archived Tree Search files were verified unchanged against
  the pre-edit state. `pnpm build` passed with TypeScript and all 136 pages.
  Production HTML contains the new headings and retained anchors, renders math
  without KaTeX errors, and omits the trace and pseudocode. Live browser checks
  confirmed six paragraphs, two display blocks, both new headings, and all
  three legacy anchors. Desktop screenshots of both subsections and a 390 px
  screenshot of the update formulas were inspected, with no page overflow.
  The final clarification of G appeared through Fast Refresh in the open page
  without navigation or a change of server PID.

  The separately authorized memory repair settled on the standard dev-only
  --disable-source-maps flag, matching the large-MDX source-map retention
  mechanism reported in https://github.com/vercel/next.js/issues/98221.
  Preliminary async-hook/debug-channel workarounds did not prevent OOM and
  were removed. Six requests and the MDX refresh completed successfully with
  the final flag; RSS fell from 1.62 GiB during rendering to 0.85 GiB afterward.
  This bounded check is not a long-term absence-of-leaks guarantee. Production
  build/start and next.config.mjs remain unchanged by the repair.

- **Neural-search remainder reorganized (2026-10-27):** at the author's
  request, replaced the text beginning at Two-Player Games and Minimax with
  three main sections: AlphaZero: Neural Search and Self-Play, MuZero:
  Searching with a Learned Model, and Comparing MCTS, AlphaZero, and MuZero.
  The 31,608-byte prefix, including all approved MCTS text and figures, is
  preserved byte for byte (SHA-256
  da37382023f207f5ed77a8d0ba02b3adee2b59aa22f50a6a294f25e132e79da6).

  Both archived remainders were compared. The detailed archive supplied
  explicit player-relative backup and aligned MuZero targets. The shorter
  archive supplied the direct progression from learned guidance to search
  supervision and learned dynamics. The new text uses one player-to-move
  convention for two-player games, without first deriving fixed-player
  minimax. AlphaZero proceeds through policy/value prediction, schematic
  PUCT, visit targets, self-play, and outcome/policy learning. History is one
  paragraph. MuZero keeps its three model interfaces and a compact training
  subsection with recorded-action unrolling, aligned reward/value/policy
  targets, and one common loss. Single-agent reward accumulation is clearly
  separated from alternating-player sign conversion.

  Long numerical traces, loss arithmetic, the repeated multi-step-return
  derivation, experimental budgets, and extended value-equivalence and later
  MuZero discussions were removed. The three-method table, computation and
  model-error discussion, and Dyna transition remain. All 23 outgoing URLs
  were retained, with references for omitted topics moved to the bibliography.
  All old heading anchors remain as headings or explicit spans near their
  corresponding material. The bibliography is a subsection of comparison so
  the rewritten remainder has exactly three main sections.

  Primary checks used the AlphaZero preprint by Silver et al. (2017),
  https://arxiv.org/pdf/1712.01815, and Schrittwieser et al. (2020),
  https://arxiv.org/html/1911.08265v2, especially Appendices A, B, and G. Checked
  player-relative signs, terminal rewards counted once, positive-count PUCT
  initialization, powered visit normalization, and reward-target alignment
  after each recorded action. Reward loss starts at depth one, policy/value
  losses at depth zero. Original MuZero's omitted board-game reward loss and
  learned internal terminal treatment are stated without importing exact
  simulator tests into latent search.

  The diff and whitespace checks passed. All 32 protected archived and
  adjacent content files matched their pre-edit hashes. Browser checks found
  all old anchors and no KaTeX errors in the nine new display blocks. PUCT
  selection was split across lines to fit 390 px without formula scrolling.
  Desktop and mobile screenshots of the policy/value loss, PUCT, model
  interfaces, unroll, MuZero loss, and comparison table were inspected.
  `pnpm build` passed, including TypeScript and all 136 pages. Production HTML
  contains all 34 old heading anchors exactly once and no KaTeX errors.
  After the build, the chapter opened successfully again on localhost:3000.
  Browser checks confirmed all nine display blocks, no formula or page-width
  overflow at 390 px, and a working Dyna link. Wide comparison-table content
  scrolls within its container. The same dev-server process (PID 21164)
  remained active throughout editing, build, and post-build verification.
  The revised remainder is ready for the author's review.

- **Evaluation-to-backpropagation transition clarified (2026-10-27):**
  replaced the opening of Updating the Tree with the approved wording that
  explicitly names the completed evaluation step. The full simulation loop
  is no longer described as finished before its statistics update. All
  remaining text and formulas are unchanged. The local page contains the replacement. Whitespace checks passed.

- **Redundant backup contrast removed (2026-10-27):** at the author's
  request, deleted the sentence about not taking a separate maximum over
  child estimates. The preceding comparison already explains mean returns
  and UCT selection. The local page confirms the removal. Whitespace checks passed.

- **Final-action rules clarified and approved (2026-10-27):** replaced
  From Search to Action with the three approved paragraphs. The baseline now
  follows original UCT by choosing the largest mean return Q among visited
  root actions, with Q=W/N restated. A second paragraph explains finite-sample
  uncertainty and presents maximum root visits N as an alternative used by
  AlphaZero during evaluation. This supersedes the earlier most-visited
  baseline choice. The final paragraph connects executing the selected action
  to opponent search, neural guidance, and self-play. No research links were
  added to this subsection, as requested. Neighboring text and legacy anchors
  are unchanged. Comparison with the pre-edit snapshot confirms that all
  chapter content outside this subsection is unchanged. Whitespace checks
  passed. Live browser checks confirmed three paragraphs, two display blocks,
  no research links in the subsection, and no KaTeX errors. Desktop and 390 px
  screenshots were inspected, including both final-action formulas and the
  AlphaZero transition. Neither the formulas nor the page overflow at 390 px.
  The preview remained on port 3000 with the same server PID 21164, without a
  restart. The temporary browser session was closed after verification.

- **Root visit-count wording clarified (2026-10-27):** replaced "simulations
  began with action" with the approved "times action was selected at the root
  during search" wording. The counter and formulas are unchanged.

- **Opponent-search explanation expanded and approved (2026-10-27):**
  replaced Searching against an Opponent with the accepted chess narrative
  before Policy and Value Predictions, and removed the originally rejected
  paragraph about evaluating an unfinished leaf with the network. The new
  explanation separates known deterministic game rules from an unknown
  opponent's choices, introduces opposing objectives and self-play, and uses
  o(s) to convert a first-player outcome Z_1 into each acting player's return.
  Q remains player-relative, so selection maximizes Q plus a positive UCT
  bonus without another sign multiplier. Final selection and alternating-player
  backup are explicit. The last paragraph uses the approved neural-network
  joke to motivate learned policy/value predictions and AlphaZero. General
  stochastic-search coverage in the earlier section is unchanged. Both
  archived treatments were compared, and no research links were added to the
  revised subsection. Legacy anchors remain in place.

  Snapshot comparison confirms that all chapter content outside this subsection
  and the rejected paragraph is unchanged. All protected archives and adjacent
  chapters remain byte-for-byte unchanged, including after the build. Whitespace
  checks passed. Browser checks confirmed all four display blocks, no KaTeX
  errors, and no formula or page overflow at 390 px. Desktop and mobile
  screenshots of the prose, sign conversion, action selection, backup, and
  neural-network transition were inspected. `pnpm build` passed with TypeScript
  and all 136 pages. Production HTML contains the approved text and no KaTeX
  errors. The live chapter was reloaded successfully after the build, with all
  four formulas still rendering correctly. The dev server remained on port
  3000 with PID 21164 and was not restarted.

- **Slide-based AlphaZero rewrite requested and drafted (2026-10-27):**
  rewrote the neural material according to the four supplied lecture slides.
  AlphaZero now starts with generalizing search information through learned
  functions, then has two subsections: MCTS with Neural Guidance and Learning
  through Self-Play. The approved opponent-search text is byte-for-byte intact
  immediately before the AlphaZero heading. Opening/MCTS and everything from
  MuZero onward are unchanged. Removed standalone small policy/PUCT/visit
  subsections and historical comparisons while retaining their anchors.

  The detailed archive informed the policy-iteration explanation and precise
  prior/value/visit distinction. The shorter archive informed the direct
  network-to-search-to-data-to-network progression. Corrections to the slides
  include the PUCT parent-count factor, AlphaZero's absence of rollout/value
  mixtures, player-relative outcome labels, and retention of a selected subtree
  rather than discarding or keeping the entire tree. Neural values are not
  identified with exact evaluation of the raw prior policy. Zero-count handling
  is explicitly a teaching convention, and the loss uses the existing shared
  parameter notation theta rather than inventing separate theta/phi networks.

  Inspected original Figure 1 from Silver et al. (2017), AlphaGo Zero, using
  the publisher's image at
  https://media.springernature.com/full/springer-static/image/art%3A10.1038%2Fnature24270/MediaObjects/41586_2017_Article_BFnature24270_Fig1_HTML.jpg.
  The author rejected the embedded publisher image and requested a clean,
  minimalist composition matching the lecture slide. It was replaced by an
  inline SVG: the played game runs horizontally, small MCTS trees appear under
  nonterminal positions, and the terminal position gives outcome Z_1. Both
  task-created JPEG copies were removed. The caption identifies the diagram
  as a schematic of the original self-play loop and clarifies that Z_1 is the
  first player's outcome. The terminal state has no outgoing action or search.

  Primary checks use https://arxiv.org/pdf/1712.01815 and
  https://ai6034.mit.edu/wiki/images/Nature24270_AlphaGoZero.pdf, especially the
  latter's Figure 1 and Methods search/replay sections. Three independent agents
  reviewed style, scientific accuracy, and request/outline/anchor fidelity.
  None found a major scientific or structural issue. Incorporated their
  suggestions: connect leaf values with priors, separate fixed priors from
  changing counters, move root noise next to exploration, state the value of
  imitating search computation, and require a positive root action count before
  normalizing visits. A further diagram review checked indices, terminal
  handling, outcome perspective, and attribution. The PUCT formula is wrapped
  for mobile width.

  Whitespace checks passed. `pnpm build` passed with TypeScript and all 136
  pages. Production HTML contains the final SVG and no KaTeX errors or rejected
  JPEG. After the build, the chapter reloaded successfully on localhost:3000.
  Browser checks confirmed six display blocks without errors or formula
  overflow at 390 px. Desktop and mobile screenshots of PUCT, the loss, and
  the final diagram were inspected. The wide SVG scrolls within its container
  on mobile without page overflow. Replaced heading anchors and representative
  older anchors each resolve exactly once. Archives, adjacent chapters, MuZero,
  and comparison remain unchanged against the pre-edit snapshot. Concurrent
  author-requested edits to the earlier transition and opponent introduction,
  recorded below, were preserved rather than reverted. The same dev-server
  process (PID 21164) remained active throughout, without a restart.

- **Opponent-search opening condensed (2026-10-27):** at the author's
  request, removed the closing AlphaZero transition from From Search to Action
  and merged the three introductory opponent-search paragraphs into one.
  The replacement distinguishes known rules from an opponent's choices,
  retains minimax and self-play, and describes opposing objectives without
  assuming that the actual opponent uses search. Both archived treatments
  were compared. Self-play was checked against Silver et al. (2017),
  https://arxiv.org/html/1712.01815v1. All formulas and anchors are unchanged.

  The task-specific diff contains only these two chapter edits. Whitespace
  checks passed. The new paragraph and removal were confirmed on the existing
  localhost:3000 preview, and a desktop screenshot was inspected. No KaTeX
  errors were present. This prose-only edit did not require a production build.
  The temporary browser session was closed after verification.

- **Opponent objectives simplified (2026-10-27):** at the author's request,
  removed the introductory self-play sentence and shortened the paragraph
  before the player-sign definition. A second agent chooses opposing moves
  to minimize the first player's outcome Z_1. The outcome labels and the
  purpose of o(s) remain explicit. Both archived perspective explanations
  were compared. Display formulas, anchors, and surrounding text are unchanged.
  The task-specific diff and whitespace checks passed. The replacement and
  deletion were confirmed on localhost:3000 with no KaTeX errors.

- **Neural-network transition revised (2026-10-27):** at the author's
  request, removed the two-player backpropagation explanation and its signed
  recurrence from Searching against an Opponent. The earlier o(s) outcome
  conversion remains. The closing paragraph now states that the remaining
  MCTS procedure is unchanged with player-relative returns, then uses the
  author's neural-network joke and model-free connection to introduce
  AlphaZero's shared policy/value network. English grammar was corrected.
  Both archived passages were compared. The task-specific diff and whitespace
  checks passed. The replacement, removal, and retained AlphaZero anchor were
  checked on localhost:3000, with no KaTeX errors. This local edit did not
  require a production build. The temporary browser session was closed.

- **Neural-network joke approved (2026-10-27):** applied the author's chosen
  wording: "which feels almost suspicious in a modern RL chapter. Let's fix
  that." Only those two sentences changed in the chapter. The task-specific
  diff, whitespace, and localhost:3000 page checks passed. No KaTeX errors.

- **Concise lecture-based remainder reviewed (2026-10-27):** the author
  authorized revising AlphaZero, MuZero, and comparison together, with a
  4,000–4,500-word limit for the whole chapter and three to five independent
  reviewers. The existing approved prefix, including the opponent explanation
  and neural-network joke, is byte-for-byte unchanged. Its SHA-256 is
  `4353e5906780463e46df12d047ee0a5b1f679550656496718c7d89e4a77b05c0`.

  Revisited both archived remainders, lecture slides 23–25 and 30–35, and
  their speech in the existing video-derived frames/transcript under
  `/tmp/rl-tree-lecture-20261024/`. The detailed archive supplied perspective
  and target alignment, the shorter archive supplied the direct causal
  narrative, and the lecture supplied the sequence. The automatic transcript
  was used with slide images and primary papers, not as a verbatim authority.

  AlphaZero now retains the shared policy/value network, neural evaluation,
  PUCT, powered visit counts, self-play diagram, replay triples, joint loss,
  and policy-iteration interpretation without repeating their motivations.
  The generic leaf is s_leaf, avoiding the toy tree's s_L. The small signed
  leaf example explains perspective conversion without restoring the long
  backup derivation the author removed. MuZero follows the unavailable-model
  question, action-conditioned latent recurrence, search, recorded-action
  unroll, aligned targets, and joint loss. Full episode returns and scalar
  reward/value losses are teaching versions. Original Atari bootstrapping
  and categorical targets are distinguished explicitly. Losses assume a
  segment ending before termination, with boundary masks, zero terminal
  continuation, or explicitly defined absorbing targets at episode ends.

  Comparison contains two tables covering all three methods and the original
  learning curves from MuZero Figure 2. Image source:
  https://arxiv.org/html/1911.08265v2/generated/training_plots.png.
  Local asset: `content/docs/04-model-based/alphazero-and-muzero/figures/muzero-training-results.png`.
  Image SHA-256:
  `d1a4c2e3d4a448720194b9e07b705bb86afcfca83b0598ed7ac71b4fc6a53444`.
  Pixels are unchanged. Game labels are added above the image because the
  source PNG omits the HTML game headings. The caption identifies the source,
  axes, colors, and Atari mean/median lines. Discussion states simulation
  budgets, the missing rollout-MCTS baseline, and runtime/training-cost limits
  rather than inventing a common three-way performance ranking.

  Three independent agents reviewed the whole chapter: exposition/style,
  mathematical consistency, and facts/sources/lecture fidelity. None found a
  major scientific error. Incorporated their local fixes for expected versus
  observed outcomes, latent-vector meaning, model calls on expansion, reward
  loss only being omitted in games without intermediate rewards, and terminal
  target handling. Removed editorial narration from published prose. Primary
  verification used the UCT paper, AlphaZero preprint, and MuZero Results and
  Appendices A, B, and G. The numerical visit probabilities, signed leaf
  conversion, discounted backup, and full-return indexing were checked.

  The final chapter has approximately 4,200 words, down from approximately
  5,600. A conservative source count gives 4,221, including headings, tables,
  captions, references, and one token per inline formula, excluding display
  LaTeX and SVG code. Rendered prose alone, excluding math and SVGs, has
  3,956 words. The final `pnpm build` passed, including TypeScript and all 136
  generated pages. Production HTML has 22 display blocks, no KaTeX errors,
  the new figure, and all 64 previous heading/legacy anchors exactly once.
  The existing localhost:3000 preview was reloaded successfully after build.
  Desktop and 390 px mobile screenshots of the rewritten sections, PUCT,
  visits, MuZero loss, tables, and results were inspected. All eight rewritten
  display blocks fit at 390 px, and the page has no horizontal overflow.
  Wide tables and the graph scroll inside their containers. Four wider math
  blocks in the unchanged prefix retain their existing internal scrolling.
  Internal documentation targets and the Dyna transition were checked.

  Snapshot checks confirm that all archives, adjacent chapters, and unrelated
  working changes are unchanged. Only the primary chapter, editorial guide,
  review notes, and new figure source were edited or added. The original
  server PID 21164 remains on port 3000. No additional server, commit, push,
  or publication was made. The revised remainder awaits the author's reading.
  The task's named browser session was closed, and its browser and daemon
  processes were verified to have exited.

- **Self-play caption removed (2026-10-27):** deleted the figure caption at
  the author's request. The diagram and surrounding text are unchanged.
  The task-specific diff and whitespace checks passed. The localhost:3000
  response confirms the caption is absent and the diagram remains.

- **AlphaZero loss placed on one line (2026-10-27):** removed the aligned
  environment and manual breaks at the author's request. All terms and
  notation are unchanged. Whitespace checks passed. The formula renders as
  one line on localhost:3000 without KaTeX errors and fits the desktop column.

- **Inline AlphaZero citation removed (2026-10-27):** removed the
  "Silver et al., AlphaZero" link at the author's request. The paragraph's
  prose is unchanged. Whitespace and localhost:3000 checks passed.

- **Inline MuZero appendix citation removed (2026-10-27):** removed the
  "MuZero, Appendix A" link at the author's request. The paragraph's prose
  is unchanged. Whitespace and localhost:3000 checks passed.

- **MuZero loss placed on one line (2026-10-27):** removed the aligned
  environment and manual breaks at the author's request. All loss terms,
  summation limits, and notation are unchanged. Whitespace checks passed.
  Browser inspection confirms one-line rendering without KaTeX errors or
  desktop overflow.

- **Comparison figure and inline citations removed (2026-10-27):** at the
  author's request, removed the "MuZero, training" link, the paragraph starting
  "These mechanisms follow", and the learning-curve block with its lead-in
  and caption. Changed the retained results paragraph's "curves" to "scores"
  and "these plots" to "these results" to avoid dangling figure references.
  The figure asset remains on disk. Formulas and anchors are unchanged.
  The task-specific diff, whitespace, and localhost:3000 checks passed.

- **Closing section aligned with earlier chapters (2026-10-27):** added a
  level-two "What Comes Next" heading above the existing Dyna transition and
  removed References at the author's request. The transition text, link, and
  legacy where-to-go-next anchor remain unchanged. No internal links to this
  chapter's removed references anchor were found. Whitespace and localhost:3000
  checks passed, including the new heading and absence of References.

- **Comparison consolidated (2026-10-27):** at the author's request, merged
  Work during search and Main prediction risk into the main comparison table,
  removed the experimental-budget paragraph, and replaced the remaining prose
  with one explanatory paragraph. It connects weak rollout policies, learned
  guidance/evaluation, latent-model errors, persistent learning, and search
  computation. Both archived comparisons were consulted. Only the comparison
  content changed in the chapter. Formulas, legacy anchors, and the Dyna
  transition are unchanged. Diff and whitespace checks passed. Browser checks
  on localhost:3000 confirm one table with seven data rows, one paragraph,
  no experimental counts, and no KaTeX errors. A desktop screenshot was inspected.

- **Branch commit requested (2026-10-27):** the author authorized committing
  and pushing the completed Tree Search chapter to docs/model-based. The final
  production build passed with TypeScript and 136 pages after all author edits.
  All 20 archived files match the source manifest. The commit scope is the
  primary chapter, its review notes, and chapter-related editorial-plan updates.
  Unrelated development changes and the removed figure's unused source asset
  are excluded and preserved locally.
