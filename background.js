// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'crawlResult') {
    // Handle crawl results here
    console.log('Received crawl result:', message.data);
  }
}); 