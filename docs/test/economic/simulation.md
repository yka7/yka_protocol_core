# 経済シミュレーションテスト仕様

## 概要

YKA トークンの経済的な振る舞いを検証するシミュレーションテスト群です。
実際の利用シナリオに基づいた動作確認を行います。

## テストケース

### トークン分配シミュレーション

```typescript
describe("Token Distribution", () => {
  it("Should distribute tokens to multiple traders")
  // 複数トレーダーへのトークン分配
  検証項目：
  - 分配量: 各トレーダーに10 YKA
  - トレーダー数: 3アカウント
  - オーナー残高の確認
  - 各トレーダーの残高確認

  it("Should simulate trading between traders")
  // トレーダー間の取引シミュレーション
  手順：
  1. トレーダー1に20 YKAを初期配布（オーナーから）
  2. トレーダー1からトレーダー2へ5 YKA転送
  3. 残高確認とイベント検証
```

### 市場シミュレーション

```typescript
describe("Market Simulation", () => {
  it("Should handle multiple concurrent approvals and transfers")
  // 並行取引の処理
  シナリオ：
  1. 初期設定
     - トレーダー1に50 YKA配布
     - トレーダー2、3への承認設定

  2. 取引実行
     - トレーダー2が20 YKA転送
     - トレーダー3が20 YKA転送

  3. 結果検証
     - 各トレーダーの残高確認
     - トランザクション完了の確認
     - イベント発行の確認
```

## 実装上の注意点

### 1. 初期配布処理

- オーナーアカウントからの配布を確実に行う
- 適切な残高確認を実施
- イベント発行を確認

### 2. トレーダー間取引

- 残高不足の確認
- 承認額の確認
- トランザクション完了の待機

### 3. 並行処理の扱い

- トランザクションの順序制御
- 適切なタイムアウト設定
- エラーハンドリングの実装

## エラーケース

1. **残高不足**

```typescript
// 期待される動作
-ERC20InsufficientBalanceエラーの発生 -
  トランザクションのロールバック -
  残高の変更なし;
```

2. **承認不足**

```typescript
// 期待される動作
-ERC20InsufficientAllowanceエラーの発生 -
  トランザクションのロールバック -
  アローワンスの変更なし;
```

## テスト実行方法

```bash
# シミュレーションテストの実行
npm test test/economic/simulation.test.ts

# 特定のテストケースの実行
npm test test/economic/simulation.test.ts -g "Token Distribution"
npm test test/economic/simulation.test.ts -g "Market Simulation"
```
