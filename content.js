let isCrawling = false;
let currentIndex = 0;

// Create array with numbers 1-9 and letters a-z
const crawlItems = [
  1,
  ...Array.from({length: 26}, (_, i) => String.fromCharCode(97 + i))
];

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCrawl') {
    startCrawling();
  } else if (message.action === 'stopCrawl') {
    stopCrawling();
  }
});

async function startCrawling() {
  isCrawling = true;
  // Get currentIndex from storage or start from 0
  const result = await chrome.storage.local.get(['currentIndex']);
  currentIndex = result.currentIndex || 0;
  console.log('Crawling started from index:', currentIndex);
  crawlNextPage();
}

async function stopCrawling() {
  isCrawling = false;
  // Save current progress
  await chrome.storage.local.set({ currentIndex });
  console.log('Crawling stopped at index:', currentIndex);
}

async function crawlNextPage() {
  if (!isCrawling || currentIndex >= crawlItems.length) {
    stopCrawling();
    return;
  }

  const currentItem = crawlItems[currentIndex];
  const url = `https://www.cashbackmonitor.com/cashback-comparison/${currentItem}/`;

  // Send current page info to popup
  chrome.runtime.sendMessage({
    type: 'crawlResult',
    data: `Currently crawling: ${url} (Index: ${currentIndex + 1}/${crawlItems.length})`
  });

  // Save current progress before navigation
  await chrome.storage.local.set({ currentIndex: currentIndex + 1 });
  doHomeWork().then(() => {
    window.location.href = url;
  });
  // Navigate to the next page


}

// // Listen for page load completion




function doHomeWork() {
  console.log('Doing home work');


  return new Promise((resolve, reject) => {

    if (window.location.href.includes('cashback-comparison')) {
      // 获取并且打印缓存
      chrome.storage.local.get(['currentIndex', 'result'], function (result) {
        console.log('Current index:', result.currentIndex);
        let results = result.result || [];
        // 获取所有cbm下class不为 q 的tr
        document.querySelector('.cbm').querySelectorAll('tr').forEach(function (tr) {
          // console.log(tr);
          if (tr.classList.contains('s13') || tr.classList.contains('gg79')) {
            return;
          }
          const titleElement = tr.querySelector('.tl');
          if (!titleElement) {
            return;
          }
          const title = titleElement.textContent;
          // 查找class以b_rate_开头的元素
          let bestRateElement = tr.querySelector('[title="Best Rate"]');
          let platform = '';
          if (!bestRateElement) {
            bestRateElement = tr.querySelector('td:nth-child(2)');
          } else {
            platform = bestRateElement.querySelector('a').href;
          }
          if (!bestRateElement) {
            return;
          }
          const bestRate = bestRateElement.textContent;
          results.push({ title, bestRate, platform });
        });

        // 保存 result到storage
        chrome.storage.local.set({ result: results });


        resolve(results);

      });

    } else {
      resolve([]);
    }
  })
}


window.addEventListener('load', startCrawling);


