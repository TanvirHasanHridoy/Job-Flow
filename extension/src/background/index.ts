// Background Service Worker (Manifest V3)

// Configure side panel to open on action (extension icon) click
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('[JobFlow] setPanelBehavior error:', err);
    });
  }
});

// Handle incoming messages from content scripts or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    if (sender.tab?.id && chrome.sidePanel?.open) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {
        if (sender.tab?.windowId) {
          chrome.sidePanel.open({ windowId: sender.tab.windowId }).catch(console.error);
        }
      });
    }

    if (message.job) {
      chrome.storage.local.set({ currentJob: message.job });
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_ACTIVE_TAB_JOB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        sendResponse({ success: false, error: 'No active tab' });
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { type: 'REQUEST_PARSE' }, (res) => {
        if (chrome.runtime.lastError) {
          // Tab might not have content script injected yet or not a matching page
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse(res);
      });
    });
    return true; // Keep message channel open for async response
  }
});
