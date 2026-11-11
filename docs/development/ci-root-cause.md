# CI 失敗の根本原因と修正記録（2026-11-11）

対象: `yka_protocol_core` / 症状: base ブランチ `main` の CI が失敗し、PR #2 / #3 / #4 / #6 が
stranded（per-PR リフレッシュでは解決しない）状態。

本ドキュメントは 2026-11-11 実施した調査（care stage）の記録であり、修正は
`.github/workflows/hardhat.yml` と `.github/workflows/test.yml` に適用済み。

---

## 1. 結論（根本原因）

main の CI が赤くなる原因是 **2 つあり、互いに独立**。両方ともワークフロー定義側の欠陥であり、
リポジトリ外（secret / 変数 / 認証情報）の問題ではない部分と、owner 側の設定が必要な部分が混在している。

### 原因A: `test.yml` のカバレッジコメントが `pull-requests: write` 権限不足で失敗

- 症状: `Test CI` ジョブの **"Comment PR with Coverage Info"** ステップで
  `X Resource not accessible by integration - https://docs.github.com/rest/issues/comments#create-an-issue-comment`
  （ Annotations 内の `Run Tests and Coverage: .github#25`）。
- 原因: ワークフローに `permissions:` 宣言が無く、GitHub の既定の read-only `GITHUB_TOKEN` で
  `marocchino/sticky-pull-request-comment@v2` が PR コメントを投稿できない。
  この step は `pull_request` イベントで必ず走るため、**PR のチェックが常に失敗**する。
- 影響: PR #2/#3/#4/#6 すべてが Test CI 赤で着地できない。
- 証拠: 実行 `40172316830`（PR #6, Test CI, 2026-10-25）— `Run tests with coverage` / `Generate coverage badge` /
  `Upload coverage reports to Codecov` はすべて ✓、失敗しているのは `Comment PR with Coverage Info` のみ。

### 原因B: `hardhat.yml` の "Deploy to Amoy" が無条件実行され、main の push でも失敗

- 症状: `Hardhat CI` ジョブの **"Deploy to Amoy"** ステップで
  `Error: getaddrinfo ENOTFOUND rpc-amoy.polygon.technology` → `Process completed with exit code 1`。
- 原因:
  1. ステップに `if:` が無く、**pull_request と push(main) の両方で実行される**（デプロイは CI の合否判定ではない）。
  2. 参照する secret が存在しない。2026-11-11 実測のリポジトリ secret 一覧:
     `CODECOV_TOKEN`, `MUMBAI_RPC_URL`, `POLYGONSCAN_API_KEY`, `POLYGON_RPC_URL`, `PRIVATE_KEY` のみ。
     **`AMOY_RPC_URL` / `INITIAL_SUPPLY` / `MAX_SUPPLY` / `AIRDROP_AMOUNT` は未設定**（ログ上も
     `AMOY_RPC_URL:`, `INITIAL_SUPPLY:` 等が空欄）。
  3. 未設定のため `hardhat.config.ts` のフォールバック
     `url: "https://rpc-amoy.polygon.technology"` が使われ、このホストは現在 **名前解決できない**。
     2026-11-11 ローカル検証: `socket.gethostbyname('rpc-amoy.polygon.technology')` →
     `No address associated with hostname`（GitHub ランナー側でも同症状の ENOTFOUND）。
  4. 仮に RPC が通っても、`ignition/modules/YKAToken.ts` は `initialOwner` / `initialSupply`
     パラメータを必須とするが、`ignition/params.json` 等が無く `npm run deploy:amoy` は
     パラメータ未指定で失敗する。
- 影響: **base `main` の push 自体が赤**（実行 `39644178661`: main push, Hardhat CI, failure /
  `39644178529`: 同じ main push の Test CI は success）。base が赤のままだと per-PR リフレッシュは
  成功しない、という報告内容と一致する。
