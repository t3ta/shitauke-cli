import { Command } from 'commander';
import chalk from 'chalk';
import * as logger from '../utils/logger.js';

/**
 * Configure the examples command
 */
export function configureExamplesCommand(program: Command): void {
  const examplesCommand = program
    .command('examples')
    .description('Show examples of using shitauke-cli with different models');

  // General usage examples
  examplesCommand
    .command('usage')
    .description('Show general usage examples')
    .action(() => {
      console.log(chalk.bold('\n📚 shitauke-cli の基本的な使い方\n'));
      
      console.log(chalk.cyan('基本的なプロンプト送信:'));
      console.log('  shitauke send "Python で簡単なWebスクレイピングツールを作成してください"');
      
      console.log(chalk.cyan('\nモデル指定、出力フォーマット、ファイル操作:'));
      console.log('  shitauke send -m gpt-4 "レストランのメニュー企画を5つ提案してください"');
      console.log('  shitauke send -f json "次のユーザーデータを構造化してください: 山田太郎, 30歳, エンジニア"');
      console.log('  shitauke send -i ./data.txt "このデータを分析してください"');
      console.log('  shitauke send "マーケティング戦略の提案書" -o ./marketing_proposal.md');
      console.log('  shitauke send -t "技術記事" "TypeScriptの型システムについて解説"');
      
      console.log(chalk.bold('\n🔍 詳細なヘルプ:'));
      console.log('  shitauke --help');
      console.log('  shitauke <command> --help');
    });

  // Model-specific examples
  examplesCommand
    .command('models')
    .description('Show examples for specific AI models')
    .action(() => {
      console.log(chalk.bold('\n🤖 各AIモデルの使用例\n'));
      
      // OpenAI models
      console.log(chalk.cyan.bold('OpenAI:'));
      console.log('  shitauke send -m gpt-4 "量子コンピューティングが機械学習にもたらす影響を分析してください"');
      console.log('  shitauke send -m gpt-3.5-turbo "JavaScriptで配列操作を行う方法を説明してください"');
      
      // Anthropic models
      console.log(chalk.cyan.bold('\nAnthropic:'));
      console.log('  shitauke send -m claude-3-opus "気候変動に関する最新の科学的知見をまとめてください"');
      console.log('  shitauke send -m claude-3-sonnet "新しいSaaSプロダクトのマーケティングコピーを作成してください"');
      console.log('  shitauke send -m claude-3-haiku "この問題のデバッグ方法を簡潔に説明してください"');
      
      // Gemini models
      console.log(chalk.cyan.bold('\nGoogle Gemini:'));
      console.log('  shitauke send -m gemini-2.0-pro "機械学習アルゴリズムの比較分析と実装例を提供してください"');
      console.log('  shitauke send -m gemini-2.0-flash "明日の会議用のアジェンダを作成してください"');
      console.log('  shitauke send -m gemini-2.0-flash-lite "日常会話で使える英語フレーズを10個リストアップしてください"');
      console.log('  shitauke send -m gemini-pro-vision "アップロードした画像の詳細な分析をしてください"');
      console.log('  shitauke send -m gemini-1.0-pro "AIの倫理に関する教育カリキュラムの概要を作成してください"');
      
      console.log(chalk.bold('\n💡 モデル選択のヒント:'));
      console.log('- 複雑な分析: GPT-4、Claude-3-Opus、Gemini-2.0-Pro');
      console.log('- コーディング: Gemini-2.0-Pro、GPT-4');
      console.log('- クリエイティブ: Claude-3-Sonnet');
      console.log('- 高速レスポンス: Gemini-2.0-Flash、GPT-3.5-Turbo、Claude-3-Haiku');
      console.log('- コスト効率: Gemini-2.0-Flash-Lite、GPT-3.5-Turbo');
      console.log('- 画像分析: Gemini-Pro-Vision');
    });

  // Workflow examples
  examplesCommand
    .command('workflows')
    .description('Show examples of common workflows')
    .action(() => {
      console.log(chalk.bold('\n🔄 実践的なワークフロー例\n'));

      console.log(chalk.cyan('1. ドキュメント作成ワークフロー:'));
      console.log('  # 1. 初期ドラフト作成');
      console.log('  shitauke send -m claude-3-sonnet "JavaScriptの非同期処理チュートリアル" -o ./draft.md');
      console.log('  # 2. ドラフトの改善');
      console.log('  shitauke send -m gpt-4 -i ./draft.md "このドラフトを改善" -o ./improved.md');
      console.log('  # 3. 最終レビュー');
      console.log('  shitauke send -m gemini-2.0-pro -i ./improved.md "技術的正確さをチェック" -o ./final.md');

      console.log(chalk.cyan('\n2. コード開発ワークフロー:'));
      console.log('  # 1. 設計 → 2. コード生成 → 3. テスト作成');
      console.log('  shitauke send "Todoアプリの設計" -o ./architecture.md');
      console.log('  shitauke send -m gemini-2.0-pro -i ./architecture.md "Reactコンポーネント実装" -o ./frontend.jsx');
      console.log('  shitauke send -i ./frontend.jsx "Jestテスト作成" -o ./frontend.test.js');

      console.log(chalk.bold('\n💡 ワークフローのコツ:'));
      console.log('- 複数のモデルを使い分け、それぞれの強みを活かす');
      console.log('- 段階的に品質を向上させる');
      console.log('- 中間成果物をファイルとして保存し、次のステップへ利用');
    });
  
  // Command aliases for quick example access
  examplesCommand
    .command('quick')
    .description('Show quick examples for common tasks')
    .action(() => {
      console.log(chalk.bold('\n⚡ よく使う発注例\n'));
      
      console.log(chalk.cyan('コード作成:'));
      console.log('  shitauke send -m gemini-2.0-pro "APIデータを取得して表示するReactコンポーネントを作成"');
      
      console.log(chalk.cyan('\n文書作成:'));
      console.log('  shitauke send -m claude-3-sonnet -f markdown "新製品の発表資料を作成" -o ./product_launch.md');
      
      console.log(chalk.cyan('\nデータ分析:'));
      console.log('  shitauke send -m gpt-4 -i ./sales_data.csv "2024年の売上傾向を分析し、グラフ化"');
      
      console.log(chalk.cyan('\n翻訳:'));
      console.log('  shitauke send -m gemini-2.0-flash "次の日本語テキストを英語に翻訳: [テキスト]"');
      
      console.log(chalk.cyan('\n要約:'));
      console.log('  shitauke send -i ./document.txt "このドキュメントを3段落で要約"');
    });
}
