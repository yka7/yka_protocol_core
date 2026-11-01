# GoalDev Log

永続的決定と完了記録を追記する。各エントリに日付と検証を必ず付ける
（原則: contracts `llm-wiki-discipline` の log-is-append-with-correction）。

## 2026-09-26 — llm-wiki スキャフォールド

contracts の llm-wiki-discipline 原則に基づき `docs/llm-wiki/` を新設した。

- **Verification**: 原則 `registry/principles/llm-wiki-discipline.yaml`（contracts リポ commit 3ab5768）。

## 2026-09-26 — 親の確定（jinno確定）

relations.md の親草案を確定版へ訂正した（親: business_notes）。

**Verification**: contracts registry `registry/organization/repositories/yka_protocol_core.yaml` の spec.parent と一致することを確認（contracts commit ecbc226、validate/lint 0 errors 済み）。

## 2026-11-02 — Hardhat CI から deploy-to-Amoy ステップを削除

main を含む全 CI ランで "Deploy to Amoy" step のみが失敗し（lint/compile/test は全パス）、PR #2/#3/#4/#6 が滞留していた。原因はリポジトリ外: Amoy テストネット廃止（rpc-amoy.polygon.technology が NXDOMAIN）+ AMOY_RPC_URL secret 未設定。CI を lint・compile・test に限定し、workflows/README を整合させた。デプロイはローカル `npm run deploy:*`（テストネット移行は owner 決定待ち）。

**Verification**: ワークツリーで npm ci / npm run lint / npm run compile / npm run test 全 exit 0（47 passing）。CI 上の最終判定は PR の CI ラン。
