document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('startCrawl');
  const stopButton = document.getElementById('stopCrawl');
  const showResultsButton = document.getElementById('showResults');
  const resultDiv = document.getElementById('result');

  // Check if crawling is complete
  chrome.storage.local.get(['currentIndex', 'result'], function(result) {
    if (result.currentIndex >= 27) { // 1 + 26 letters
      showResultsButton.classList.remove('hidden');
      startButton.classList.add('hidden');
      stopButton.classList.add('hidden');
      resultDiv.textContent = 'Crawling completed! Click "Show Results" to view data.';
    }
  });

  startButton.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'startCrawl' });
      resultDiv.textContent = 'Crawling started...';
      showResultsButton.classList.add('hidden');
      startButton.classList.remove('hidden');
      stopButton.classList.remove('hidden');
    } catch (error) {
      resultDiv.textContent = 'Error: ' + error.message;
    }
  });

  stopButton.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'stopCrawl' });
      resultDiv.textContent = 'Crawling stopped.';
    } catch (error) {
      resultDiv.textContent = 'Error: ' + error.message;
    }
  });

  showResultsButton.addEventListener('click', async () => {
    try {
      const result = await chrome.storage.local.get(['result']);
      const arr = result.result || [];
      let arr2 = [];
      arr.forEach(function(item) {
        // 匹配 $153.52 ($279.77*) 这种格式
        if(/^\$\d{2,3}(\.\d{2})?\s*\(\$\d{2,3}(\.\d{2})?\*\)$/.test(item.bestRate.trim())) {
          // 提取括号中的金额（带星号的金额）
          const match = item.bestRate.match(/\(\$(\d+(\.\d{2})?)\*\)/);
          if (match) {
            item.bestRate = `$${match[1]}`;
            arr2.push(item);
          }
        }
        // 匹配简单的 $20 格式
        else if(/^\$\d{2,3}$/.test(item.bestRate.trim())) {
          item.bestRate = item.bestRate.trim().replace(/\s+/g, '');
          arr2.push(item);
        }
      });

      // 按照金额排序（从高到低）
      arr2.sort((a, b) => {
        const amountA = parseFloat(a.bestRate.replace('$', ''));
        const amountB = parseFloat(b.bestRate.replace('$', ''));
        return amountB - amountA;
      });

      // 使用xlsx.js 导出arr2为excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(arr2);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, 'cashback.xlsx');

    } catch (error) {
      resultDiv.textContent = 'Error: ' + error.message;
    }
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'crawlResult') {
      resultDiv.textContent = message.data;
    }
  });
}); 