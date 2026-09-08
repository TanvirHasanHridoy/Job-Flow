(function(){"use strict";function y(t){return t?t.replace(/\s+/g," ").replace(/\n\s*\n/g,`

`).trim():""}function q(t){if(!t)return"";const n=t.cloneNode(!0);return n.querySelectorAll("button, svg, script, style, .artdeco-button").forEach(e=>e.remove()),n.querySelectorAll("li").forEach(e=>{var r;e.textContent=`
• ${((r=e.textContent)==null?void 0:r.trim())||""}`}),n.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach(e=>{var r;e.textContent=`
${((r=e.textContent)==null?void 0:r.trim())||""}
`}),(n.innerText||n.textContent||"").split(`
`).map(e=>e.trim()).filter(e=>e.length>0).join(`
`)}const v={name:"LinkedIn Jobs",matches(t){return/linkedin\.com\/jobs\//i.test(t)},parse(){const t=document.querySelector(".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24, .top-card-layout__title, h1.job-details-jobs-unified-top-card__job-title"),n=y(t==null?void 0:t.textContent),o=document.querySelector(".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .topcard__flavor--black-link, a.topcard__org-name-link, .jobs-unified-top-card__subtitle-primary-grouping a"),e=y(o==null?void 0:o.textContent),r=document.querySelector(".job-details-jobs-unified-top-card__primary-description-container, .jobs-unified-top-card__bullet, .topcard__flavor--bullet, .job-details-jobs-unified-top-card__workplace-type");let c=y(r==null?void 0:r.textContent);c=c.replace(/^[·•\s]+/,"").trim();const i=document.querySelector("#job-details, .jobs-description__content, .jobs-description-content__text, .show-more-less-html__markup, .description__text"),a=q(i),s=document.querySelector(".job-details-jobs-unified-top-card__job-insight:has(svg), .compensation__salary"),p=s&&/[$€£]|\b(yr|hr|month|year|annum)\b/i.test(s.textContent||"")?y(s.textContent):void 0;return!n&&!a?null:{title:n||"Job Posting",company:e||"Company",location:c||"",description:a||"",salary:p,url:window.location.href,source:"linkedin",extractedAt:new Date().toISOString()}}};function b(t){return t?t.replace(/\s+/g," ").trim():""}function A(t){if(!t)return"";const n=t.cloneNode(!0);return n.querySelectorAll("button, svg, script, style, nav, aside").forEach(e=>e.remove()),n.querySelectorAll("li").forEach(e=>{var r;e.textContent=`
• ${((r=e.textContent)==null?void 0:r.trim())||""}`}),n.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach(e=>{var r;e.textContent=`
${((r=e.textContent)==null?void 0:r.trim())||""}
`}),(n.innerText||n.textContent||"").split(`
`).map(e=>e.trim()).filter(e=>e.length>0).join(`
`)}const E={name:"StepStone",matches(t){return/stepstone\.(de|at|com|be|nl|co\.uk|fr)/i.test(t)},parse(){const t=document.querySelector('h1[data-genesis-element="BASE"], [data-testid="job-title"], h1.reb-job-title, h1.listing-header-title, h1'),n=b(t==null?void 0:t.textContent),o=document.querySelector('[data-testid="company-name"], a[data-genesis-element="ANCHOR"][href*="/cmp/"], .listing-header-company, .at-listing-company-name'),e=b(o==null?void 0:o.textContent),r=document.querySelector('[data-testid="job-location"], .listing-header-location, span[data-genesis-element="TEXT"]'),c=b(r==null?void 0:r.textContent),i=document.querySelector('[data-testid="job-description"], article[data-genesis-element="CARD"], .js-app-ld-json, .listing-content, article'),a=A(i),s=document.querySelector('[data-testid="salary-estimate"], [data-testid="job-salary"]'),p=s?b(s.textContent):void 0;return!n&&!a?null:{title:n||"Job Posting",company:e||"Company",location:c||"",description:a||"",salary:p,url:window.location.href,source:"stepstone",extractedAt:new Date().toISOString()}}};function g(t){return t?t.replace(/\s+/g," ").trim():""}function k(t){if(!t)return"";const n=t.cloneNode(!0);return n.querySelectorAll("button, svg, script, style, nav").forEach(e=>e.remove()),n.querySelectorAll("li").forEach(e=>{var r;e.textContent=`
• ${((r=e.textContent)==null?void 0:r.trim())||""}`}),n.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach(e=>{var r;e.textContent=`
${((r=e.textContent)==null?void 0:r.trim())||""}
`}),(n.innerText||n.textContent||"").split(`
`).map(e=>e.trim()).filter(e=>e.length>0).join(`
`)}const T={name:"Indeed",matches(t){return/indeed\.(com|de|co\.uk|fr|ca|nl)/i.test(t)},parse(){const t=document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"], .jobsearch-JobInfoHeader-title, h1.jobsearch-JobInfoHeader-title'),n=g(t==null?void 0:t.textContent),o=document.querySelector('[data-testid="inlineHeader-companyName"], [data-company-name="true"], .jobsearch-InlineCompanyRating-companyHeader'),e=g(o==null?void 0:o.textContent),r=document.querySelector('[data-testid="inlineHeader-companyLocation"], [data-testid="job-location"], .jobsearch-JobInfoHeader-companyLocation'),c=g(r==null?void 0:r.textContent),i=document.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText"),a=k(i),s=document.querySelector("#salaryInfoAndJobType, .jobsearch-JobMetadataHeader-item:has(svg)"),p=s?g(s.textContent):void 0;return!n&&!a?null:{title:n||"Job Posting",company:e||"Company",location:c||"",description:a||"",salary:p,url:window.location.href,source:"indeed",extractedAt:new Date().toISOString()}}};function S(t){return t?t.replace(/\s+/g," ").trim():""}function J(t){if(!t)return"";const n=t.cloneNode(!0);return n.querySelectorAll("button, svg, script, style, nav").forEach(e=>e.remove()),n.querySelectorAll("li").forEach(e=>{var r;e.textContent=`
• ${((r=e.textContent)==null?void 0:r.trim())||""}`}),n.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach(e=>{var r;e.textContent=`
${((r=e.textContent)==null?void 0:r.trim())||""}
`}),(n.innerText||n.textContent||"").split(`
`).map(e=>e.trim()).filter(e=>e.length>0).join(`
`)}const $={name:"Xing",matches(t){return/xing\.com\/jobs\//i.test(t)},parse(){const t=document.querySelector('[data-testid="job-title"], h1[class*="job-title"], h1'),n=S(t==null?void 0:t.textContent),o=document.querySelector('[data-testid="company-name"], a[href*="/companies/"], div[class*="company-name"]'),e=S(o==null?void 0:o.textContent),r=document.querySelector('[data-testid="job-location"], [data-testid="workplace-type"], span[class*="location"]'),c=S(r==null?void 0:r.textContent),i=document.querySelector('[data-testid="job-description"], article[class*="job-description"], article, div[class*="job-description"]'),a=J(i);return!n&&!a?null:{title:n||"Job Posting",company:e||"Company",location:c||"",description:a||"",url:window.location.href,source:"xing",extractedAt:new Date().toISOString()}}};function x(t){return t?t.replace(/\s+/g," ").trim():""}function I(t){const n=document.createElement("div");return n.innerHTML=t,n.querySelectorAll("script, style, svg, button, nav").forEach(o=>o.remove()),n.querySelectorAll("li").forEach(o=>{var e;o.textContent=`
• ${((e=o.textContent)==null?void 0:e.trim())||""}`}),n.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach(o=>{var e;o.textContent=`
${((e=o.textContent)==null?void 0:e.trim())||""}
`}),(n.innerText||n.textContent||"").split(`
`).map(o=>o.trim()).filter(o=>o.length>0).join(`
`)}function P(){var t;try{const n=document.querySelectorAll('script[type="application/ld+json"]');for(let o=0;o<n.length;o++){const e=n[o].textContent;if(!e)continue;let r;try{r=JSON.parse(e)}catch{continue}const c=Array.isArray(r)?r:Array.isArray(r==null?void 0:r["@graph"])?r["@graph"]:[r];for(const i of c){const a=i==null?void 0:i["@type"];if(a==="JobPosting"||Array.isArray(a)&&a.includes("JobPosting")){const s=x(i.title),p=x(typeof i.hiringOrganization=="string"?i.hiringOrganization:((t=i.hiringOrganization)==null?void 0:t.name)||"");let h="";if(i.jobLocation){const d=i.jobLocation.address;typeof d=="string"?h=d:d&&typeof d=="object"&&(h=[d.addressLocality,d.addressRegion,d.addressCountry].filter(Boolean).join(", "))}let u="";if(typeof i.description=="string"&&(u=I(i.description)),s&&u)return{title:s,company:p||"Company",location:h,description:u,url:window.location.href,source:"schema",extractedAt:new Date().toISOString()}}}}}catch(n){console.warn("[JobFlow] Schema extraction error:",n)}return null}function L(){var p,h;const t=document.querySelector('main h1, article h1, [role="main"] h1, h1'),n=x(t==null?void 0:t.textContent),o=(p=document.querySelector('meta[property="og:site_name"]'))==null?void 0:p.getAttribute("content"),e=(h=document.querySelector('meta[name="author"], meta[property="business:contact_data:locality"]'))==null?void 0:h.getAttribute("content"),r=x(e||o||""),c=document.querySelectorAll('article, main, [role="main"], div[class*="job"], div[class*="description"]');let i=null,a=0;const s=["requirements","responsibilities","qualifications","experience","skills","about us","what you bring","aufgaben","profil"];if(c.forEach(u=>{const d=(u.textContent||"").toLowerCase();if(d.length<300)return;let l=d.length;s.forEach(f=>{d.includes(f)&&(l+=500)}),l>a&&(a=l,i=u)}),!i&&document.body&&(i=document.body),i){const u=i.cloneNode(!0);u.querySelectorAll("header, footer, nav, aside, button, script, style, svg").forEach(l=>l.remove()),u.querySelectorAll("li").forEach(l=>{var f;l.textContent=`
• ${((f=l.textContent)==null?void 0:f.trim())||""}`}),u.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach(l=>{var f;l.textContent=`
${((f=l.textContent)==null?void 0:f.trim())||""}
`});const d=(u.innerText||u.textContent||"").split(`
`).map(l=>l.trim()).filter(l=>l.length>0).join(`
`);if(d.length>150)return{title:n||"Job Posting",company:r||"Company",location:"",description:d,url:window.location.href,source:"universal",extractedAt:new Date().toISOString()}}return null}const O={name:"Universal Parser",matches(){return!0},parse(){const t=P();return t||L()}},H=[v,E,T,$];async function w(){const t=window.location.href;for(const n of H)if(n.matches(t))try{const o=await n.parse();if(o&&(o.description.length>80||o.title.length>3))return o}catch(o){console.warn(`[JobFlow] ${n.name} parser failed:`,o)}try{const n=await O.parse();if(n&&n.description.length>80)return n}catch(n){console.warn("[JobFlow] Universal parser failed:",n)}return null}const j="jobflow-ai-extension-badge-root";function N(t,n){if(document.getElementById(j))return;const o=document.createElement("div");o.id=j,o.style.position="fixed",o.style.bottom="24px",o.style.right="24px",o.style.zIndex="2147483647",o.style.fontFamily='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';const e=o.attachShadow({mode:"closed"}),r=document.createElement("style");r.textContent=`
    .jobflow-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      border-radius: 9999px;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      user-select: none;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .jobflow-pill:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 14px 28px -5px rgba(79, 70, 229, 0.5), 0 10px 10px -5px rgba(79, 70, 229, 0.3);
      filter: brightness(1.08);
    }
    .jobflow-pill:active {
      transform: translateY(0) scale(0.98);
    }
    .sparkle-icon {
      font-size: 14px;
      animation: pulse 2s infinite;
    }
    .dismiss-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      margin-left: 4px;
      font-size: 11px;
      line-height: 1;
      opacity: 0.7;
      transition: opacity 0.2s, background 0.2s;
    }
    .dismiss-btn:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.4);
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.85; }
    }
  `;const c=document.createElement("div");c.className="jobflow-pill",c.title="Click to open JobFlow AI and tailor your CV & Cover Letter for this role";const i=t!=null&&t.title?t.title.length>20?t.title.slice(0,18)+"...":t.title:"Job";c.innerHTML=`
    <span class="sparkle-icon">✨</span>
    <span>Tailor for ${i}</span>
    <span class="dismiss-btn" title="Dismiss">✕</span>
  `,c.addEventListener("click",a=>{if(a.target.classList.contains("dismiss-btn")){a.stopPropagation(),o.remove();return}n()}),e.appendChild(r),e.appendChild(c),document.body.appendChild(o)}let m=null,_=window.location.href;async function C(){var n;const t=await w();if(t&&(t.title!==(m==null?void 0:m.title)||t.company!==(m==null?void 0:m.company))){m=t;try{(n=chrome==null?void 0:chrome.storage)!=null&&n.local&&chrome.storage.local.set({currentJob:t})}catch(o){console.warn("[JobFlow] Storage error:",o)}N(t,()=>{try{chrome.runtime.sendMessage({type:"OPEN_SIDE_PANEL",job:t})}catch(o){console.warn("[JobFlow] Could not send message to background:",o)}})}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{setTimeout(C,1e3)}):setTimeout(C,1e3),setInterval(()=>{window.location.href!==_&&(_=window.location.href,setTimeout(C,1200))},1e3);try{chrome.runtime.onMessage.addListener((t,n,o)=>{if(t.type==="REQUEST_PARSE")return w().then(e=>{e&&(m=e),o({success:!0,data:e||m})}),!0})}catch(t){console.warn("[JobFlow] Runtime listener setup error:",t)}})();
