const { OpenAI } = require('openai'); // 更新openapi
const client = new OpenAI({ apiKey: 'your_ai_api',
                            baseURL: "your_ai_url"});

async function generateAdvice(events) {
    try {
        const messages = [
            {
                role: "system",
                content: `你是行事曆程式amadius，你有責任爲用戶提供合適的日程安排，現在時間是${new Date().toISOString().split('T')[0]}。`
            }
        ];

        events.forEach(event => {
            const [time, content] = event.content.split(','); // 分割时间与事件内容
            messages.push({
                role: "system",
                content: `${time}時間，有一個${content}事件。`
            });
        });

        messages.push({
            role: "user",
            content: "請總結這些事件並用「人話」給用戶提供行程建議"
        });

        const response = await client.chat.completions.create({
            model: "qwen-plus",
            messages: messages,
            temperature: 0.3
        });
        // 获取 AI 的回复内容
        let advice = response.choices[0].message.content;

        // 去掉所有的 # 和 *
        advice = advice.replace(/[#*]/g, "");

        return advice;

    } catch (error) {
        console.error("Error calling Moonshot AI API:", error);
        throw error;
    }
}

module.exports = { generateAdvice };
