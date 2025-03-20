# Markdown to JSON 変換

## 概要

`shitauke-cli` を使用してマークダウン文書を構造化されたJSONデータに変換するための最適化されたプロンプト例です。適切な階層構造、リスト項目、フォーマット情報を維持します。

## 使用方法

```bash
# 基本的な使い方
shitauke send "$(cat ./optimal-prompt.txt)" -m gemini-2.0-flash-001 -f json -i ./sample.md -o ./output.json

# 上書きオプションを使用する場合
shitauke send "$(cat ./optimal-prompt.txt)" -m gemini-2.0-flash-001 -f json -i ./sample.md -o ./output.json --overwrite

# テンプレートとして保存して再利用する場合
shitauke template add "md2json" "$(cat ./optimal-prompt.txt)"
shitauke send -t "md2json" -i ./sample.md -o ./output.json
```

## 最適化されたプロンプト

`optimal-prompt.txt` ファイルに含まれる最適化されたプロンプトは、以下の特徴を持っています：

1. **階層構造の適切な処理**: 見出しレベルに基づいた正確なJSONオブジェクトの入れ子構造
2. **リスト項目の配列化**: 箇条書きリストを適切な配列として処理
3. **テーブルの変換**: マークダウンの表をオブジェクトの配列に変換
4. **フォーマット情報の保持**: 太字やリンクなどの装飾情報を構造化して保持
5. **データ型の適切な変換**: 日付、数値などを適切なデータ型に変換

## ファイル構成

- `sample.md`: 変換元のマークダウンファイル
- `optimal-prompt.txt`: 最適化された変換用プロンプト
- `output.json`: 生成されるJSONファイル例

## ユースケース

- **プロジェクト仕様書の構造化**: マークダウン形式で書かれたドキュメントを構造化してDBに保存
- **APIドキュメントの変換**: APIドキュメントをJSON形式に変換してプログラム的に処理
- **マークダウンフロントマターの扱い**: マークダウンのフロントマターをJSONとして抽出
- **CMSデータ変換**: マークダウン形式のコンテンツをCMS用に構造化

## 第三者ツールとの統合

生成されたJSONは、続いて`jq`や他のツールで処理できます：

```bash
# JSONの特定部分を抽出
cat output.json | jq '.\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u6982\u8981.\u6280\u8853\u30b9\u30bf\u30c3\u30af'

# MongoDBにインポート
mongoimport --db myproject --collection documents --file output.json
```
