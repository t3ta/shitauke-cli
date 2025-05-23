# コードコメント翻訳プロンプト例

## 概要

このサンプルは、ソースコード内のコメントと識別子（変数名・関数名・クラス名など）を日本語から英語に翻訳するプロンプトの例です。コードの機能や構造を維持しながら、国際的な開発環境向けにコードを準備します。

## 使用方法

```bash
# 基本的な使用方法
shitauke send "$(cat ./examples/code-comment-translator/optimal-prompt.txt)" \
  -m gemini-2.0-flash-001 \
  -f text \
  -i ./examples/code-comment-translator/input.py \
  -o ./output.py

# オーバーライドオプション付き
shitauke send "$(cat ./examples/code-comment-translator/optimal-prompt.txt)" \
  -m gemini-2.0-flash-001 \
  -f text \
  -i ./examples/code-comment-translator/input.py \
  -o ./output.py \
  --overwrite

# テンプレートとして保存して使用
shitauke template add "コード翻訳" "$(cat ./examples/code-comment-translator/optimal-prompt.txt)" -d "コードのコメントと識別子を翻訳"
shitauke send -t "コード翻訳" -i ./examples/code-comment-translator/input.py -o ./output.py
```

## プロンプト最適化のポイント

1. **明確な翻訳対象**: ドキュメンテーション文字列、行コメント、変数名など、翻訳すべき要素を明示
2. **除外対象の指定**: 文字列リテラル、ライブラリ名、Pythonキーワードなど翻訳しない要素を明示
3. **具体例の提示**: 変換例を示して期待する出力を明確に
4. **コード構造の保持**: インデントやコードの構造を維持するよう指示
5. **出力フォーマットの指定**: マークダウンブロックなしでコードをそのまま出力するよう指示

## 入力/出力の説明

### 入力ファイル (input.py)
日本語の変数名、関数名、クラス名、コメントを含むPythonスクリプト。時系列データ分析のための簡単なユーティリティクラスと関数を実装しています。日本語の識別子（データ読み込み、時系列分析など）とドキュメンテーション文字列で構成されています。

### 出力ファイル (output.py)
入力ファイルの機能を維持しながら、すべての日本語の識別子とコメントが英語に翻訳されたバージョン。変数名、関数名、クラス名が適切な英語の命名規則に従って変換され（例：`データ読み込み` → `load_data`）、すべてのドキュメンテーション文字列とコメントが英語で書き直されています。

## ファイル構成

- **README.md**: 使用方法と説明（このファイル）
- **optimal-prompt.txt**: 最適化されたコードコメント翻訳用プロンプト
- **input.py**: 翻訳対象の日本語コメント・識別子を含むPythonコード
- **output.py**: 英語に翻訳されたPythonコード

## ユースケース

- 国際的な開発チームでの協業準備
- オープンソースプロジェクトへの貢献前の準備
- レガシーコードの国際化
- 技術ドキュメント作成のためのコード準備
- 非英語話者が書いたコードの標準化

## 拡張アイデア

- 複数言語への翻訳対応（英語→スペイン語、英語→中国語など）
- コード内の文字列リテラルの翻訳オプション追加
- 特定の業界用語やフレームワーク固有の用語に対応する辞書機能
- 翻訳前後の差分ハイライト機能
- コーディング規約に合わせた命名規則の適用（CamelCase/snake_caseなど）