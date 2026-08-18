<div align="center">

# RL 手册

强化学习综合指南。

[![Website](https://img.shields.io/badge/read-rl--handbook.com-black?style=for-the-badge)](https://rl-handbook.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Built with Next.js](https://img.shields.io/badge/built%20with-Next.js-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![MDX](https://img.shields.io/badge/content-MDX-8A2BE2?style=for-the-badge)](https://mdxjs.com)
[![Star on GitHub](https://img.shields.io/github/stars/lubludrova/rl-handbook?style=for-the-badge&logo=github&color=yellow)](https://github.com/lubludrova/rl-handbook)

**[在线阅读手册 →](https://rl-handbook.com)**

[English](README.md) | **简体中文**

</div>

---

## 摘要

本手册提供了关于强化学习和序列决策的全面、最新的指南。从多臂老虎机和马尔可夫决策过程开始，逐步深入基于值的方法、策略梯度、Actor-Critic 架构以及基于模型的方法。高级主题包括模仿学习、离线强化学习、好奇心驱动的探索和多智能体系统。内容在数学严谨性与可运行的代码示例之间取得平衡，旨在为进入或从事该领域的学生、研究人员和工程师提供一个开放且持续更新的资源。

## 目录

### 引言

- [引言](https://rl-handbook.com/zh/docs/00-introduction/introduction)
- [什么是强化学习？](https://rl-handbook.com/zh/docs/00-introduction/what-is-reinforcement-learning)
- [RL 方法分类](https://rl-handbook.com/zh/docs/00-introduction/taxonomy)

### 基于值的方法

- [多臂老虎机](https://rl-handbook.com/zh/docs/01-value-based/multi-armed-bandits)
- [马尔可夫决策过程](https://rl-handbook.com/zh/docs/01-value-based/mdp)
- [动态规划](https://rl-handbook.com/zh/docs/01-value-based/dynamic-programming)
- [蒙特卡洛与时序差分预测](https://rl-handbook.com/zh/docs/01-value-based/monte-carlo-and-temporal-difference)
- [Sarsa 与 Q-Learning](https://rl-handbook.com/zh/docs/01-value-based/sarsa-and-q-learning)
- [深度 Q 网络](https://rl-handbook.com/zh/docs/01-value-based/dqn)
- [DQN 改进](https://rl-handbook.com/zh/docs/01-value-based/dqn-improvements)

### 基于策略梯度的在线方法

- [策略梯度与 REINFORCE](https://rl-handbook.com/zh/docs/02-on-policy-policy-based/policy-gradient-and-reinforce)
- [Actor-Critic、A2C 与 A3C](https://rl-handbook.com/zh/docs/02-on-policy-policy-based/actor-critic-a2c-a3c)
- [TRPO](https://rl-handbook.com/zh/docs/02-on-policy-policy-based/trpo)
- [PPO](https://rl-handbook.com/zh/docs/02-on-policy-policy-based/ppo)

### 基于策略梯度的离线方法

- [离线策略梯度框架](https://rl-handbook.com/zh/docs/03-off-policy-policy-based/off-policy-policy-improvement-framework)
- [DDPG](https://rl-handbook.com/zh/docs/03-off-policy-policy-based/ddpg)
- [TD3 与 SAC](https://rl-handbook.com/zh/docs/03-off-policy-policy-based/td3-and-sac)

### 基于模型的方法

即将完成。

### 高级主题

即将完成。

## 项目结构

每个章节是 `content/docs/<section>/<chapter>/` 下的一个独立文件夹，包含 MDX 源文件、可运行示例和图片。

```text
content/docs/<section>/<chapter>/
├── index.mdx              章节源文件
├── <chapter>.py           可运行示例（如存在）
└── figures/               图片、动图、图表
```

支持代码位于 `content/` 之外：

```text
scripts/sync-figures.mjs   在开发和构建前将章节图片同步到 public/
src/app/                   Next.js 路由与布局
src/components/            共享 UI 与 MDX 组件
src/lib/                   Fumadocs 源接线与页面树配置
```

## 贡献

欢迎贡献。适合首次贡献的内容包括修正拼写错误、改进解释、补充参考资料、优化图表或扩展示例。

手册的大部分内容以 `.mdx` 文件的形式存放在 `content/docs/` 中。请提交聚焦的 pull request，并对任何概念性或算法性修改提供上下文说明。

如果你发现问题但不确定如何修复，提交一个 issue 同样很有帮助。

## 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。
