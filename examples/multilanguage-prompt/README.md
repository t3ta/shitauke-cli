# 多言語対応プロンプト例

## 概要

このサンプルは、単一のテキスト文書を複数の言語に同時翻訳するプロンプトの例です。マークダウン形式を維持しながら、構造化された出力を生成します。

## 使用方法

```bash
# 基本的な使用方法
shitauke send "$(cat ./examples/multilanguage-prompt/optimal-prompt.txt)" \
  -m gemini-2.0-flash-001 \
  -f markdown \
  -i ./examples/multilanguage-prompt/input.txt \
  -o ./output.md

# オーバーライドオプション付き
shitauke send "$(cat ./examples/multilanguage-prompt/optimal-prompt.txt)" \
  -m gemini-2.0-flash-001 \
  -f markdown \
  -i ./examples/multilanguage-prompt/input.txt \
  -o ./output.md \
  --overwrite

# テンプレートとして保存して使用
shitauke template add "多言語翻訳" "$(cat ./examples/multilanguage-prompt/optimal-prompt.txt)" -d "テキストを複数言語に翻訳"
shitauke send -t "多言語翻訳" -i ./examples/multilanguage-prompt/input.txt -o ./output.md
```

## プロンプト最適化のポイント

1. **明確な言語指定**: 翻訳対象の言語を明示的にリスト化
2. **翻訳品質の要件**: 直訳ではなく自然な表現を優先するよう指示
3. **構造的な出力フォーマット**: 言語ごとに見出しと区切り線で整理
4. **書式保持の指示**: マークダウン形式、テーブル、リスト構造を維持
5. **地域化の配慮**: 価格や数値の表記法を各国の慣習に合わせるよう指示

## 入力/出力の説明

### 入力ファイル (input.txt)
日本語で書かれた製品リリースのお知らせ。マークダウン形式で、見出し、リスト、テーブル、リンクなどの要素を含みます。

### 出力ファイル (output.md)
入力テキストを5つの異なる言語（英語、スペイン語、フランス語、ドイツ語、中国語）に翻訳した結果。
各言語のセクションは見出しと区切り線で分けられ、元のマークダウン形式が保持されています。
価格情報は各地域の通貨表記に合わせて調整されています。

## ファイル構成

- **README.md**: 使用方法と説明（このファイル）
- **optimal-prompt.txt**: 最適化された多言語翻訳用プロンプト
- **input.txt**: 翻訳対象の日本語テキスト
- **output.md**: 生成された多言語翻訳結果

## ユースケース

- 国際展開するプロダクトのドキュメント翻訳
- 多言語対応が必要なプレスリリースや製品情報
- グローバルチームでの情報共有
- 国際マーケティング資料の作成
- ソフトウェアの多言語ローカライゼーション

## 拡張アイデア

- 翻訳対象言語の追加（ロシア語、アラビア語、ポルトガル語など）
- 特定の業界向け専門用語辞書の組み込み
- 文化的な背景を考慮した翻訳オプションの追加
- 言語ごとのトーン調整（フォーマル/カジュアル）
- 言語間の差異を強調するためのレポート機能