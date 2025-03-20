# shitauke-cli

`shitauke-cli` は、AIモデル（OpenAI, Anthropic, Gemini など）への発注をCLIで行うためのツールです。
敏腕プロデューサーのために設計され、適切なAIモデルに適切な指示を出すことで、
精度の高い成果物を素早く取得できます。

## 🚀 特徴
- **簡単なCLI操作**: コマンド一つで発注が完了
- **AIモデルの自動選定**: OpenAI, Anthropic, Gemini など適切なAIを自動で選択
- **フォーマット統一**: JSON / Markdown 形式で出力
- **コードブロック自動除去**: 全ての出力形式（JSON/TS/Markdown/Text）でコードブロック記法を自動除去
- **発注履歴の管理**: 過去の発注を記録し、再利用が可能
- **カスタムプロンプト**: よく使う発注テンプレートを保存
- **コスト管理**: APIの利用料金を記録し、コストを可視化
- **ファイル送信機能**: 指定したパスのファイルを発注時に添付可能
- **出力書き込み機能**: 指定したパスに発注結果を保存可能
- **上書きオプション**: 既存の出力ファイルを上書きするかどうかを指定可能
- **使用例表示機能**: モデル別の使用例や効果的なプロンプト例を表示

## 📦 インストール
```sh
# npm でインストール（予定）
npm install -g shitauke-cli

# または GitHub からクローン
git clone https://github.com/your-org/shitauke-cli.git
cd shitauke-cli
npm install
npm run build
npm link  # ローカルで開発用にリンク
```

## ⚙️ 設定
最初に使用する前に、APIキーを設定する必要があります。
これは以下の方法で行えます：

1. `~/.shitauke/config.json` ファイルを直接編集
2. 環境変数を設定：`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
3. プロジェクトルートに `.env` ファイルを作成（`.env.example` を参考に）

```json
{
  "api_keys": {
    "openai": "sk-xxxxxxxxxxxx",
    "anthropic": "sk-ant-xxxxxxxxxxxx",
    "gemini": "gm-xxxxxxxxxxxx"
  },
  "default_model": "gpt-4",
  "default_format": "markdown"
}
```

## 🛠 使い方
### 基本的な発注
```sh
shitauke send "Python でCLIツールを作成するコードを書いてください"
```

### AIモデルの指定
```sh
shitauke send -m claude-3-sonnet "この文章を要約してください"
```

### 出力フォーマットの指定
```sh
shitauke send -f json "このデータを構造化してください"
```

### ファイルを指定して送信
```sh
shitauke send -i ./input.txt
```

### 出力をファイルに保存
```sh
shitauke send "このテキストを翻訳してください" -o ./output.txt
```

### 出力ファイルを上書き
```sh
shitauke send "この文章を英訳してください" -o ./output.txt --overwrite
```

### 発注履歴の確認
```sh
shitauke history list
```

### 発注履歴の詳細表示
```sh
shitauke history show <id>
```

### 発注履歴の削除
```sh
shitauke history delete <id>
```

### よく使う発注テンプレートの管理
```sh
# テンプレートの追加
shitauke template add "記事の要約依頼" -d "記事を要約するためのテンプレート"

# テンプレートを使った発注
shitauke send -t "記事の要約依頼" "今日のニュース: ..."

# テンプレート一覧
shitauke template list

# テンプレートの削除
shitauke template delete "記事の要約依頼"
```

### コスト管理
```sh
# コストレポートの表示
shitauke cost report

# 指定期間のコストレポート
shitauke cost report --days 30
shitauke cost report --from 2023-01-01 --to 2023-12-31
```

### 使用例の表示
```sh
# 基本的な使用例を表示
shitauke examples usage

# 各AIモデルごとの最適な使用例を表示
shitauke examples models

# 実践的なワークフロー例を表示
shitauke examples workflows

# よく使う発注例をすぐに確認
shitauke examples quick
```

## 💡 活用シナリオ

### 1. マルチモデル連携ワークフロー
複数のAIモデルを連携させて質の高い成果物を効率的に作成:

```sh
# 1. Claude-3-Sonnetでクリエイティブな企画を作成
shitauke send -m claude-3-sonnet "新規ECサイトのマーケティング戦略を10案考えてください" -o ./marketing_ideas.md

