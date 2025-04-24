# YKA トークン コントラクト設計書

## 1. YKAToken コントラクト仕様

### 1.1 基本情報

- 名称: YKA Token
- シンボル: YKA
- コントラクト: YKAToken.sol
- 継承コントラクト:
  - Initializable
  - ERC20Upgradeable
  - ERC20PermitUpgradeable
  - ERC20BurnableUpgradeable
  - ERC20VotesUpgradeable
  - OwnableUpgradeable
  - UUPSUpgradeable

### 1.2 状態変数

```solidity
// 継承コントラクトからの状態変数のみ使用
// ストレージスロットの予約（アップグレード用）
uint256[49] private __gap;
```

## 2. 機能仕様

### 2.1 初期化機能

```solidity
function initialize(uint256 _initialSupply, address _initialOwner) public initializer
```

- 目的：プロキシコントラクト経由での初期化
- パラメータ：
  - \_initialSupply: 初期供給量
  - \_initialOwner: 初期所有者アドレス
- 処理内容：
  1. 所有者アドレスの検証
  2. 各継承コントラクトの初期化
  3. 初期供給量のミント

### 2.2 標準 ERC20 機能

- transfer: トークンの転送
- approve: 使用許可の設定
- transferFrom: 許可された転送の実行
- balanceOf: 残高照会
- allowance: 許可額の照会

### 2.3 拡張機能

#### 投票機能（ERC20Votes）

- 委任機能：`delegate(address delegatee)`
- 投票権照会：`getVotes(address account)`

#### Permit 機能

```solidity
function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) public virtual
```

- 目的：ガスレスでの承認操作
- 特徴：EIP-2612 準拠

#### バーン機能

```solidity
function burn(uint256 amount) public virtual
function burnFrom(address account, uint256 amount) public virtual
```

- 目的：トークンの破棄
- アクセス制御：所有者または承認された利用者

### 2.4 アップグレード機能

```solidity
function _authorizeUpgrade(address newImplementation) internal override onlyOwner
```

- 目的：コントラクトの実装の更新
- アクセス制御：所有者のみ実行可能
- 安全性：UUPS パターンによる保護

## 3. セキュリティ仕様

### 3.1 アクセス制御

- オーナー制限機能：
  - アップグレード操作
  - 管理者機能
- 一般ユーザー機能：
  - トークン転送
  - 承認操作
  - バーン操作（自身の残高のみ）

### 3.2 エラー処理

```solidity
error ZeroAddress();  // ゼロアドレスエラー
```

- 入力検証
- 状態検証
- 権限検証

### 3.3 ストレージ保護

- ストレージスロットの予約（\_\_gap）
- アップグレード時の互換性維持
- 初期化の一回限定保証

## 4. テスト仕様

### 4.1 必須テストケース
### 4.1 初期化テスト

- 正常系：適切なパラメータでの初期化
- 異常系：不正なパラメータ、重複初期化

### 4.2 標準機能テスト

- transfer 操作の検証
- approve/transferFrom 操作の検証
- balanceOf/allowance 照会の検証

### 4.3 拡張機能テスト

- permit による承認の検証
- バーン操作の検証
- 投票権委任の検証
- アップグレード操作の検証

### 4.4 セキュリティテスト

- アクセス制御の検証
- エラー処理の検証
- ストレージレイアウトの検証

## 5. デプロイメント仕様

### 5.1 デプロイ手順

1. 実装コントラクトのデプロイ
2. プロキシコントラクトのデプロイ
3. 初期化の実行
4. 所有権の確認

### 5.2 アップグレード手順

1. 新実装コントラクトのデプロイ
2. アップグレード操作の実行
3. 新機能の検証
4. ストレージの整合性確認
