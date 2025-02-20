import { GoogleGenerativeAI } from '@google/generative-ai'; // 引入官方 Gemini API 库

const apiKey = (import.meta.env.GEMINI_API_KEY) as string; // 确保 apiKey 是字符串类型
const apiBaseUrl = (import.meta.env.API_BASE_URL)?.trim().replace(/\/$/, '');

const genAI = apiBaseUrl
  ? new GoogleGenerativeAI(apiKey, { apiEndpoint: apiBaseUrl }) // 使用 apiEndpoint 配置项
  : new GoogleGenerativeAI(apiKey);

interface ChatMessagePart {
  text: string;
  // 可以根据你的实际 Message 类型添加其他属性
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatMessagePart[];
}

export const startChatAndSendMessageStream = async (history: ChatMessage[], newMessage: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-thinking-exp-01-21',systemInstruction: "你的名字叫做傻豆", }); // 使用官方 Gemini Pro 模型

  const chat = model.startChat({
    history: history.map(msg => ({
      role: msg.role,
      parts: msg.parts.map(part => part.text), // 直接使用 text 数组作为 parts
    })),
    generationConfig: {
      maxOutputTokens: 65535, // 保留 maxOutputTokens
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ],
  });

  // 使用 sendMessageStream for streaming responses
  const result = await chat.sendMessageStream(newMessage);

  const encodedStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of result.stream) {
        const text = chunk.text(); // chunk.text() 直接返回字符串
        const encoded = encoder.encode(text);
        controller.enqueue(encoded);
      }
      controller.close();
    },
  });

  return encodedStream;
};
