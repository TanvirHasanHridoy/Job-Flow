import { parseCurrentPage, ParsedJobData } from './parsers';
import { injectQuickBadge } from './badge';

let cachedJobData: ParsedJobData | null = null;
let lastUrl = window.location.href;
let clickTimeout: any = null;

async function attemptParseAndDisplay() {
  const parsed = await parseCurrentPage();
  if (!parsed) return;

  const isDifferent =
    !cachedJobData ||
    parsed.title !== cachedJobData.title ||
    parsed.company !== cachedJobData.company ||
    parsed.description.slice(0, 100) !== cachedJobData.description.slice(0, 100);

  if (isDifferent) {
    cachedJobData = parsed;

    // Persist to local storage for Side Panel
    try {
      if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
        chrome.storage.local.set({ currentJob: parsed });
      }
    } catch (e) {
      console.warn('[JobFlow] Storage error:', e);
    }

    // Inject or update floating badge
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
    setTimeout(attemptParseAndDisplay, 1200);
  });
} else {
  setTimeout(attemptParseAndDisplay, 1200);
}

// Observe URL / History changes in SPAs (LinkedIn, Xing, Indeed, StepStone)
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    setTimeout(attemptParseAndDisplay, 1200);
  }
}, 1000);

// Listen to user clicks on job list cards to re-parse dynamic right-hand detail views
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const isJobCard = target.closest(
    '.jobs-search-results-list li, ' +
    '[data-occludable-job-id], ' +
    '.job-card-container, ' +
    '[data-testid*="job-card"], ' +
    'article[data-testid*="job"], ' +
    'a[href*="/jobs/view/"], ' +
    'a[href*="/jobs/search"]'
  );

  if (isJobCard) {
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
      attemptParseAndDisplay();
    }, 700); // 700ms debounce allows the async detail container to fetch & render
  }
}, true);

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
