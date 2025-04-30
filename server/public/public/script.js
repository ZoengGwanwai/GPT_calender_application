document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('dateInput');
  const eventList = document.getElementById('eventList');
  const newEventInput = document.getElementById('newEvent');
  const addEventBtn = document.getElementById('addEventBtn');
  const generateAdviceBtn = document.getElementById('generateAdviceBtn');
  const openaiTextarea = document.getElementById('openai');

  // 获取并显示日程
  function fetchEvents() {
    fetch('/events')
      .then(response => response.json())
      .then(events => {
        const selectedDate = dateInput.value;
        const eventsForDate = events.filter(event => event.time === selectedDate);
        eventList.innerHTML = '';
        eventsForDate.forEach(event => {
          const li = document.createElement('li');
          li.textContent = event.content;
          eventList.appendChild(li);
        });
      });
  }

  // 添加事件
  addEventBtn.addEventListener('click', () => {
    const selectedDate = dateInput.value;
    const newEvent = newEventInput.value.trim();
    if (newEvent) {
      fetch('/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          time: selectedDate,
          content: newEvent
        })
      })
      .then(() => {
        newEventInput.value = '';
        fetchEvents();
      });
    }
  });

  // 生成AI建议
  generateAdviceBtn.addEventListener('click', () => {
    let countdown = 30; // 倒计时 30 秒
    const countdownInterval = setInterval(() => {
      // 更新倒计时显示
      openaiTextarea.value = `正在向 AI 祈禱中，殘餘時間：${countdown} 秒`;
      countdown--;

      // 如果倒计时结束
      if (countdown < 0) {
        clearInterval(countdownInterval);
        openaiTextarea.value = "正在獲取 AI 建議...";

        // 调用接口获取 AI 建议
        fetch('/cleanup-and-generate')
          .then(response => response.text())
          .then(advice => {
            // 更新为实际的建议内容
            openaiTextarea.value = advice;
          })
          .catch(error => {
            // 如果出错，显示错误信息
            openaiTextarea.value = "Error fetching advice";
            console.error("Error fetching advice:", error);
          });
      }
    }, 1000); // 每秒更新一次倒计时
  });


  // 监听日期选择
  dateInput.addEventListener('change', fetchEvents);

  // 初始化
  fetchEvents();
});
