import { ParsedJobData } from './parsers/types';

const BADGE_HOST_ID = 'jobflow-ai-extension-badge-root';
let currentBadgePill: HTMLElement | null = null;
let currentRoleSpan: HTMLElement | null = null;
let currentOnOpen: (() => void) | null = null;

function formatRole(title?: string): string {
  if (!title || title === 'Target Role' || title === 'Job') return 'Job';
  return title.length > 22 ? title.slice(0, 20) + '...' : title;
}

export function injectQuickBadge(jobData: ParsedJobData | null, onOpenPanel: () => void) {
  currentOnOpen = onOpenPanel;

  const existingHost = document.getElementById(BADGE_HOST_ID);
  if (existingHost) {
    const roleSpan = (existingHost.shadowRoot?.querySelector('.role-text') as HTMLElement) || currentRoleSpan;
    if (roleSpan && jobData?.title) {
      roleSpan.textContent = `Tailor for ${formatRole(jobData.title)}`;
    }
    return;
  }

  // Create host element
  const host = document.createElement('div');
  host.id = BADGE_HOST_ID;
  host.style.position = 'fixed';
  host.style.bottom = '24px';
  host.style.right = '24px';
  host.style.zIndex = '2147483647';
  host.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
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
  `;

  const pill = document.createElement('div');
  pill.className = 'jobflow-pill';
  pill.title = 'Click to open JobFlow AI and tailor your CV & Cover Letter for this role';

  const roleText = document.createElement('span');
  roleText.className = 'role-text';
  roleText.textContent = `Tailor for ${formatRole(jobData?.title)}`;
  currentRoleSpan = roleText;

  pill.innerHTML = `<span class="sparkle-icon">✨</span>`;
  pill.appendChild(roleText);

  const dismiss = document.createElement('span');
  dismiss.className = 'dismiss-btn';
  dismiss.title = 'Dismiss';
  dismiss.textContent = '✕';
  pill.appendChild(dismiss);

  currentBadgePill = pill;

  pill.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('dismiss-btn')) {
      e.stopPropagation();
      host.remove();
      currentBadgePill = null;
      currentRoleSpan = null;
      return;
    }
    if (currentOnOpen) {
      currentOnOpen();
    }
  });

  shadow.appendChild(style);
  shadow.appendChild(pill);
  const mountTarget = document.body || document.documentElement;
  if (mountTarget) {
    mountTarget.appendChild(host);
  }
}
