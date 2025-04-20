# トークン転送テスト仕様

## 概要

YKA トークンの基本的な転送機能を検証するテストスイートです。

## テストケース

### 基本転送機能

```typescript
describe("Basic Transfer", () => {
  it("Should transfer tokens between accounts")
  // 基本的なトークン転送
  検証項目：
  - 送信者の残高減少
  - 受信者の残高増加
  - Transfer イベントの発行

  it("Should fail when sender has insufficient balance")
  // 残高不足の場合の転送
  検証項目：
  - ERC20InsufficientBalance エラーの発生
  - 残高の変更なし
```

### エッジケース

```typescript
describe("Edge Cases", () => {
  it("Should handle zero transfers")
  // ゼロ額転送の処理
  検証項目：
  - トランザクション成功
  - 残高変更なし
  - Transfer イベント発行

  it("Should prevent transfers to zero address")
  // ゼロアドレスへの転送防止
  検証項目：
  - エラー発生
  - トランザクション失敗
```

### バッチ転送

```typescript
describe("Batch Transfers", () => {
  it("Should handle multiple sequential transfers")
  // 連続転送の処理
  検証項目：
  - 複数回の転送成功
  - 各転送後の残高確認
  - 全てのイベント発行確認
```

## 実装上の注意点

### 1. 残高確認

```typescript
// 転送前後の残高チェック
const beforeBalance = await token.balanceOf(sender);
// 転送実行
const afterBalance = await token.balanceOf(sender);
expect(afterBalance).to.equal(beforeBalance - amount);
```

### 2. イベント検証

```typescript
// Transfer イベントの確認
expect(transfer).to.emit(token, "Transfer").withArgs(sender, recipient, amount);
```

### 3. エラー処理

```typescript
// 残高不足エラーの確認
await expect(
  token.transfer(recipient, moreThanBalance)
).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
```

## テスト実行方法

```bash
# 転送テストの実行
npm test test/transaction/transfer.test.ts

# 特定のテストケースの実行
npm test test/transaction/transfer.test.ts -g "Basic Transfer"
```
