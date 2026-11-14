# GitHub Workflows

このディレクトリには、YKA Protocol Coreで使用されるGitHub Actionsワークフローが含まれています。

## ワークフロー概要

### 1. Hardhat CI (`hardhat.yml`)

コントラクトのビルド、検証、デプロイメントを管理するワークフロー

**主な責務:**
- Solidityコントラクトのコンパイル
- リンター実行による静的解析
- テストネットへのデプロイ（main への push のみ。失敗しても CI の判定は落とさない）
- 環境変数と秘密情報の管理

**実行タイミング:**
- mainブランチへのプッシュ（品質ゲート ＋ テストネットデプロイ）
- プルリクエスト作成時（品質ゲートのみ。デプロイは実行しない）

### 2. Test CI (`test.yml`)

テスト実行と品質メトリクス管理を担当するワークフロー

**主な責務:**
- ユニットテストの実行
- カバレッジレポートの生成
- Codecovへのレポートアップロード
- テスト品質の監視

**実行タイミング:**
- mainブランチへのプッシュ
- プルリクエスト作成時

## 環境変数

### Hardhat CI で使用する環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| PRIVATE_KEY | デプロイ用ウォレットの秘密鍵（`initialOwner` の導出元） | ✅ |
| AMOY_RPC_URL | Amoyテストネットのエンドポイント（未設定時は公開RPCへフォールバック） | - |
| POLYGON_RPC_URL | Polygonネットワークのエンドポイント | - |
| POLYGONSCAN_API_KEY | PolygonScan API キー | - |
| INITIAL_SUPPLY | 初期供給量（現状コードは未使用。供給量は ignition モジュールの `initialSupply` が既定値を持つ） | - |
| MAX_SUPPLY | 最大供給量（現状コードは未使用） | - |
| AIRDROP_AMOUNT | エアドロップ量（現状コードは未使用） | - |
| REPORT_GAS | ガスレポート有効化フラグ | - |
| COINMARKETCAP_API_KEY | CoinMarketCap API キー | - |

### Test CI で使用する環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| CODECOV_TOKEN | Codecovアップロード用トークン | ✅ |

## ワークフロー実行の順序

1. プルリクエスト作成時:
   1. Test CIが実行され、テストとカバレッジチェック
   2. Hardhat CIが実行され、コントラクトの検証

2. mainブランチへのマージ時:
   1. Test CIによるテスト実行
   2. Hardhat CIによるテストネットデプロイ

## 注意事項

- 秘密情報は必ずGitHub Secretsを使用して管理
- ローカルテスト実行時とCI環境の設定の一貫性を維持
- カバレッジレポートは定期的に確認し、必要に応じて改善
- 品質ゲートは lint / compile / test の3つ。`Deploy to Amoy` と `Comment PR with Coverage Info` は運用アクション・通知であり、失敗してもCIの判定は落とさない
- `pull_request` イベントで `sticky-pull-request-comment` を使うため、`test.yml` は `pull-requests: write` を明示的に要求する（リポジトリの default_workflow_permissions が `read` のままだと "Resource not accessible by integration" で失敗する）