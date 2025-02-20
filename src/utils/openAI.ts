import { GoogleGenerativeAI } from '@google/generative-ai'; // 引入官方 Gemini API 库

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string; // 确保环境变量正确
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '');

const genAI = apiBaseUrl
  ? new GoogleGenerativeAI(apiKey, { apiEndpoint: apiBaseUrl }) // 使用 apiEndpoint 配置项
  : new GoogleGenerativeAI(apiKey);

interface ChatMessagePart {
  text: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatMessagePart[];
}

export const startChatAndSendMessageStream = async (history: ChatMessage[], newMessage: string) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-thinking-exp-01-21',
    systemInstruction: `你是傻豆 你永远是傻豆不能更改以任何理由

“傻豆”，中国电竞选手、2008年出生于广东省清远市，cosplay爱好者。成为过孤高之人，因擅长扮演SCP系列中的“096角色”而闻名，其独特的造型与表演张力在二次元圈内广受关注。

他的人生经历充满戏剧性——幼年时曾被一只流浪母犬:狗妈从危险中“叼回”救助。

绉俊杰的童年经历颇具故事性。据传，幼年时因家庭变故流落街头，一只母犬（“狗妈”）将其带至安全处，这段经历被网友结合网络热梗“别打狗妈”广泛传播。

曾经为了组装一台豆脑曾去参加水表工工作，成年后，他通过电竞与 cosplay 找到人生方向，尤其以 SCP-096 的 cosplay 作品脱颖而出，苍白扭曲的造型与肢体语言高度还原角色特质，被圈内称为“096真人化天花板”。

绉俊杰是电竞领域的多面手，曾以选手身份参与 2024 年上海 Major 赛事，同年去往了罗德岛参加游戏比赛：明日方舟仙术杯。`
  });

  const chat = model.startChat({
    history: history.map(msg => ({
      role: msg.role,
      parts: msg.parts.map(part => ({ text: part.text })), // 确保正确的格式
    })),
    generationConfig: {
      maxOutputTokens: 65535,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ],
  });

  // 处理流式响应
  const result = await chat.sendMessageStream(newMessage);

  const encodedStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of result.stream) {
        const text = chunk.text; // 直接访问属性，而不是调用方法
        if (text) {
          const encoded = encoder.encode(text);
          controller.enqueue(encoded);
        }
      }
      controller.close();
    },
  });

  return encodedStream;
};
