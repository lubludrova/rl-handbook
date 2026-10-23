# Model-based editorial workspace

The primary version lives in `content/docs/04-model-based/`, on the local
`docs/model-based` branch. Edit those files when revising the handbook.
This directory keeps the original alternatives and editorial decisions outside
the published site. The MDX collections only read `content/docs/`.

## Reading order and source choices

The first chapter uses PaoShou-China's introduction with the billiards experiment.
Tree Search is chapter 2 and the next chapter to rewrite with the author. The
remaining technical chapters keep the detailed mathematical style. Offline MBRL
remains a separate final chapter.

| Order | Primary chapter | Detailed original | PaoShou-China original | Current choice and review status |
|---|---|---|---|---|
| 1 | [Model-Based Framework](../../content/docs/04-model-based/model-based-rl-framework/index.mdx) | [Original](variants/detailed/model-based-rl-framework/index.mdx) | [Original](variants/paoshou-china/model-based-rl-framework/index.mdx) | PaoShou-China, with reading-order and offline-coverage links adjusted. Billiards retained. |
| 2 | [Tree Search: From MCTS to MuZero](../../content/docs/04-model-based/alphazero-and-muzero/index.mdx) | [Original](variants/detailed/alphazero-and-muzero/index.mdx) | [Original](variants/paoshou-china/alphazero-and-muzero/index.mdx) | Detailed draft retained as a starting point. Rewrite not started. Begin with the [review plan](tree-search-review.md). |
| 3 | [Dyna and Learning Policies with Models](../../content/docs/04-model-based/dyna-and-learned-models/index.mdx) | [Original](variants/detailed/dyna-and-learned-models/index.mdx) | [Original](variants/paoshou-china/dyna-and-learned-models/index.mdx) | Detailed draft and runnable Dyna-Q example. Awaiting chapter review. |
| 4 | [Planning and Model Predictive Control](../../content/docs/04-model-based/model-predictive-control/index.mdx) | [Original](variants/detailed/model-predictive-control/index.mdx) | [Original](variants/paoshou-china/model-predictive-control/index.mdx) | Detailed draft. Awaiting chapter review. |
| 5 | [Latent Model-Based RL](../../content/docs/04-model-based/latent-model-based-rl/index.mdx) | [Original](variants/detailed/latent-model-based-rl/index.mdx) | [Original](variants/paoshou-china/latent-model-based-rl/index.mdx) | Detailed PlaNet, Dreamer, TD-MPC, and JEPA coverage. Awaiting chapter review. |
| 6 | [Offline Model-Based RL](../../content/docs/04-model-based/offline-model-based-rl/index.mdx) | [Original](variants/detailed/offline-model-based-rl/index.mdx) | [Original](variants/paoshou-china/offline-model-based-rl/index.mdx) | Restored detailed draft from the original eleven-chapter version. MOPO, MOReL, COMBO, and Edge-of-Reach are retained. Compare PaoShou-China's MBOP treatment during its review. |

These choices assemble a working draft. They do not mark any chapter as having
completed the author's editorial or scientific review.

## Before each chapter revision

1. Read the primary chapter and both originals in the table. Compare their
   explanations, definitions, equations, examples, and omissions.
2. Agree on the chapter's question and outline. Choose material deliberately
   rather than selecting a whole variant just because it is longer or shorter.
   Record the choices in the chapter notes or the table above.
3. Edit the primary file. Preserve detailed explanations, derivations, worked
   examples, explicit assumptions, and links to primary sources. Read the
   preceding and following chapters to make the transition coherent.
4. Check math rendering, links and anchors, chapter navigation, the production
   build, and any affected runnable example. Update the review status with what
   was actually checked and what still needs the author's attention.

Tree Search has its own [starting plan and comparison](tree-search-review.md).
Create similar notes for another chapter when its revision begins.

## Original versions and recovery

- **Detailed five-chapter draft:** local commit
  `f22fff3035d1c7b2f2fcbb539dc0148886f377e6` on
  `docs/model-based-five-chapters`. This preserves the full original working
  changes, including integration files, Dyna-Q code, and the illustration.
- **PaoShou-China version:** commit
  `c362f270f3a5060bfa972e5338c93d0ecb5e535a` on `model-based-chapters`.
  Its original introduction was added in `e131721`. PaoShou-China's additions
  are in `9f5e58e`, `920d08c`, and `c362f27`.
- **Detailed offline chapter:** restored from
  `local/model-based-before-five-chapters/offline-model-based-rl.mdx`.
  It predates the five-chapter draft and is identified separately in the
  manifest. Its archived copy is now kept with the other detailed originals.

All original chapter files and their adjacent assets are copied byte for byte.
The [manifest](manifest.json) records each original path, available Git commit,
and SHA-256 checksum. PaoShou-China's component sources are also retained under
`variants/paoshou-china/support/` with `.txt` suffixes so that TypeScript and
ESLint do not treat archived code as live application code. The primary
billiards component comes from the same commit.

Do not update these snapshots while revising the primary text. Git records the
evolution of the primary draft. If an author supplies another original version,
preserve it separately with its source and date.

To compare the two original Tree Search drafts from the repository root:

```sh
git diff --no-index -- \
  editorial/model-based/variants/detailed/alphazero-and-muzero/index.mdx \
  editorial/model-based/variants/paoshou-china/alphazero-and-muzero/index.mdx
```

Exit status 1 from this comparison means that the files differ.

## Validation of the assembled draft (2026-10-23)

- The production build and TypeScript check passed, generating 136 pages.
  ESLint passed for the changed application files.
- All 12 Bellman tests, four billiards tests, and the Dyna-Q example checks
  passed. A browser shot also pocketed the target ball as predicted.
- All six primary chapters passed internal link, anchor, and KaTeX rendering
  checks. Their sidebar order and previous/next navigation were checked in the
  browser. Framework, Tree Search, and Offline MBRL also passed mobile overflow
  checks at 390 pixels.
- All 20 archived files match their recorded source bytes and checksums. Math
  expressions in the primary chapters match their selected source variants.
  The archives are absent from generated page routes and the content collection.

The review preview at `http://localhost:3003` serves the verified production
snapshot. It does not automatically reload changes to the primary files.
During local setup, Turbopack development mode exhausted the Node.js heap, and
Webpack development mode failed to resolve `@fumadocs/satteri/preset`. The
previously observed React hydration error #418 also remains in the browser
console. These application issues need separate follow-up. The chapter review
statuses above remain pending.
