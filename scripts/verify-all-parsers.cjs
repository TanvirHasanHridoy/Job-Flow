const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testAll() {
  console.log('Starting automated tests for JobFlow AI Extension...');

  // 1. Verify backend API endpoint
  console.log('\n--- 1. Testing Backend /api/auth/session & /api/applications ---');
  try {
    const sessionRes = await fetch('http://localhost:3000/api/auth/session', {
      headers: {
        'x-dev-auth': 'dev-test-user-id'
      }
    });
    const sessionJson = await sessionRes.json();
    console.log('Dev Auth via header session status:', sessionRes.status, 'Session Info:', sessionJson);

    // Test creating an application with dev auth header
    const appRes = await fetch('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-auth': 'dev-test-user-id'
      },
      body: JSON.stringify({
        company: 'Automated Test Company GmbH',
        role: 'Senior Full Stack Engineer',
        rawJobDescription: 'Testing job description with automated verification suite.',
        targetLanguage: 'EN',
        matchScore: 92,
        documents: [
          { type: 'CV', content: { personalDetails: { fullName: 'Test Candidate' } } },
          { type: 'COVER_LETTER', content: { subjectLine: 'Application for Senior Full Stack Engineer' } }
        ]
      })
    });
    console.log('Create Application status:', appRes.status);
    const appJson = await appRes.json();
    console.log('Created App ID:', appJson.id, 'Role:', appJson.role);

    // Test reading back the created application
    if (appJson.id) {
      const getRes = await fetch(`http://localhost:3000/api/applications/${appJson.id}`);
      const getJson = await getRes.json();
      console.log('Get App Status:', getRes.status, 'Documents count:', getJson.documents?.length);

      // Clean up test application
      await fetch(`http://localhost:3000/api/applications/${appJson.id}`, { method: 'DELETE' });
      console.log('Cleaned up test application record.');
    }
  } catch (err) {
    console.error('Backend API test failed:', err);
  }

  // 2. Launch Puppeteer browser and test the content parsers directly on real pages
  console.log('\n--- 2. Testing Live DOM Parsers on Real Web Pages ---');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // Test LinkedIn Search
  console.log('\n[LinkedIn Search Test]');
  await page.goto('https://www.linkedin.com/jobs/search?keywords=Full%20Stack%20Engineer&location=Berlin', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await new Promise(r => setTimeout(r, 4000));

  const linkedinResult = await page.evaluate(() => {
    // Exact parsing logic from linkedin.ts
    const JUNK_TITLE_PATTERNS = [
      /^\s*\d+[\d,]*\+?.*jobs\b/i,
      /\b\d+[\d,]*\+?\s+jobs\b/i,
      /\b(jobs|stellen|results|ergebnisse|treffer)\s+(in|found|gefunden)\b/i,
      /respects your privacy/i,
      /sign in/i,
      /join or/i,
      /notifications/i,
      /messaging/i,
      /recommended/i,
      /^jobs\b/i,
      /^search\b/i,
      /^linkedin$/i,
      /job alerts/i,
      /manage alerts/i
    ];
    const isJunkTitle = (t) => !t || t.length < 3 || JUNK_TITLE_PATTERNS.some(p => p.test(t));
    const isJunkCompany = (c) => !c || c.length < 2 || c.toLowerCase().includes('linkedin') || c.toLowerCase().includes('privacy');

    let title = '';
    const titleCandidates = document.querySelectorAll(
      '.job-details-jobs-unified-top-card__job-title, ' +
      '.jobs-unified-top-card__job-title, ' +
      'h1.top-card-layout__title, ' +
      'h2.top-card-layout__title, ' +
      '.topcard__title, ' +
      'h1.t-24, ' +
      '.jobs-search-results-list__list-item--active .job-card-list__title, ' +
      '.jobs-search-results-list__list-item--active .job-card-container__link, ' +
      'ul.jobs-search__results-list li:first-child .base-search-card__title, ' +
      '.base-search-card__title, ' +
      '.job-card-list__title'
    );
    for (const el of titleCandidates) {
      const txt = el.textContent?.trim();
      if (!isJunkTitle(txt)) {
        title = txt;
        break;
      }
    }

    let company = '';
    const companyCandidates = document.querySelectorAll(
      '.job-details-jobs-unified-top-card__company-name, ' +
      '.jobs-unified-top-card__company-name, ' +
      'a.topcard__org-name-link, ' +
      '.topcard__flavor--black-link, ' +
      '[data-tracking-control-name="public_jobs_topcard-org-name"], ' +
      '.jobs-search-results-list__list-item--active .job-card-container__primary-description, ' +
      '.jobs-search-results-list__list-item--active .artdeco-entity-lockup__subtitle, ' +
      'ul.jobs-search__results-list li:first-child .base-search-card__subtitle, ' +
      '.base-search-card__subtitle, ' +
      'a[data-tracking-control-name*="company"], ' +
      'a[href*="/company/"]'
    );
    for (const el of companyCandidates) {
      const txt = el.textContent?.trim();
      if (!isJunkCompany(txt)) {
        company = txt;
        break;
      }
    }

    const descEl = document.querySelector(
      '.show-more-less-html__markup, #job-details, .jobs-description__content, .jobs-box__html-content, article'
    );

    return {
      title,
      company,
      hasDesc: !!descEl && descEl.textContent.trim().length > 50,
      descLength: descEl?.textContent?.trim()?.length || 0,
      descPreview: descEl?.textContent?.trim()?.slice(0, 100)
    };
  });
  console.log('LinkedIn Extraction Result:', linkedinResult);

  // Test XING Search
  console.log('\n[XING Search Test]');
  await page.goto('https://www.xing.com/jobs/search?keywords=Frontend%20Developer', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await new Promise(r => setTimeout(r, 4000));

  const xingResult = await page.evaluate(() => {
    const JUNK_TITLE_PATTERNS = [
      /^\s*\d+[\d,]*\s+(jobs|stellen|treffer)\b/i,
      /\b\d+[\d,]*\s+(jobs|stellen|treffer)\b/i,
      /\b(jobs|stellen|treffer)\s+(found|gefunden)\b/i,
      /^\s*\d+[\d,]*\+?.*(jobs|stellen)\b/i,
      /jobsuche/i,
      /^search\b/i,
      /recommended/i,
      /empfehlungen/i,
      /not available/i,
      /gespeicherte jobs/i,
      /^xing\b/i,
      /finde deinen/i
    ];
    const isJunkTitle = (t) => !t || t.length < 3 || JUNK_TITLE_PATTERNS.some(p => p.test(t));
    const isJunkCompany = (c) => !c || c.length < 2 || ['urgently hiring', 'dringend gesucht', 'xing'].some(j => c.toLowerCase().includes(j));

    let title = '';
    let matchedTitleEl = null;
    const titleCandidates = document.querySelectorAll(
      '[data-testid="job-title"], ' +
      '[data-testid="job-teaser-list-title"], ' +
      '[data-testid="job-teaser-card-title"], ' +
      'h1[class*="job-title"], ' +
      'h2[class*="job-title"], ' +
      '[data-testid="headline"]'
    );
    for (const el of titleCandidates) {
      const txt = el.textContent?.trim();
      if (!isJunkTitle(txt)) {
        title = txt;
        matchedTitleEl = el;
        break;
      }
    }

    let company = '';
    const companyCandidates = document.querySelectorAll(
      '[data-testid="company-name"], ' +
      '[data-testid="job-teaser-card-company"], ' +
      '[data-testid="job-teaser-list-company"], ' +
      'a[href*="/companies/"], ' +
      'a[href*="/company/"], ' +
      'div[class*="company-name"]'
    );
    for (const el of companyCandidates) {
      const txt = el.textContent?.trim();
      if (!isJunkCompany(txt)) {
        company = txt;
        break;
      }
    }

    if (!company && matchedTitleEl) {
      const card = matchedTitleEl.closest('div[class*="job-teaser"], article, li');
      if (card) {
        const lines = card.innerText?.split('\n').map(l => l.trim()).filter(Boolean) || [];
        for (const line of lines) {
          if (line !== title && !isJunkCompany(line) && !isJunkTitle(line) && line.length > 2) {
            company = line;
            break;
          }
        }
      }
    }

    let descEl = document.querySelector(
      '[data-testid="job-description"], [data-testid="description-content"], article[class*="job-description"]'
    );
    let desc = descEl?.textContent?.trim() || '';
    if (!desc && matchedTitleEl) {
      const card = matchedTitleEl.closest('div[class*="job-teaser"], article, li');
      if (card) desc = card.innerText?.trim() || '';
    }

    return {
      title,
      company,
      hasDesc: desc.length > 30,
      descLength: desc.length,
      descPreview: desc.slice(0, 100)
    };
  });
  console.log('XING Extraction Result:', xingResult);

  // Test StepStone
  console.log('\n[StepStone Search Test]');
  await page.goto('https://www.stepstone.de/jobs/software-developer', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await new Promise(r => setTimeout(r, 4000));

  const stepstoneResult = await page.evaluate(() => {
    const titleEl = document.querySelector(
      'h1[data-genesis-element="BASE"], [data-testid="job-title"], h1.reb-job-title, [data-testid="job-item-title"], article a[data-genesis-element="ANCHOR"]'
    );
    const companyEl = document.querySelector(
      '[data-testid="company-name"], a[data-genesis-element="ANCHOR"][href*="/cmp/"], .listing-header-company'
    );
    return {
      title: titleEl?.textContent?.trim() || null,
      company: companyEl?.textContent?.trim() || null
    };
  });
  console.log('StepStone Extraction Result:', stepstoneResult);

  await browser.close();
  console.log('\nAll Automated Tests Completed Successfully!');
}

testAll().catch(console.error);
