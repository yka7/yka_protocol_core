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

## 6. ガバナンス機能仕様

### 6.1 YKAGovernance コントラクト仕様

#### 基本情報
- コントラクト: YKAGovernance.sol, YKAGovernanceImpl.sol
- 継承コントラクト:
  - Initializable
  - GovernorUpgradeable
  - GovernorVotesUpgradeable
  - GovernorTimelockControlUpgradeable
  - GovernorCountingSimpleUpgradeable
  - UUPSUpgradeable

#### 主要パラメータ
```solidity
votingDelay(): 1 block    // 提案から投票開始までの遅延
votingPeriod(): 5 blocks  // 投票期間
quorum(): 10 tokens       // 最小投票数
proposalThreshold(): 1 token  // 提案に必要な最小トークン量
```

### 6.2 主要機能

#### 提案機能
```solidity
function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description
) public override returns (uint256)
```
- 目的：新しい提案の作成
- アクセス制御：提案閾値以上のトークンを保有するアカウント
- パラメータ：
  - targets: 実行対象のコントラクトアドレス
  - values: 送金額
  - calldatas: 実行データ
  - description: 提案の説明

#### 投票機能
```solidity
function castVote(uint256 proposalId, uint8 support) public returns (uint256)
function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) public returns (uint256)
```
- 目的：提案への投票
- アクセス制御：投票権を持つアカウント
- 投票オプション：賛成(1)、反対(0)、棄権(2)

#### 実行機能
```solidity
function queue(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
) public returns (uint256)

function execute(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
) public payable returns (uint256)
```
- 目的：成功した提案の実行
- 実行フロー：
  1. 提案のキュー登録
  2. タイムロック期間の待機
  3. 提案の実行

### 6.3 セキュリティ機能

#### アクセス制御
- 提案作成：提案閾値以上のトークン保有者
- 投票：投票権を持つアカウント
- 実行：誰でも可能（タイムロック後）

#### タイムロック
- 目的：提案実行前の待機期間の強制
- 期間：最小1ブロック（設定可能）
- 機能：セキュリティと透明性の確保

#### アップグレード保護
```solidity
function _authorizeUpgrade(address newImplementation) internal override
```
- 目的：コントラクトの安全なアップグレード
- アクセス制御：ガバナンスシステムを通じてのみ可能

### 6.4 状態管理

#### 提案の状態
```solidity
enum ProposalState {
    Pending,    // 0: 待機中
    Active,     // 1: 投票中
    Canceled,   // 2: キャンセル済
    Defeated,   // 3: 否決
    Succeeded,  // 4: 成功
    Queued,     // 5: キュー済
    Expired,    // 6: 期限切れ
    Executed    // 7: 実行済
}
```

#### 投票の追跡
```solidity
struct ProposalVote {
    uint256 againstVotes;
    uint256 forVotes;
    uint256 abstainVotes;
}
```

### 6.5 テスト要件

#### 基本機能テスト
- 提案作成と状態遷移
- 投票メカニズム
- クォーラム達成の確認
- 実行フローの検証

#### セキュリティテスト
- アクセス制御の検証
- タイムロックの動作確認
- 不正な操作の防止
- アップグレード機能の保護

#### 統合テスト
- トークンとの連携
- タイムロックコントローラーとの連携
- 完全な提案-実行フローの検証
