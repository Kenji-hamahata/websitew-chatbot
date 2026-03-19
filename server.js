const express = require('express');
const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// JSONリクエストボディの解析
app.use(express.json());

// 静的ファイルの配信（index.html など）
app.use(express.static(path.join(__dirname)));

// Claude APIクライアントの初期化
const anthropic = new Anthropic();

// NexAIアシスタント用のシステムプロンプト
const SYSTEM_PROMPT = `あなたはNexAI株式会社のAIアシスタント「NexAIアシスタント」です。
以下のルールに従って、丁寧かつ簡潔に日本語で応答してください。

【会社情報】
- 会社名: NexAI株式会社（NexAI Inc.）
- キャッチコピー: 「AIで、ビジネスの次へ」
- 事業内容: AI導入コンサルティング、AI研修・教育、AI開発受託の3つのサービスを提供

【サービス詳細】
1. AI導入コンサルティング: 企業のAI活用戦略の策定から導入支援まで、ビジネス課題に最適なAIソリューションをご提案
2. AI研修・教育プログラム: 経営層から現場担当者まで、レベルに応じたAI活用スキルを習得できる実践的なプログラム
3. AI開発受託: 最新のAI技術を活用したシステム開発。チャットボット、画像認識、自然言語処理などの開発を支援

【実績】
- 導入企業: 150社以上
- 受講者数: 2,000名以上
- 満足度: 98%
- プロジェクト実績: 300件以上

【料金プラン】
- スタータープラン: 月額50,000円〜（小規模チーム向け、AI活用の第一歩に最適）
- ビジネスプラン: 月額150,000円〜（中規模企業向け、本格的なAI導入に）
- エンタープライズプラン: 要お見積り（大規模組織向け、フルカスタマイズ対応）

【応答ルール】
- 常に丁寧な日本語で応答する
- NexAIのサービスに関する質問には積極的に回答する
- 具体的な相談は「お問い合わせフォームからご連絡ください」と案内する
- 技術的な質問にも分かりやすく回答する
- 競合他社の批判はしない
- 回答は簡潔に、3〜4文程度にまとめる`;

// チャットAPIエンドポイント
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'メッセージが必要です' });
  }

  try {
    // 会話履歴を構築（直近10往復まで保持）
    const messages = [];
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-20); // 最大20メッセージ（10往復）
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    messages.push({ role: 'user', content: message });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    // テキストブロックから応答を取得
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    res.json({ reply: text });
  } catch (error) {
    console.error('Claude API エラー:', error.message);
    res.status(500).json({
      error: '申し訳ございません。現在応答できません。しばらくしてからお試しください。',
    });
  }
});

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