# 2. GPT-4で企画を分析・強化
shitauke send -m gpt-4 -i ./marketing_ideas.md "これらの案を分析し、最も効果的な3つを選び、詳細化してください" -o ./top_strategies.md

# 3. Geminiで実行計画に落とし込む
shitauke send -m gemini-2.0-flash-001 -i ./top_strategies.md "これらの戦略を実行するための具体的なタイムラインとKPIを設定してください" -o ./execution_plan.md
```

### 2. コンテンツ制作パイプライン
効率的なコンテンツ制作フロー:

```sh
# 1. テンプレートを利用して記事の構成を作成
shitauke template add "技術記事" "次のトピックについて技術記事を書いてください。導入、背景、主要ポイント（最低3つ）、実装例、まとめの構成で作成してください。"
shitauke send -t "技術記事" "TypeScriptの型システムの活用方法" -o ./article_draft.md

# 2. ドラフトを改善
shitauke send -i ./article_draft.md "この記事にコード例を追加し、読みやすさを向上させてください" -o ./improved_article.md

# 3. 最終チェック
shitauke send -i ./improved_article.md "この記事の技術的正確性をチェックし、改善点があれば指摘してください" -o ./final_article.md
```

## 📊 使用可能なGeminiモデル

`shitauke-cli` では、以下のGemini 2.0シリーズモデルをサポートしています：

```
# Gemini 2.0シリーズ
gemini-2.0-flash-001        # 次世代の機能と速度を提供するマルチモーダルモデル
gemini-2.0-flash-lite-001   # 費用対効果の高い低レイテンシモデル
```

### Geminiモデルの活用例

```sh
# Gemini 2.0 Flashを使用した発注
shitauke send -m gemini-2.0-flash-001 "最新のWeb開発トレンドについて詳しく教えてください"

# マルチモーダル入力
shitauke send -m gemini-2.0-flash-001 -i ./screenshot.png "この画面に表示されているエラーの原因と解決策を教えてください"

# ストリーミングモードでリアルタイム出力
shitauke send -m gemini-2.0-flash-lite-001 "AIの将来について考察してください" --stream
```

## 📚 プロンプト例と活用シーン

`examples` ディレクトリには、`shitauke-cli` を使った様々なユースケースの例が含まれています。
各例は「入力→処理→出力」の一連の流れを示し、AIモデルへの効果的な発注方法を学ぶための参考になります。

### markdown-to-json

マークダウン文書を構造化されたJSONデータに変換する例です。見出し階層、リスト項目、テーブル、フォーマット情報（太字やリンクなど）を適切に保持します。

```sh
# マークダウンをJSON形式に変換
shitauke send "$(cat ./examples/markdown-to-json/optimal-prompt.txt)" \
  -m gemini-2.0-flash-001 \
  -f json \
  -i ./examples/markdown-to-json/sample.md \
  -o ./output.json
```

特徴：
- `-f json` オプションを使用すると、AIモデルからの出力にマークダウンコードブロックが含まれていても自動的に削除され、整形されたJSONファイルが生成されます
- また、`-f ts`, `-f text`, `-f markdown` でも同様にコードブロック記法は削除されます
- JSON形式のバリデーションと整形処理が行われます
- 適切な階層構造、リスト項目、フォーマット情報を維持します

### api-client-generator

API仕様からTypeScriptクライアントを生成する例です。

```sh
# API仕様からTypeScriptクライアントを生成
shitauke send "$(cat ./examples/api-client-generator/optimal-prompt.txt)" \
  -m gemini-2.0-flash-001 \
  -f ts \
  -i ./examples/api-client-generator/api_spec.json \
  -o ./api-client.ts
```

## 🛠 開発環境
本プロジェクトは **TypeScript + Node.js + tsup** を使用し、ESM モジュール形式で構築されています。
### ビルド & 実行
```sh
npm run build
npm run start
```

### 開発モードで実行
```sh
npm run dev
```

## 📜 ライセンス
MIT License

## 📬 コントリビュート
バグ報告・機能提案は [Issues](https://github.com/your-org/shitauke-cli/issues) へ！
プルリクエストも歓迎です 🙌