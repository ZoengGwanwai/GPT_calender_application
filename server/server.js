const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3800;
const EVENTS_FILE = path.join(__dirname, 'date_event.json');
const CONTENT_FILE = path.join(__dirname, 'content.json');

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 解析JSON请求体
app.use(express.json());

// 读取事件数据的通用函数
function readEvents(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error("Error reading events:", error);
    return []; // 如果文件不存在或读取失败，返回空数组
  }
}

// 写入事件数据的通用函数
function writeEvents(filePath, events) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
  } catch (error) {
    console.error("Error writing events:", error);
    throw error; // 如果写入失败，抛出错误
  }
}

// 获取日程数据
app.get('/events', (req, res) => {
  try {
    const events = readEvents(EVENTS_FILE);
    res.json(events);
  } catch (error) {
    console.error("Error reading events:", error);
    res.status(500).send("Error reading events");
  }
});

// 添加或修改日程
app.post('/events', (req, res) => {
  try {
    const { time, content } = req.body;
    let allEvents = readEvents(EVENTS_FILE);

    // 检查是否已存在相同时间和内容的事件
    const existingEvent = allEvents.find(event => event.content === `${time},${content}`);
    if (!existingEvent) {
      allEvents.push({
        role: "system",
        time: time,
        content: content
      });
    }

    writeEvents(EVENTS_FILE, allEvents);
    res.send('Events updated successfully');
  } catch (error) {
    console.error("Error updating events:", error);
    res.status(500).send("Error updating events");
  }
});

// 删除事件
app.post('/delete-event', (req, res) => {
  try {
    const { time, content } = req.body;
    let allEvents = readEvents(EVENTS_FILE);

    allEvents = allEvents.filter(event => event.content !== content || event.time !== time);

    writeEvents(EVENTS_FILE, allEvents);
    res.send('Event deleted successfully');
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).send("Error deleting event");
  }
});

// 清洗数据并生成AI建议
app.get('/cleanup-and-generate', async (req, res) => {
  try {
    let allEvents = readEvents(EVENTS_FILE);

    const currentDate = new Date();
    const sevenDaysLater = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 清洗数据
    const futureEvents = allEvents.filter(event => {
      const eventDate = new Date(event.time);
      return eventDate <= sevenDaysLater;
    }).map(event => ({
      role: "system",
      content: `${event.time},${event.content}` // 确保格式与 content.json 一致
    }));

    // 保存清洗后的数据到 content.json
    writeEvents(CONTENT_FILE, futureEvents);

    // 调用 OpenAI 生成建议
    const { generateAdvice } = require('./openai.js'); // 引入 generateAdvice 函数
    const advice = await generateAdvice(futureEvents);
    res.send(advice);
  } catch (error) {
    console.error("Error generating advice:", error);
    res.status(500).send("Error generating content");
  }
});

// 清理所有事件
app.post('/cleanup', (req, res) => {
  try {
    // 清空事件文件
    writeEvents(EVENTS_FILE, []);
    res.send('Events cleaned successfully');
  } catch (error) {
    console.error("Error cleaning events:", error);
    res.status(500).send("Error cleaning events");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});