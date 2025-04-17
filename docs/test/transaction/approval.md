# トークン承認テスト仕様

## 概要
YKAトークンの承認（Approval）機能とtransferFrom機能を検証するテストスイートです。

## テストケース

### 承認機能

```typescript
describe("Token Approvals", () => {
  it("Should approve tokens for spender")
  // 基本的な承認設定
  検証項目：
  - 承認額の設定
  - Approval イベントの発行
  - アローワンスの確認

  it("Should update approval amounts")
  // 承認額の更新
  検証項目：
  - 既存の承認額の更新
  - 新しい承認額の反映
  - イベントの発行確認
```

### TransferFrom機能

```typescript
describe("TransferFrom Operations", () => {
  it("Should transfer tokens using transferFrom")
  // 承認済みトークンの転送
  手順：
  1. オーナーがスペンダーに承認
  2. スペンダーが転送を実行
  3. 残高とアローワンスの確認

  it("Should fail when trying to transfer more than approved")
  // 承認額以上の転送試行
  検証項目：
  - ERC20InsufficientAllowance エラーの発生
  - 残高とアローワンスの変更なし
```

### アローワンス管理

```typescript
describe("Allowance Management", () => {
  it("Should handle multiple approvals")
  // 複数アカウントへの承認
  検証項目：
  - 複数のスペンダーへの承認設定
  - 各スペンダーの独立した承認額管理

  it("Should handle approval updates correctly")
  // 承認額の更新処理
  検証項目：
  - 増額・減額の処理
  - ゼロ承認の処理
  - 既存承認の完全な上書き
```

## 実装上の注意点

### 1. 承認額の検証
```typescript
// アローワンスの確認
const allowance = await token.allowance(owner, spender);
expect(allowance).to.equal(amount);
```

### 2. TransferFrom検証
```typescript
// transferFromの実行と検証
await token.connect(spender).transferFrom(owner, recipient, amount);
// 残高とアローワンスの確認
const newAllowance = await token.allowance(owner, spender);
expect(newAllowance).to.equal(allowance - amount);
```

### 3. イベント検証
```typescript
// Approval イベントの確認
expect(approve)
  .to.emit(token, "Approval")
  .withArgs(owner, spender, amount);
```

## エラーケース

### 1. 承認額超過
```typescript
// 承認額以上の転送試行
await expect(
  token.connect(spender).transferFrom(owner, recipient, moreThanAllowed)
).to.be.revertedWithCustomError(
  token,
  "ERC20InsufficientAllowance"
);
```

### 2. 無効なアドレス
```typescript
// ゼロアドレスへの承認防止
await expect(
  token.approve(ZERO_ADDRESS, amount)
).to.be.reverted;
```

## テスト実行方法

```bash
# 承認テストの実行
npm test test/transaction/approval.test.ts

# 特定のテストケースの実行
npm test test/transaction/approval.test.ts -g "Token Approvals"
npm test test/transaction/approval.test.ts -g "TransferFrom Operations"