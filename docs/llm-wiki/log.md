# GoalDev Log

永続的決定と完了記録を追記する。各エントリに日付と検証を必ず付ける
（原則: contracts `llm-wiki-discipline` の log-is-append-with-correction）。

## 2026-09-26 — llm-wiki スキャフォールド

contracts の llm-wiki-discipline 原則に基づき `docs/llm-wiki/` を新設した。

- **Verification**: 原則 `registry/principles/llm-wiki-discipline.yaml`（contracts リポ commit 3ab5768）。

## 2026-09-26 — 親の確定（jinno確定）

relations.md の親草案を確定版へ訂正した（親: business_notes）。

**Verification**: contracts registry `registry/organization/repositories/yka_protocol_core.yaml` の spec.parent と一致することを確認（contracts commit ecbc226、validate/lint 0 errors 済み）。

## 2026-11-11 — CI 契約の修正（main の赤を解消）

base `main` の CI 失敗（stranded PR #2/#3/#4/#6）の根本原因を查明し、ワークフローを修正した。
Amoy デプロイは main push + `vars.ENABLE_AMOY_DEPLOY=true` のときのみ実行（PR では実行しない）、
PR コメントは `pull-requests: write` 付与 + `continue-on-error` とし、失敗でチェックが赤くならない。

**Verification**: `npm test` → 47 passing（exit 0）。両 workflow の YAML パース成功。実行ログ
（main push 39644178661 / PR 40172316830 / PR 40172316815）とリポジトリ secret 一覧で原因を確認。
CI 自体の緑化は着地後の GitHub 側判定であり本 run では未観測。詳細は
`docs/development/ci-root-cause.md`。
