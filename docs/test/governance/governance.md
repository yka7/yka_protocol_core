# Governance Test Documentation

## Overview

このドキュメントではYKAプロトコルのガバナンス機能のテスト仕様と実装詳細について説明します。

## テスト構成

ガバナンステストは以下の3つの主要セクションで構成されています：

1. Governance Setup
2. Proposal Creation and Voting
3. Proposal Execution

### 1. Governance Setup

基本設定のテスト：

- トークンとタイムロックアドレスの正しい設定を確認
- 投票遅延と投票期間の設定値を検証

```typescript
describe("Governance Setup", () => {
  it("should set correct token and timelock addresses");
  it("should have correct voting delay and period");
});
```

### 2. Proposal Creation and Voting

提案作成と投票プロセスのテスト：

- 提案の作成と状態遷移の確認
- 投票権の行使と記録
- 投票力の正確な追跡
- 二重投票の防止

```typescript
describe("Proposal Creation and Voting", () => {
  it("should create a proposal successfully");
  it("should allow voting on proposal");
  it("should track voting power correctly");
  it("should reject double voting");
});
```

### 3. Proposal Execution

提案の実行プロセスのテスト：

- 提案の成功状態の確認
- タイムロックを介した実行
- トランザクションの実行と結果の検証

```typescript
describe("Proposal Execution", () => {
  it("should execute successful proposal");
});
```

## 主要パラメータ

```typescript
const INITIAL_SUPPLY = ethers.parseEther("10000000");
const VOTING_TOKENS = ethers.parseEther("1000000");
const VOTING_DELAY = 1n;    // 1ブロック
const VOTING_PERIOD = 5n;   // 5ブロック
const MIN_DELAY = 1;        // タイムロックの最小遅延
```

## 重要な設定値

1. クォーラム（定足数）
   - 10トークン（テスト環境）
   - 提案が可決されるために必要な最小投票数

2. 提案閾値
   - 1トークン（テスト環境）
   - 提案を作成するために必要な最小トークン保有量

## テストシナリオ

### 1. 提案作成から実行までの完全なフロー

```typescript
// 1. 提案の作成
const tx = await governance.propose(targets, values, calldatas, PROPOSAL_DESCRIPTION);

// 2. 投票遅延期間の待機
await time.increase(Number(VOTING_DELAY));

// 3. 投票の実行
await governance.connect(voter).castVote(proposalId, 1);

// 4. 投票期間の終了待機
await time.increase(Number(VOTING_PERIOD));

// 5. 提案のキュー
await governance.queue(targets, values, calldatas, descHash);

// 6. タイムロック期間の待機
await time.increase(MIN_DELAY);

// 7. 提案の実行
await governance.execute(targets, values, calldatas, descHash);
```

### 2. 投票力の検証

```typescript
// 投票実行
await governance.connect(addr1).castVote(proposalId, 1);

// 投票力の確認
const proposal = await governance.proposalVotes(proposalId);
expect(proposal.forVotes).to.equal(VOTING_TOKENS);
```

## エラーケース

1. 二重投票の防止
```typescript
await expect(
  governance.connect(addr1).castVote(proposalId, 1)
).to.be.rejectedWith("GovernorVotingSimple: vote already cast");
```

2. 投票期間外の投票
3. クォーラム未達の提案実行
4. 不適切な実行タイミング

## 注意点

1. 提案実行には以下の条件が必要：
   - クォーラムを満たす投票数
   - 投票期間の終了
   - タイムロック期間の完了

2. テスト環境では各パラメータを小さく設定：
   - 投票遅延: 1ブロック
   - 投票期間: 5ブロック
   - クォーラム: 10トークン

これにより、テストの実行時間を短縮しつつ、全機能の検証が可能になっています。
