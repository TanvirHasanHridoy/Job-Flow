import { parseCurrentPage, ParsedJobData } from './parsers';
import { injectQuickBadge } from './badge';

let cachedJobData: ParsedJobData | null = null;
let lastUrl = window.location.href;

async function attemptParseAndDisplay() {
  const parsed = await parseCurrentPage();
  if (parsed && (parsed.title !== cachedJobData?.title || parsed.company !== cachedJobData?.company)) {
    cachedJobData = parsed;
    // Persist to storage for side panel
    try {
      if (chrome?.storage?.local) {
        chrome.storage.local.set({ currentJob: parsed });
      }
    } catch (e) {
      console.warn('[JobFlow] Storage error:', e);
    }

    // Inject badge if on a job site
    injectQuickBadge(parsed, () => {
      try {
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL', job: parsed });
      } catch (e) {
        console.warn('[JobFlow] Could not send message to background:', e);
      }
    });
  }
}

// Initial parse after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(attemptParseAndDisplay, 1000);
  });
} else {
  setTimeout(attemptParseAndDisplay, 1000);
}

// Observe URL changes in SPAs (LinkedIn, Indeed, Xing)
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    setTimeout(attemptParseAndDisplay, 1200);
  }
}, 1000);

// Listen for messages from Side Panel requesting immediate re-parse
try {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'REQUEST_PARSE') {
      parseCurrentPage().then((data) => {
        if (data) cachedJobData = data;
        sendResponse({ success: true, data: data || cachedJobData });
      });
      return true; // Keep channel open for async response
    }
  });
} catch (e) {
  console.warn('[JobFlow] Runtime listener setup error:', e);
}
