# GitHub Workflows

このディレクトリには、YKA Protocol Coreで使用されるGitHub Actionsワークフローが含まれています。

## ワークフロー概要

### 1. Hardhat CI (`hardhat.yml`)

コントラクトのビルド、検証、デプロイメントを管理するワークフロー

**主な責務:**
- Solidityコントラクトのコンパイル
- リンター実行による静的解析
- テストネットへのデプロイ（**明示的な opt-in 時のみ**）
- 環境変数と秘密情報の管理

**実行タイミング:**
- mainブランチへのプッシュ
- プルリクエスト作成時

**Amoy デプロイの条件（2026-11-11 修正）:**
デプロイはリリース操作であり CI の合否判定には含めない。次の条件を**すべて**満たすときだけ実行する。
- イベントが `push`（プルリクエストでは実行しない）
- ブランチが `main`
- リポジトリ変数 `ENABLE_AMOY_DEPLOY` が `true`

変数を設定していない場合、デプロイはスキップされ(run log に "Deploy to Amoy skipped" を表示)、ジョブは成功扱いになる。デプロイを再開する場合は `ENABLE_AMOY_DEPLOY=true` に加えて下記の secret と Ignition パラメータの設定が必要（`docs/development/ci-root-cause.md` 参照）。

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

**必要な GITHUB_TOKEN 権限（2026-11-11 修正）:**
カバレッジコメント投稿 (`marocchino/sticky-pull-request-comment`) は `pull-requests: write` を必要とする。
ワークフローで `permissions: contents: read / pull-requests: write` を明示し、コメントステップは
`continue-on-error: true`（fork PR ではトークンが read-only に降格されコメントが失敗するため、
コメント失敗で PR のチェックを赤くしない）。

## 環境変数

### Hardhat CI で使用する環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| PRIVATE_KEY | デプロイ用ウォレットの秘密鍵 | ✅ |
| AMOY_RPC_URL | Amoyテストネットのエンドポイント | ✅ |
| POLYGON_RPC_URL | Polygonネットワークのエンドポイント | ✅ |
| POLYGONSCAN_API_KEY | PolygonScan API キー | ✅ |
| INITIAL_SUPPLY | 初期供給量 | ✅ |
| MAX_SUPPLY | 最大供給量 | ✅ |
| AIRDROP_AMOUNT | エアドロップ量 | ✅ |
| REPORT_GAS | ガスレポート有効化フラグ | - |
| COINMARKETCAP_API_KEY | CoinMarketCap API キー | - |

> 2026-11-11 実測: 当該リポジトリに設定されている secret は `CODECOV_TOKEN` / `MUMBAI_RPC_URL` /
> `POLYGONSCAN_API_KEY` / `POLYGON_RPC_URL` / `PRIVATE_KEY` のみ。
> `AMOY_RPC_URL` / `INITIAL_SUPPLY` / `MAX_SUPPLY` / `AIRDROP_AMOUNT` は未設定のため、
> Amoy デプロイは実行できない状態にある（詳細は `docs/development/ci-root-cause.md`）。

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
   2. Hardhat CIによるテストネットデプロイ（`ENABLE_AMOY_DEPLOY=true` のときのみ）

## 注意事項

- 秘密情報は必ずGitHub Secretsを使用して管理
- ローカルテスト実行時とCI環境の設定の一貫性を維持
- カバレッジレポートは定期的に確認し、必要に応じて改善