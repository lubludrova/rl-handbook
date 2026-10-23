# Chapter 2: Tree Search review and rewrite

Status: prepared for the author's rewrite. The primary article still contains
the detailed draft, with its outgoing transition updated for the new order.
No replacement chapter has been written or approved.

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

## Proposed outline to discuss

1. **Why search before acting?** Start with a small game or finite decision tree.
   Define the available model, legal actions, computation budget, and what the
   agent must output. Distinguish a search procedure from a learning update.
2. **What is stored in a tree?** Define nodes, edges, visits, accumulated returns,
   and value estimates. Establish single-agent and two-player conventions.
3. **Why not explore every continuation?** Explain branching and depth using the
   running example. Introduce selective search as a computation-allocation
   problem.
4. **One complete MCTS simulation.** Walk through selection, expansion, leaf
   evaluation, and backup. Use actual numbers, including an unvisited edge and
   a terminal leaf. Explain every update before presenting pseudocode.
5. **UCT and PUCT.** Connect selection to the earlier bandits chapter. Define
   exploitation, exploration, and the policy prior separately. Check the exact
   variants and their assumptions against primary sources during the rewrite.
6. **Learning to guide search.** Explain what the policy and value networks add.
   Develop AlphaGo, AlphaGo Zero, and AlphaZero only as far as each introduces
   a useful distinction. Derive the search policy and training targets.
7. **Learning the model used by search.** Introduce MuZero's representation,
   dynamics, reward, policy, and value interfaces. Separate planning from
   recorded-action training unrolls and explain the loss indices.
8. **Limits and the next model use.** Discuss budget, model error, and the limits
   of the assumed game setting. Lead into Dyna's use of model computations to
   update reusable values between real interactions.

The outline is editable. The author's requested target is Tree Search as the
second chapter, in the same explanatory and mathematical style as the earlier
handbook chapters.

## Review checkpoints

- [ ] Agree on the running example and the chapter's prerequisites.
- [ ] Read both originals and record what to keep, change, or omit.
- [ ] Define every symbol and value perspective before its first equation.
- [ ] Work through search statistics, leaf evaluation, and backup numerically.
- [ ] Separate inference, search, policy/value learning, and model learning.
- [ ] Check formulas, claims, and algorithm versions against primary sources.
- [ ] Check links, math rendering, mobile layout, and the complete chapter flow.
- [ ] Record the author's review outcome and next editing step.

## Decisions during the rewrite

No new content decisions yet. Record agreed choices here as the chapter is
reviewed. Keep both archived originals unchanged.
