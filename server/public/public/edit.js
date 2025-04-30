document.addEventListener('DOMContentLoaded', () => {
  const eventListDiv = document.getElementById('eventList');
  const cleanupBtn = document.getElementById('cleanupBtn');

  // 加载并显示日程
  async function loadEvents() {
    try {
      const response = await fetch('/events');
      if (!response.ok) {
        throw new Error('Failed to load events');
      }
      const events = await response.json();

      eventListDiv.innerHTML = '';
      events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.textContent = `${event.time}: ${event.content}`;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
          deleteEvent(event.time, event.content);
        });

        eventDiv.appendChild(deleteBtn);
        eventListDiv.appendChild(eventDiv);
      });
    } catch (error) {
      console.error('Error loading events:', error);
      alert('Failed to load events. Please try again later.');
    }
  }

  // 删除事件
  async function deleteEvent(time, content) {
    try {
      const response = await fetch('/delete-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ time, content })
      });
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      loadEvents(); // 重新加载事件列表
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again later.');
    }
  }

  // 清理事件
  cleanupBtn.addEventListener('click', () => {
    fetch('/cleanup', {
      method: 'POST'
    }).then(() => {
      loadEvents(); // 重新加载事件列表
    }).catch((error) => {
      console.error('Error cleaning up events:', error);
      alert('Failed to clean up events. Please try again later.');
    });
  });

  // 初始化
  loadEvents();
});