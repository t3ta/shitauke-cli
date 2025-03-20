import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService } from './ai-service.js';
import { RequestOptions, AIResponse, AVAILABLE_MODELS } from '../models/types.js';
import { getApiKey } from '../utils/config.js';
import { calculateCost } from '../utils/costs.js';
import * as logger from '../utils/logger.js';

export class GeminiService implements AIService {
  private client: GoogleGenerativeAI | null = null;
  
  /**
   * Initialize the Gemini client
   */
  private async initClient(): Promise<GoogleGenerativeAI> {
    if (this.client) {
      return this.client;
    }
    
    const apiKey = await getApiKey('gemini');
    
    if (!apiKey) {
      throw new Error('Gemini API key is not set. Please set it in your config.');
    }
    
    this.client = new GoogleGenerativeAI(apiKey);
    
    return this.client;
  }
  
  /**
   * Get the provider of this service
   */
  public getProvider() {
    return 'gemini';
  }
  
  /**
   * Check if this service supports the given model
   */
  public supportsModel(model: string): boolean {
    return AVAILABLE_MODELS.gemini.includes(model);
  }
  
  /**
   * Get the correct model name for the Gemini API
   */
  private getCorrectModelName(model: string): string {
    // 内部使用の旧モデル名を現在のAPI名にマッピング
    const modelMap: Record<string, string> = {
      'gemini-1.0-pro': 'gemini-pro',
      // Gemini 2.0シリーズはモデルIDをそのまま使用
      'gemini-2.0-flash-001': 'gemini-2.0-flash-001',
      'gemini-2.0-flash-lite-001': 'gemini-2.0-flash-lite-001',
      // Gemini 1.5シリーズはモデルIDをそのまま使用
      'gemini-1.5-pro-002': 'gemini-1.5-pro-002',
      'gemini-1.5-flash-002': 'gemini-1.5-flash-002'
    };
    
    return modelMap[model] || model;
  }
  
  /**
   * Process input files and prepare content for the request
   * マルチモーダル入力処理用のメソッド
   */
  private async prepareInputContent(options: RequestOptions): Promise<any[]> {
    // 基本はテキスト入力
    const contents: any[] = [{ text: options.prompt }];
    
    // 入力ファイルがあれば処理
    if (options.inputFiles && options.inputFiles.length > 0) {
      logger.info(`Processing ${options.inputFiles.length} input files...`);
      
      for (const filePath of options.inputFiles) {
        try {
          // Node.jsのfsモジュールを使用してファイルを読み込む
          const fs = await import('fs/promises');
          const fileData = await fs.readFile(filePath);
          const mimeType = this.getMimeType(filePath);
          
          if (mimeType.startsWith('image/')) {
            // 画像ファイルの場合はマルチモーダル入力として追加
            const base64Data = fileData.toString('base64');
            contents.push({
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            });
            logger.info(`Added image file: ${filePath}`);
          } else {
            // テキストファイルの場合はテキスト内容を追加
            const textContent = fileData.toString('utf-8');
            // プロンプトの末尾にファイル内容を追加
            contents[0].text += `\n\nFile: ${filePath}\n\n${textContent}`;
            logger.info(`Added text file content: ${filePath}`);
          }
        } catch (error) {
          logger.error(`Error processing file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // 出力フォーマットの指示を追加
    if (options.format) {
      switch (options.format) {
        case 'json':
          contents[0].text += '\n\nPlease provide the response in valid JSON format.';
          break;
        case 'markdown':
          contents[0].text += '\n\nPlease provide the response in Markdown format.';
          break;
      }
    }
    
    return contents;
  }
  
  /**
   * ファイルのMIMEタイプを拘出
   */
  private getMimeType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'text/plain';
    }
  }
  
  /**
   * ストリーミング出力の処理
   */
  private async handleStreamingResponse(
    originalModel: string,
    result: any,
    inputContent: string
  ): Promise<AIResponse> {
    // ストリーミングレスポンスを取得
    let fullContent = '';
    process.stdout.write('\n'); // 新しい行から出力開始
    
    // ストリームを処理
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullContent += chunkText;
      process.stdout.write(chunkText); // リアルタイム表示
    }
    
    process.stdout.write('\n\n'); // レスポンス完了後に行を空ける
    
    // トークンとコストを計算
    const promptTokens = Math.ceil(inputContent.length / 4);
    const completionTokens = Math.ceil(fullContent.length / 4);
    const totalTokens = promptTokens + completionTokens;
    const cost = calculateCost(originalModel, promptTokens, completionTokens);
    
    logger.success(`Completed streaming response from Gemini (${originalModel}).`);
    logger.debug(`Estimated usage: ~${promptTokens} prompt tokens, ~${completionTokens} completion tokens, ~${cost.toFixed(6)} cost.`);
    
    // AIResponseオブジェクトを返す
    return {
      content: fullContent,
      model: originalModel,
      provider: this.getProvider(),
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        cost
      },
      timestamp: Date.now()
    };
  }

  /**
   * Send a request to the Gemini model
   */
  public async sendRequest(options: RequestOptions): Promise<AIResponse> {
    try {
      const client = await this.initClient();
      
      // 入力コンテンツを準備
      const contents = await this.prepareInputContent(options);
      
      // 使用するモデルを決定
      const originalModel = options.model || 'gemini-pro';
      const model = this.getCorrectModelName(originalModel);
      
      logger.info(`Sending request to Gemini (${originalModel})...`);
      
      // Geminiモデルのセットアップ
      const geminiModel = client.getGenerativeModel({ 
        model,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens,
          topP: 0.9,
          topK: 40
        }
      });
      
      // ストリーミングモードの処理
      if (options.stream) {
        const result = await geminiModel.generateContentStream(contents);
        return this.handleStreamingResponse(originalModel, result, contents[0].text);
      }
      
      // 通常のリクエスト処理
      const result = await geminiModel.generateContent(contents);
      const response = result.response;
      const content = response.text();
      
      // Geminiは詳細なトークン使用量を提供しないため、2024年現在は下記のように概算で推定
      const promptTokens = Math.ceil(contents[0].text.length / 4);
      const completionTokens = Math.ceil(content.length / 4);
      const totalTokens = promptTokens + completionTokens;
      const cost = calculateCost(originalModel, promptTokens, completionTokens);
      
      const aiResponse: AIResponse = {
        content,
        model: originalModel,
        provider: this.getProvider(),
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          cost
        },
        timestamp: Date.now()
      };
      
      logger.success(`Received response from Gemini (${originalModel}).`);
      logger.debug(`Estimated usage: ~${promptTokens} prompt tokens, ~${completionTokens} completion tokens, ~${cost.toFixed(6)} cost.`);
      
      return aiResponse;
    } catch (error) {
      logger.error(`Error sending request to Gemini: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
