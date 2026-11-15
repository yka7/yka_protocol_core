# LLM Wiki

長期圧縮コンテキスト。原則: contracts `llm-wiki-discipline`（手本: defuddle
`docs/llm-wiki/`）。正本を複製せず、検証済み知識を出典付きで圧縮する。

## Verified Knowledge

- 成果物: Yka Protocol Core スマートコントラクト（Hardhat + OpenZeppelin + forge-std 構成の Ethereum 系開発環境）。（出典: README.md、hardhat.config.ts、contracts/）
- CI 契約: GitHub Actions 2本。`hardhat.yml` = lint/compile/test ＋ **opt-in の Amoy デプロイ**（main push かつ `vars.ENABLE_AMOY_DEPLOY=true` のときのみ。PR では実行しない）。`test.yml` = coverage ＋ PR コメント（`pull-requests: write` 権限・`continue-on-error`）。（出典: .github/workflows/hardhat.yml、.github/workflows/test.yml、docs/development/ci-root-cause.md）
