# LLM Wiki

長期圧縮コンテキスト。原則: contracts `llm-wiki-discipline`（手本: defuddle
`docs/llm-wiki/`）。正本を複製せず、検証済み知識を出典付きで圧縮する。

## Verified Knowledge

- 成果物: Yka Protocol Core スマートコントラクト（Hardhat + OpenZeppelin + forge-std 構成の Ethereum 系開発環境）。（出典: README.md、hardhat.config.ts、contracts/）
- CI（hardhat.yml）は lint・compile・test のみ。Amoy テストネットは廃止済み（rpc-amoy.polygon.technology が NXDOMAIN、AMOY_RPC_URL secret も未設定）のため 2026-11-02 に deploy-to-Amoy ステップを削除。デプロイはローカル `npm run deploy:*` で実行。（出典: .github/workflows/hardhat.yml、main の CI run 39542605802 / 39644178661 で "Deploy to Amoy" のみ失敗・他 step 全パス）
