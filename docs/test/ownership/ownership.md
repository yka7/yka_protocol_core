# オーナーシップテスト仕様

## 概要
YKAトークンのオーナーシップ管理機能を検証するテストスイートです。
Ownable2Stepアップグレード可能実装の正しい動作を確認します。

## テストケース

### 基本的なオーナーシップ管理

```typescript
describe("Basic Ownership", () => {
  it("Should set the correct initial owner")
  // 初期オーナーの設定
  検証項目：
  - デプロイ時のオーナー設定
  - オーナーアドレスの正確性

  it("Should prevent non-owners from owner actions")
  // 非オーナーからの制限
  検証項目：
  - 制限された操作の試行
  - アクセス拒否の確認
  - エラーメッセージの検証
```

### オーナーシップ移転

```typescript
describe("Ownership Transfer", () => {
  it("Should handle ownership transfer correctly")
  // 二段階の所有権移転プロセス
  手順：
  1. 移転の提案（transferOwnership）
  2. 新オーナーによる承認（acceptOwnership）
  3. 所有権の更新確認

  it("Should cancel ownership transfer")
  // 移転のキャンセル
  検証項目：
  - 移転提案のキャンセル
  - 保留中の移転の無効化
  - 状態の確認
```

### エッジケース

```typescript
describe("Edge Cases", () => {
  it("Should handle zero address cases")
  // ゼロアドレス関連の検証
  検証項目：
  - ゼロアドレスへの移転防止
  - 初期化時のゼロアドレスチェック

  it("Should handle repeated transfer attempts")
  // 連続移転試行
  検証項目：
  - 複数回の移転提案
  - 承認前の新規提案の影響
```

## 実装上の注意点

### 1. オーナー確認
```typescript
// オーナーの検証
const currentOwner = await token.owner();
expect(currentOwner).to.equal(expectedOwner);
```

### 2. 移転プロセスの検証
```typescript
// 二段階移転の実装
await token.transferOwnership(newOwner);
await token.connect(newOwner).acceptOwnership();

// 移転完了の確認
const updatedOwner = await token.owner();
expect(updatedOwner).to.equal(newOwner);
```

### 3. イベント検証
```typescript
// OwnershipTransferStarted イベントの確認
expect(transfer)
  .to.emit(token, "OwnershipTransferStarted")
  .withArgs(currentOwner, newOwner);

// OwnershipTransferred イベントの確認
expect(accept)
  .to.emit(token, "OwnershipTransferred")
  .withArgs(currentOwner, newOwner);
```

## エラーケース

### 1. アクセス制御
```typescript
// 非オーナーからの操作防止
await expect(
  token.connect(nonOwner).transferOwnership(newOwner)
).to.be.revertedWithCustomError(
  token,
  "OwnableUnauthorizedAccount"
);
```

### 2. 無効な移転
```typescript
// 未提案の承認試行
await expect(
  token.connect(nonOwner).acceptOwnership()
).to.be.reverted;
```

## テスト実行方法

```bash
# オーナーシップテストの実行
npm test test/ownership/ownership.test.ts

# 特定のテストケースの実行
npm test test/ownership/ownership.test.ts -g "Basic Ownership"
npm test test/ownership/ownership.test.ts -g "Ownership Transfer"