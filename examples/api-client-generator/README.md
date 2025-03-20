# API クライアントジェネレーター

## 概要

API仕様書をもとに、TypeScriptで型安全なAPIクライアントを単一ファイルとして自動生成するための最適化されたプロンプト例です。
axiosベースの堅牢なAPIクライアントを効率的に作成できます。

## 使用方法

```bash
# 基本的な使い方
shitauke send "$(cat ./optimal-prompt.txt)" -m gemini-2.0-flash-001 -f ts -i ./api_spec.json -o ./api-client.ts

# テンプレートとして保存して再利用
shitauke template add "api-client-generator" "$(cat ./optimal-prompt.txt)"
shitauke send -t "api-client-generator" -i ./new_api_spec.json -o ./new-api-client.ts
```

## プロンプト最適化のポイント

`optimal-prompt.txt` には、以下の工夫を施しています：

1. **明確な技術要件**: TypeScript, axios, 非同期処理など具体的な実装技術を指定
2. **コーディングスタイル指定**: 命名規則やドキュメント形式を統一
3. **単一ファイル出力**: 全てのコードを1つのファイルとして出力し、後処理が不要
4. **エラーハンドリング**: リクエスト失敗時の適切な処理方法を明示
5. **拡張性と保守性**: 将来の機能追加や変更に対応しやすい設計

## 入力仕様

`api_spec.json` は以下のような形式のJSONファイルです：

```json
{
  "baseUrl": "https://api.example.com/v1",
  "auth": {
    "type": "Bearer",
    "headerName": "Authorization"
  },
  "endpoints": [
    {
      "method": "GET",
      "path": "/users",
      "description": "ユーザー一覧を取得",
      "params": {
        "page": "number, optional",
        "limit": "number, optional"
      },
      "response": {
        "users": "User[]",
        "total": "number",
        "page": "number",
        "totalPages": "number"
      }
    },
    ...
  ],
  "models": {
    "User": {
      "id": "string",
      "name": "string",
      "email": "string",
      "age": "number?",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  }
}
```

## 出力例

生成される `api-client.ts` は以下の機能を含む単一のTypeScriptファイルです：

1. 型定義（インターフェース、型エイリアス）
2. エラー処理
3. ユーティリティ関数
4. APIクライアントクラス
5. 使用例

## ファイル構成

- `README.md`: 使用方法の説明
- `optimal-prompt.txt`: 最適化されたプロンプト
- `api_spec.json`: 入力例（APIの仕様）
- `api-client.ts`: 出力例（生成されたAPIクライアント）

## ユースケース

- 新規APIとの連携開発の効率化
- 既存APIクライアントの型安全なリファクタリング
- フロントエンド・バックエンド間の型共有
- SDKパッケージの自動生成

## 拡張アイデア

1. **スキーマファースト開発**: OpenAPI/Swagger仕様からの自動生成
2. **マルチ言語対応**: TypeScript以外の言語クライアント生成
3. **テストコード自動生成**: クライアント実装に対応するテストの生成
4. **ドキュメント自動生成**: APIクライアントの使用方法ドキュメント生成