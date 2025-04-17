# デプロイメントテスト仕様

## 概要
YKAトークンの初期デプロイメントと基本的な設定を検証するテストスイートです。

## テストケース

### 基本パラメータの検証

```typescript
describe("Initial Parameters", () => {
  it("Should set correct token parameters")
  // 基本パラメータの確認
  検証項目：
  - トークン名: "YKA Token"
  - シンボル: "YKA"
  - デシマル: 18

  it("Should set correct initial supply")
  // 初期供給量の確認
  検証項目：
  - 総供給量: 1,000,000 YKA
  - オーナー残高
  - 小数点以下の精度
```

### 初期化プロセス

```typescript
describe("Initialization", () => {
  it("Should initialize with correct owner")
  // オーナー設定の確認
  検証項目：
  - デプロイヤーがオーナーに設定
  - オーナー権限の確認

  it("Should prevent reinitialization")
  // 再初期化の防止
  検証項目：
  - 初期化済みフラグの確認
  - 再初期化試行の失敗
```

### 設定値の検証

```typescript
describe("Contract Settings", () => {
  it("Should have correct DOMAIN_SEPARATOR")
  // ドメインセパレータの確認
  検証項目：
  - EIP-712準拠の値
  - チェーンID反映

  it("Should have correct contract version")
  // コントラクトバージョンの確認
  検証項目：
  - バージョン文字列
  - 実装の整合性
```

## 実装上の注意点

### 1. デプロイメントパラメータ
```typescript
// デプロイメントパラメータの設定
const deployParams = {
  initialOwner: owner.address,
  initialSupply: "1000000"  // ETH単位
};

// パラメータ検証
expect(await token.name()).to.equal("YKA Token");
expect(await token.symbol()).to.equal("YKA");
expect(await token.decimals()).to.equal(18);
```

### 2. 初期供給量の検証
```typescript
// 供給量の確認（Wei単位での計算）
const totalSupply = await token.totalSupply();
expect(totalSupply).to.equal(
  parseEther(deployParams.initialSupply)
);

// オーナー残高の確認
const ownerBalance = await token.balanceOf(owner.address);
expect(ownerBalance).to.equal(totalSupply);
```

### 3. 初期化保護
```typescript
// 再初期化の試行
await expect(
  token.initialize(owner.address, "1000000")
).to.be.revertedWith(
  "Initializable: contract is already initialized"
);
```

## エラーケース

### 1. 不正な初期パラメータ
```typescript
// ゼロアドレスオーナー
await expect(
  deployToken(ZERO_ADDRESS, "1000000")
).to.be.reverted;

// 無効な初期供給量
await expect(
  deployToken(owner.address, "0")
).to.be.reverted;
```

### 2. アップグレード保護
```typescript
// 実装コントラクトの直接使用防止
await expect(
  token.connect(nonOwner).upgradeTo(newImplementation)
).to.be.reverted;
```

## テスト実行方法

```bash
# デプロイメントテストの実行
npm test test/core/deployment.test.ts

# 特定のテストケースの実行
npm test test/core/deployment.test.ts -g "Initial Parameters"
npm test test/core/deployment.test.ts -g "Initialization"
```

## 追加の検証項目

1. ガス使用量の計測
2. イベント発行の確認
3. ストレージレイアウトの検証
4. アップグレード可能性の確認