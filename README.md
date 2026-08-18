<div align="center">

# RL Handbook

A comprehensive guide to Reinforcement Learning.

[![Website](https://img.shields.io/badge/read-rl--handbook.com-black?style=for-the-badge)](https://rl-handbook.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Built with Next.js](https://img.shields.io/badge/built%20with-Next.js-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![MDX](https://img.shields.io/badge/content-MDX-8A2BE2?style=for-the-badge)](https://mdxjs.com)
[![Star on GitHub](https://img.shields.io/github/stars/lubludrova/rl-handbook?style=for-the-badge&logo=github&color=yellow)](https://github.com/lubludrova/rl-handbook)

**[Read the handbook online →](https://rl-handbook.com)**

**English** | [简体中文](README.zh-CN.md)

</div>

---

## Abstract

This handbook gives a comprehensive, up-to-date guide to reinforcement learning and sequential decision making. Starting from bandits and Markov decision processes, it progresses through value-based methods, policy gradients, actor-critic architectures, and model-based approaches. Advanced topics include imitation learning, offline RL, curiosity-driven exploration, and multi-agent systems. The material balances mathematical rigor with runnable code examples, and is designed to serve as an open, continuously updated resource for students, researchers, and engineers entering or working in the field.

## Contents

### Introduction

- [Introduction](https://rl-handbook.com/docs/00-introduction/introduction)
- [What is Reinforcement Learning?](https://rl-handbook.com/docs/00-introduction/what-is-reinforcement-learning)
- [Taxonomy of RL Methods](https://rl-handbook.com/docs/00-introduction/taxonomy)

### Value-Based

- [Multi-Armed Bandits](https://rl-handbook.com/docs/01-value-based/multi-armed-bandits)
- [Markov Decision Processes](https://rl-handbook.com/docs/01-value-based/mdp)
- [Dynamic Programming](https://rl-handbook.com/docs/01-value-based/dynamic-programming)
- [Monte Carlo and Temporal-Difference Prediction](https://rl-handbook.com/docs/01-value-based/monte-carlo-and-temporal-difference)
- [Sarsa and Q-Learning](https://rl-handbook.com/docs/01-value-based/sarsa-and-q-learning)
- [Deep Q-Networks](https://rl-handbook.com/docs/01-value-based/dqn)
- [DQN Improvements](https://rl-handbook.com/docs/01-value-based/dqn-improvements)

### On-Policy Policy-Based

- [Policy Gradient and REINFORCE](https://rl-handbook.com/docs/02-on-policy-policy-based/policy-gradient-and-reinforce)
- [Actor-Critic, A2C and A3C](https://rl-handbook.com/docs/02-on-policy-policy-based/actor-critic-a2c-a3c)
- [TRPO](https://rl-handbook.com/docs/02-on-policy-policy-based/trpo)
- [PPO](https://rl-handbook.com/docs/02-on-policy-policy-based/ppo)

### Off-Policy Policy-Based

- [Off-Policy Policy-Based Framework](https://rl-handbook.com/docs/03-off-policy-policy-based/off-policy-policy-improvement-framework)
- [DDPG](https://rl-handbook.com/docs/03-off-policy-policy-based/ddpg)
- [TD3 and SAC](https://rl-handbook.com/docs/03-off-policy-policy-based/td3-and-sac)

### Model-Based

To be done soon.

### Advanced Topics

To be done soon.

## Project Structure

Each chapter is a self-contained folder under `content/docs/<section>/<chapter>/` holding its MDX source, runnable example, and figures together.

```text
content/docs/<section>/<chapter>/
├── index.mdx              chapter source
├── <chapter>.py           runnable example (when present)
└── figures/               images, gifs, diagrams
```

Supporting code lives outside `content/`:

```text
scripts/sync-figures.mjs   mirrors chapter figures into public/ before dev and build
src/app/                   Next.js routes and layouts
src/components/            shared UI and MDX components
src/lib/                   Fumadocs source wiring and page-tree config
```

## Contributing

Contributions are welcome. Good first contributions include fixing typos, improving explanations, adding references, polishing diagrams, or extending examples.

Most handbook content lives in `content/docs/` as `.mdx` files. Open a pull request with a focused change and include context for any conceptual or algorithmic edits.

If you spot an error but aren't sure how to fix it, opening an issue is just as helpful.

## License

This project is open source under the [MIT License](LICENSE).