- 証拠（main push 実行 `39644178661` のログ抜粋）:

  ```
  ##[group]Run npm run deploy:amoy
  env:
    PRIVATE_KEY: ***
    AMOY_RPC_URL:            <- 空（secret 未設定）
    INITIAL_SUPPLY:          <- 空（secret 未設定）
  ...
  > hardhat ignition deploy ./ignition/modules/YKAToken.ts --network amoy
  An unexpected error occurred:
  Error: getaddrinfo ENOTFOUND rpc-amoy.polygon.technology
    at GetAddrInfoReqWrap.onlookupall (node:dns:120:26) { code: 'ENOTFOUND' }
  ##[error]Process completed with exit code 1.
  ```

  なお同実行のテスト本体は `47 passing (2s)` で **成功**（contracts / テストコードの不備ではない）。

---

## 2. 適用した修正（リポジトリ内）

| ファイル | 変更 | 効果 |
|---|---|---|
| `.github/workflows/hardhat.yml` | `Deploy to Amoy` に `if: github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.ENABLE_AMOY_DEPLOY == 'true'` を付与 | PR では決してデプロイしない。main push でも既定（変数未設定）ではスキップされ、失敗原因にならない |
| `.github/workflows/hardhat.yml` | スキップ時に `Report Amoy deploy status` ステップで理由をログ表示 | スキップが「無言で落ちた」ように見えない |
| `.github/workflows/hardhat.yml` | `permissions: contents: read` を明示 | トークン権限を最小化・明示 |
| `.github/workflows/test.yml` | `permissions: contents: read / pull-requests: write` を追加 | 原因A（`Resource not accessible by integration`）を解消 |
| `.github/workflows/test.yml` | `Comment PR with Coverage Info` に `continue-on-error: true` | fork PR のようにトークンが read-only に降格される場合もコメント失敗でチェックが赤くならない |
| `.github/workflows/README.md` | 上記挙動の説明と実測 secret 一覧を追記 | 運用者が誤って「デプロイが実行された」と误解しない |
| `docs/development/ci-root-cause.md` | 本ドキュメント | 根拠の保存 |

変更していないもの: contracts / テストコード / `hardhat.config.ts` / `package.json` /
GitHub secret・変数・ワークフロー設定そのもの / `PURPOSE.md` / `AGENTS.md`。

---

## 3. リポジトリ外（owner 側の操作が必要な残課題）

以下は本リポジトリのコードからは設定できない。デプロイを実際に再開する場合は事前に実施すること。

1. **Amoy 用 secret の追加**: `AMOY_RPC_URL`（現在有効な Amoy エンドポイント。フォールバックの
   `rpc-amoy.polygon.technology` は名前解決できないため使用不可）、必要に応じて
   `INITIAL_SUPPLY` / `MAX_SUPPLY` / `AIRDROP_AMOUNT`。なお `MUMBAI_RPC_URL` は設定済みだが
   Mumbai は Amoy に置き換えられている。
2. **Ignition パラメータの準備**: `ignition/modules/YKAToken.ts` は `initialOwner` / `initialSupply`
   を必須とする。`ignition/params.json`（または同等）を用意し、CI から渡す経路を確定する。
   `initialOwner` にはデプロイ実行元のウォレットアドレスを指定すること。
3. **リポジトリ変数の設定**: デプロイを再開する場合のみ `ENABLE_AMOY_DEPLOY=true` を設定する
   （未設定 = スキップが既定動作）。
4. **main の push で Hardhat CI が緑になった後の PR リフレッシュ**: 本修正は base の赤を解消するが、
   PR #2/#3/#4/#6 自体は別 run で再実行が必要（本修正の範囲外）。

---

## 4. 検証

- YAML 構文: `python3 -c "import yaml; yaml.safe_load(...)"` で両 workflow をパースし、
  `permissions` / `if` / `continue-on-error` が意図どおり設定されていることを確認。
- テスト: 本ワークツリーで `npm ci` → `npm test` を実行 → **47 passing (4s)**（exit code 0）。
  ワークフロー変更はテストへ影響しない（Solidity / TypeScript の無変更）。
- 実行環境の実測: `socket.gethostbyname('rpc-amoy.polygon.technology')` → 解決失敗。
- CI 自体の成否（main push / PR run が緑になること）は修正の着地後に GitHub 側が決めるため、
  本 stage では**未観測**。ローカルで再現できる範囲（YAML 検証・テスト実行・DNS 実測）のみ確認済み。
