# Unit Test Generator

## 概要
複雑な依存関係を持つTypeScriptサービスクラスに対して、モックを駆使した高度なJestユニットテストを自動生成します。外部依存を持つコードのテスト手法を学ぶのに最適です。

## 使用方法

### 基本的な使い方
```bash
node dist/index.js send "$(cat ./examples/unit-test-generator/prompt.txt)" \
  -m gemini-2.0-flash-001 \
  -f ts \
  -i ./examples/unit-test-generator/input.ts \
  -o ./examples/unit-test-generator/output.test.ts \
  --overwrite
```

### 別のモデルを使用する場合
```bash
node dist/index.js send "$(cat ./examples/unit-test-generator/prompt.txt)" \
  -m gpt-4-turbo \
  -f ts \
  -i ./examples/unit-test-generator/input.ts \
  -o ./examples/unit-test-generator/output.test.ts \
  --overwrite
```

## プロンプト最適化のポイント

1. **詳細なモック指示**: Jest特有のモック関数(spyOn, mockImplementationなど)の使用法を具体的に説明
2. **時間とランダム性の制御**: Date.nowやMath.randomのモック方法を指定
3. **エッジケースの網羅**: 成功パスだけでなく、エラーパスやエッジケースのテストも要求
4. **依存関係の詳細な検証**: モックが適切なパラメータで呼び出されることの検証を指示
5. **非同期処理の適切な取り扱い**: 複雑な非同期操作を正しくテストする方法を指定

## 入力/出力の説明

### 入力ファイル (input.ts)
複数の外部依存関係(APIクライアント、ロガー、キャッシュサービス)を持つ分析サービスクラスです。
非同期処理、エラーハンドリング、キャッシュ処理など複雑なロジックを含みます。

### 出力ファイル (output.test.ts)
生成された高度なJestテストファイルで、モックやスパイを駆使した包括的なテストケースが含まれています。

## ファイル構成
- `README.md`: 使用方法の説明（本ファイル）
- `prompt.txt`: モックテストに最適化されたプロンプト
- `input.ts`: 複雑な依存関係を持つサンプルTypeScriptコード
- `output.test.ts`: 生成された高度なテストコード

## ユースケース
- マイクロサービスやAPIのテスト作成
- 外部依存を持つレガシーコードのテスト追加
- モックとスパイを使ったテスト手法の学習
- CI/CDパイプラインのテストカバレッジ向上
- チーム内でのテスト標準化

## テスト技術のハイライト
- **依存性注入**: コンストラクタでの依存性注入を活用したテスト
- **モッキング**: 複雑な依存関係の詳細なモック
- **スパイ**: メソッド呼び出しの検証
- **フィクスチャ**: 再利用可能なテストデータ
- **時間の制御**: 日付と時間に依存するコードのテスト
- **ランダム性の制御**: 確率的な動作の決定的テスト
- **エラーハンドリング**: 例外処理とエラーパスのテスト
