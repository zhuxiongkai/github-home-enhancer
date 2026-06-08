// ==UserScript==
// @name         GitHub 首页增强
// @name:en      GitHub Home Enhancer
// @namespace    https://github.com/zhuxiongkai/github-home-enhancer
// @version      1.0.0
// @description  将 GitHub 登录首页重排为工作台式三栏动态首页，聚合仓库、动态和推荐内容。
// @description:en Rebuilds the signed-in GitHub home page into a three-column workbench with repositories, activity, and recommendations.
// @author       zhuxiongkai
// @license      MIT
// @homepageURL  https://github.com/zhuxiongkai/github-home-enhancer
// @supportURL   https://github.com/zhuxiongkai/github-home-enhancer/issues
// @contributionURL https://ifdian.net/a/zhuxk2005
// @updateURL    https://github.com/zhuxiongkai/github-home-enhancer/raw/main/github-home-enhancer.user.js
// @downloadURL  https://github.com/zhuxiongkai/github-home-enhancer/raw/main/github-home-enhancer.user.js
// @match        https://github.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const ROOT_ID = 'gh-home-enhancer-workbench';
  const ACTIVE_CLASS = 'gh-home-enhancer-active';
  const HOME_PATHS = new Set(['/', '', '/dashboard']);
  const LOG_PREFIX = '[GitHub Home Enhancer]';
  let currentFeedMode = 'all';
  let lastData = null;
  let lastDataKey = '';
  let activityLoadKey = '';
  let activityRequestId = 0;

  const LABELS = {
    en: {
      myWorkspace: 'My workspace',
      repositories: 'Repositories',
      viewAll: 'View all',
      pullRequests: 'Pull Requests',
      issues: 'Issues',
      gists: 'Gists',
      stars: 'Stars',
      activity: 'Activity',
      allActivity: 'All activity',
      myActivity: 'My activity',
      recommendations: 'Recommendations',
      relatedUsers: 'Related users',
      exploreMore: 'Explore more',
      relatedRepositories: 'Related repositories',
      exploreRepositories: 'Explore repositories',
      viewRepository: 'View repository',
      from: 'From',
      basedOnRepoActivity: 'Based on GitHub repository activity',
      gitCommandGuide: 'Git command guide',
      githubTrending: 'GitHub Trending',
      aiCodingAssistant: 'AI coding assistant',
      mobileApps: 'Mobile apps',
      docs: 'Docs',
      support: 'Support',
      changelog: 'Changelog',
      noPersonalActivity: 'No personal activity to show.',
      pushedBranch: 'pushed to a branch',
      contributedRepo: 'contributed to a repository',
      updatedActivity: 'updated activity',
      createdRef: 'created a ref',
      deletedRef: 'deleted a ref',
      pullRequestEvent: 'updated a pull request',
      issueEvent: 'updated an issue',
      commentEvent: 'commented',
      releaseEvent: 'published a release',
      forkEvent: 'forked a repository',
      starEvent: 'starred a repository',
      justNow: 'just now',
      minutesAgo: 'minutes ago',
      hoursAgo: 'hours ago',
      daysAgo: 'days ago',
      monthsAgo: 'months ago',
      masterBranch: 'master branch',
      noActivity: 'No activity to show.',
      realEventFallback: 'Real GitHub event',
    },
    zh: {
      myWorkspace: '我的工作台',
      repositories: '仓库',
      viewAll: '查看全部',
      pullRequests: 'Pull Requests',
      issues: 'Issues',
      gists: '代码片段',
      stars: '我的 Stars',
      activity: '动态',
      allActivity: '所有动态',
      myActivity: '我的动态',
      recommendations: '推荐',
      relatedUsers: '相关用户',
      exploreMore: '探索更多',
      relatedRepositories: '相关仓库',
      exploreRepositories: '探索仓库',
      viewRepository: '查看仓库',
      from: '来自',
      basedOnRepoActivity: '基于 GitHub 仓库活动推荐',
      gitCommandGuide: 'Git 命令学习',
      githubTrending: 'GitHub Trending',
      aiCodingAssistant: 'AI 编程助手',
      mobileApps: 'App 与插件下载',
      docs: '帮助文档',
      support: '在线自助服务',
      changelog: '更新日志',
      noPersonalActivity: '暂无我的动态。',
      pushedBranch: '推送到了分支',
      contributedRepo: '参与了仓库',
      updatedActivity: '更新了动态',
      createdRef: '创建了引用',
      deletedRef: '删除了引用',
      pullRequestEvent: '更新了 Pull Request',
      issueEvent: '更新了 Issue',
      commentEvent: '发表了评论',
      releaseEvent: '发布了 Release',
      forkEvent: 'Fork 了仓库',
      starEvent: 'Star 了仓库',
      justNow: '刚刚',
      minutesAgo: '分钟前',
      hoursAgo: '小时前',
      daysAgo: '天前',
      monthsAgo: '个月前',
      masterBranch: 'master 分支',
      noActivity: '暂无动态。',
      realEventFallback: '真实 GitHub 事件',
    },
  };

  function isChineseLocale() {
    return /^zh(?:-|$)/i.test(document.documentElement.lang || '');
  }

  function t(key) {
    const locale = isChineseLocale() ? 'zh' : 'en';
    return LABELS[locale][key] || LABELS.en[key] || key;
  }

  function iconPullRequest() {
    return '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="M5 3.25a1.75 1.75 0 1 0-2.5 1.58v6.34a1.75 1.75 0 1 0 1.5 0V4.83c.61-.21 1-.78 1-1.58ZM3.25 2.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm0 9.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5ZM11 3.25a1.75 1.75 0 1 1 2.5 1.58v1.42A2.75 2.75 0 0 1 10.75 9H8.5v2.17a1.75 1.75 0 1 1-1.5 0V8.25c0-.41.34-.75.75-.75h3A1.25 1.25 0 0 0 12 6.25V4.83a1.75 1.75 0 0 1-1-1.58Zm1.75-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM7.75 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path></svg>';
  }

  function iconLock() {
    return '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="M4.5 7V5a3.5 3.5 0 1 1 7 0v2h.25c.69 0 1.25.56 1.25 1.25v5.5c0 .69-.56 1.25-1.25 1.25h-7.5C3.56 15 3 14.44 3 13.75v-5.5C3 7.56 3.56 7 4.25 7h.25Zm1.5 0h4V5a2 2 0 1 0-4 0v2Zm-1.5 1.5v5h7v-5h-7Z"></path></svg>';
  }

  function iconCode() {
    return '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="m6.22 3.22 1.06 1.06L3.56 8l3.72 3.72-1.06 1.06-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25Zm3.56 0 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25-1.06-1.06L12.44 8 8.72 4.28l1.06-1.06Z"></path></svg>';
  }

  function iconStar() {
    return '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="M8 .25a.75.75 0 0 1 .67.42l1.88 3.82 4.21.61a.75.75 0 0 1 .42 1.28l-3.05 2.97.72 4.2a.75.75 0 0 1-1.09.79L8 12.36l-3.76 1.98a.75.75 0 0 1-1.09-.79l.72-4.2L.82 6.38a.75.75 0 0 1 .42-1.28l4.21-.61L7.33.67A.75.75 0 0 1 8 .25Z"></path></svg>';
  }

  const fallbackRepos = [
    { name: 'github/docs', href: 'https://github.com/github/docs' },
    { name: 'microsoft/vscode', href: 'https://github.com/microsoft/vscode' },
    { name: 'vercel/next.js', href: 'https://github.com/vercel/next.js' },
  ];

  function isGithubHome() {
    return location.hostname === 'github.com' && HOME_PATHS.has(location.pathname);
  }

  function isLoggedInHome() {
    return Boolean(
      document.querySelector('meta[name="user-login"]')
      || document.body?.classList.contains('logged-in')
      || document.querySelector('.feed-background')
      || document.querySelector('.js-dashboard-repos-list')
    );
  }

  function compact(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeGithubUrl(value, fallback = 'https://github.com/') {
    try {
      const url = new URL(value, location.origin);
      if (url.protocol === 'https:' && url.hostname === 'github.com') return url.href;
    } catch (error) {
      return fallback;
    }
    return fallback;
  }

  function githubAvatarUrl(name) {
    return `https://github.com/${encodeURIComponent(name)}.png?size=80`;
  }

  function uniqueBy(items, keyFn) {
    const seen = new Set();
    return items.filter((item) => {
      const key = keyFn(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function repoFromLink(link, fallbackOwner = '') {
    const textName = compact(link.textContent).replace(/\s*Public\s*$/, '');
    const href = safeGithubUrl(link.href || link.getAttribute('href'));
    let owner = '';
    let repo = '';
    try {
      const url = new URL(href);
      const parts = url.pathname.split('/').filter(Boolean);
      [owner, repo] = parts;
    } catch (error) {
      return null;
    }

    const textParts = textName.includes('/') ? textName.split('/') : [];
    if (textParts.length >= 2) {
      owner = textParts[0];
      repo = textParts.slice(1).join('/');
    } else if (fallbackOwner && textName) {
      owner = fallbackOwner;
      repo = textName;
    }

    if (!owner || !repo || !/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null;
    const name = `${owner}/${repo}`;
    const container = link.closest('li') || link.parentElement;
    const isPrivate = Boolean(
      container?.querySelector('svg.octicon-lock, [aria-label*="Private"], [aria-label*="private"]')
    ) || /\bPrivate\b/i.test(compact(container?.textContent || ''));
    return {
      name,
      href,
      owner,
      repo,
      avatar: link.querySelector('img')?.src || '',
      private: isPrivate,
    };
  }

  function collectRepos() {
    const selectors = [
      '.js-dashboard-repos-list a[href]',
      '.feed-left-sidebar a[href*="/"]',
      'aside a[href^="/"][data-hovercard-type="repository"]',
    ];

    const links = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    const repos = uniqueBy(links.map(repoFromLink).filter(Boolean), (repo) => repo.name).slice(0, 12);
    return repos.length ? repos : fallbackRepos;
  }

  async function fetchRecentUserRepos(userName) {
    if (!userName || userName === 'GitHub') return [];
    const response = await fetch(safeGithubUrl(`/${userName}?tab=repositories&sort=updated`), { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`GitHub repositories page request failed for ${userName}: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const links = Array.from(doc.querySelectorAll([
      'a[itemprop="name codeRepository"]',
      'a[data-hovercard-type="repository"]',
      'h3 a[href^="/"]',
    ].join(',')));

    return uniqueBy(links.map((link) => repoFromLink(link, userName)).filter(Boolean), (repo) => repo.name).slice(0, 10);
  }

  function mergeRepos(primary, secondary) {
    const merged = uniqueBy([...(primary || []), ...(secondary || [])], (repo) => repo.name);
    return merged.length ? merged.slice(0, 12) : fallbackRepos;
  }

  function usersFromRepos(repos, userName, avatar) {
    return uniqueBy(repos.map((repo) => ({
      name: repo.owner,
      href: safeGithubUrl(`/${repo.owner}`),
      source: repo.name,
      avatar: repo.owner === userName
        ? (avatar || repo.avatar || githubAvatarUrl(repo.owner))
        : (repo.avatar || githubAvatarUrl(repo.owner)),
    })), (user) => user.name).slice(0, 5);
  }

  function dashboardVerbKey(text) {
    const value = compact(text).toLowerCase();
    if (/pushed|push/.test(value)) return 'pushedBranch';
    if (/pull request|merged|opened a pull|closed a pull/.test(value)) return 'pullRequestEvent';
    if (/issue/.test(value)) return 'issueEvent';
    if (/fork/.test(value)) return 'forkEvent';
    if (/starred|star/.test(value)) return 'starEvent';
    if (/release/.test(value)) return 'releaseEvent';
    if (/comment/.test(value)) return 'commentEvent';
    if (/created/.test(value)) return 'createdRef';
    if (/deleted/.test(value)) return 'deletedRef';
    return 'updatedActivity';
  }

  function parseDashboardFeedItems(userName) {
    const feedNodes = Array.from(document.querySelectorAll([
      '#dashboard .TimelineItem',
      '.feed-background .TimelineItem',
      '.js-feed-item-group .TimelineItem',
    ].join(',')));

    return feedNodes
      .map((node, index) => {
        const text = compact(node.innerText || node.textContent);
        if (!text || /That'?s all for now|feed filter|Footer navigation|Show more activity/i.test(text)) return null;

        const actorLink = node.querySelector([
          'a[data-hovercard-type="user"]',
          '.author',
          '.TimelineItem-badge a[href^="/"]',
        ].join(','));
        const actor = compact(actorLink?.textContent).replace(/^@/, '')
          || actorLink?.pathname?.replace(/^\//, '').split('/')[0]
          || userName;

        const avatarImg = node.querySelector('.TimelineItem-badge img, img.avatar');
        const timeEl = node.querySelector('relative-time, time[datetime]');
        const createdAt = timeEl?.getAttribute('datetime') || timeEl?.dateTime || '';

        const repoLink = node.querySelector('a[data-hovercard-type="repository"], a[href*="/"][href*="/commit/"]');
        let repoName = '';
        if (repoLink) {
          try {
            const parts = new URL(repoLink.href, location.origin).pathname.split('/').filter(Boolean);
            if (parts.length >= 2) repoName = `${parts[0]}/${parts[1]}`;
          } catch (error) {
            repoName = '';
          }
        }

        const commitLink = node.querySelector('a[href*="/commit/"]');
        const sha = commitLink ? compact(commitLink.textContent).slice(0, 7) : '';
        const commitMessage = node.querySelector('.markdown-title, .commit-desc, .wb-break-all')?.textContent
          || node.querySelector('p, .color-fg-muted + div')?.textContent
          || '';

        const summaryEl = node.querySelector('.TimelineItem-body > div, .color-fg-muted');
        const summaryText = compact(summaryEl?.textContent || text);
        const verbKey = dashboardVerbKey(summaryText);

        let refTitle = '';
        const refMatch = summaryText.match(/(?:to|in|on)\s+([\w./-]+)/i);
        if (refMatch) refTitle = refMatch[1];

        const detail = compact(commitMessage)
          || compact(node.querySelector('.f6, .text-small')?.textContent)
          || summaryText.replace(actor, '').slice(0, 120)
          || t('realEventFallback');

        return {
          id: `dashboard-${createdAt || index}-${actor}-${repoName || sha || text.slice(0, 40)}`,
          actor,
          actorAvatar: avatarImg?.src || githubAvatarUrl(actor),
          createdAt: createdAt || new Date(Date.now() - index * 3_600_000).toISOString(),
          dateLabel: eventDateLabel(createdAt),
          href: commitLink?.href || repoLink?.href || actorLink?.href || 'https://github.com/',
          kind: sha ? 'push' : 'event',
          sha,
          title: repoName ? (refTitle ? `${repoName} / ${refTitle}` : repoName) : summaryText.slice(0, 80),
          detail,
          verbKey,
          source: 'dashboard',
        };
      })
      .filter((item) => item && item.actor)
      .slice(0, 30);
  }

  function mergeFeedItems(...groups) {
    return uniqueBy(
      groups.flat().filter((item) => item && item.actor),
      (item) => item.id || `${item.actor}|${item.createdAt}|${item.title}|${item.detail}`,
    )
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 40);
  }

  function apiRepoEventsUrl(repo) {
    return `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/events?per_page=20`;
  }

  async function fetchRepoEvents(repo) {
    if (!repo.owner || !repo.repo) return [];
    const response = await fetch(apiRepoEventsUrl(repo), {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub events request failed for ${repo.name}: ${response.status}`);
    }
    const events = await response.json();
    return Array.isArray(events) ? events : [];
  }

  function parseJsonArrayAfter(source, marker) {
    const markerIndex = source.indexOf(marker);
    if (markerIndex < 0) return [];
    const start = source.indexOf('[', markerIndex);
    if (start < 0) return [];

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < source.length; index += 1) {
      const char = source[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }
      if (char === '"') {
        inString = true;
      } else if (char === '[') {
        depth += 1;
      } else if (char === ']') {
        depth -= 1;
        if (depth === 0) {
          return JSON.parse(source.slice(start, index + 1));
        }
      }
    }
    return [];
  }

  function stripHtml(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value || '');
    return compact(template.content.textContent || value);
  }

  function activityPageItemToFeedItem(item, repo) {
    const actor = item.pusher?.login || repo.owner;
    const sha = String(item.after || '').slice(0, 7);
    return {
      id: `${repo.name}-${item.after || item.pushedAt || item.ref}`,
      actor,
      actorAvatar: item.pusher?.primaryAvatarUrl || githubAvatarUrl(actor),
      createdAt: item.pushedAt,
      dateLabel: eventDateLabel(item.pushedAt),
      href: item.after ? `https://github.com/${repo.name}/commit/${item.after}` : repo.href,
      kind: 'push',
      sha,
      title: `${repo.name} / ${refName(item.ref)}`,
      detail: stripHtml(item.commit?.shortMessageHtmlLink || item.commit?.message || `${item.commitsCount || 0} commits`),
      verbKey: item.pushType === 'pr_merge' ? 'pullRequestEvent' : 'pushedBranch',
    };
  }

  async function fetchRepoActivityItems(repo) {
    if (!repo.owner || !repo.repo) return [];
    const response = await fetch(safeGithubUrl(`/${repo.name}/activity`), { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`GitHub activity page request failed for ${repo.name}: ${response.status}`);
    }
    const html = await response.text();
    return parseJsonArrayAfter(html, '"activityList":{"items":')
      .map((item) => activityPageItemToFeedItem(item, repo))
      .filter((item) => item.actor && item.createdAt);
  }

  function eventDateLabel(value) {
    if (!value) return dateDaysAgo(0);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return dateDaysAgo(0);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-');
  }

  function relativeTime(value) {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    if (!value || Number.isNaN(diffMs) || diffMs < 60_000) return t('justNow');
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) return `${minutes} ${t('minutesAgo')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${t('hoursAgo')}`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ${t('daysAgo')}`;
    return `${Math.floor(days / 30)} ${t('monthsAgo')}`;
  }

  function refName(ref) {
    return compact(ref).replace(/^refs\/heads\//, '').replace(/^refs\/tags\//, '') || 'default';
  }

  function eventToFeedItem(event) {
    const repoName = event.repo?.name || '';
    const actor = event.actor?.login || '';
    const payload = event.payload || {};
    const commits = Array.isArray(payload.commits) ? payload.commits : [];
    const firstCommit = commits[0] || {};
    const action = payload.action ? `${payload.action}: ` : '';
    const base = {
      id: event.id || `${repoName}-${event.type}-${event.created_at}`,
      actor,
      actorAvatar: event.actor?.avatar_url || githubAvatarUrl(actor),
      createdAt: event.created_at,
      dateLabel: eventDateLabel(event.created_at),
      href: repoName ? `https://github.com/${repoName}` : 'https://github.com/',
      kind: 'event',
      sha: String(payload.head || firstCommit.sha || event.id || '').slice(0, 7),
      title: repoName || 'GitHub',
      detail: t('realEventFallback'),
      verbKey: 'updatedActivity',
    };

    switch (event.type) {
      case 'PushEvent':
        return {
          ...base,
          kind: 'push',
          verbKey: 'pushedBranch',
          title: `${repoName} / ${refName(payload.ref)}`,
          detail: firstCommit.message || `${commits.length || payload.size || 0} commits`,
          href: payload.head && repoName ? `https://github.com/${repoName}/commit/${payload.head}` : base.href,
        };
      case 'CreateEvent':
        return {
          ...base,
          verbKey: 'createdRef',
          title: `${repoName} / ${refName(payload.ref || payload.ref_type)}`,
          detail: payload.ref_type || t('realEventFallback'),
        };
      case 'DeleteEvent':
        return {
          ...base,
          verbKey: 'deletedRef',
          title: `${repoName} / ${refName(payload.ref || payload.ref_type)}`,
          detail: payload.ref_type || t('realEventFallback'),
        };
      case 'PullRequestEvent':
        return {
          ...base,
          verbKey: 'pullRequestEvent',
          title: `${repoName} #${payload.number || payload.pull_request?.number || ''}`.trim(),
          detail: `${action}${payload.pull_request?.title || t('realEventFallback')}`,
          href: payload.pull_request?.html_url || base.href,
        };
      case 'IssuesEvent':
        return {
          ...base,
          verbKey: 'issueEvent',
          title: `${repoName} #${payload.issue?.number || ''}`.trim(),
          detail: `${action}${payload.issue?.title || t('realEventFallback')}`,
          href: payload.issue?.html_url || base.href,
        };
      case 'IssueCommentEvent':
      case 'CommitCommentEvent':
      case 'PullRequestReviewCommentEvent':
        return {
          ...base,
          verbKey: 'commentEvent',
          detail: payload.comment?.body ? compact(payload.comment.body).slice(0, 120) : t('realEventFallback'),
          href: payload.comment?.html_url || base.href,
        };
      case 'ReleaseEvent':
        return {
          ...base,
          verbKey: 'releaseEvent',
          detail: `${action}${payload.release?.name || payload.release?.tag_name || t('realEventFallback')}`,
          href: payload.release?.html_url || base.href,
        };
      case 'ForkEvent':
        return {
          ...base,
          verbKey: 'forkEvent',
          detail: payload.forkee?.full_name || t('realEventFallback'),
          href: payload.forkee?.html_url || base.href,
        };
      case 'WatchEvent':
        return {
          ...base,
          verbKey: 'starEvent',
          detail: repoName || t('realEventFallback'),
        };
      default:
        return base;
    }
  }

  async function loadRealActivity(data) {
    const dashboardItems = parseDashboardFeedItems(data.userName);
    data.dashboardFeedItems = dashboardItems;
    const recentRepos = await fetchRecentUserRepos(data.userName).catch((error) => {
      console.debug(`${LOG_PREFIX} failed to load recent repositories`, error);
      return [];
    });
    const repos = mergeRepos(recentRepos, data.repos);
    const activityRepos = repos.slice(0, 12);

    const activityPages = await Promise.allSettled(activityRepos.map(fetchRepoActivityItems));
    const pageItems = activityPages
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => result.value)
      .filter((item) => item.actor && item.createdAt);

    const repoEvents = await Promise.allSettled(activityRepos.map(fetchRepoEvents));
    const apiItems = repoEvents
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => result.value)
      .map(eventToFeedItem)
      .filter((item) => item.actor && item.createdAt);

    const items = mergeFeedItems(dashboardItems, pageItems, apiItems).slice(0, 40);
    if (items.length) {
      return { status: 'ready', items, repos };
    }

    const hadErrors = activityPages.some((result) => result.status === 'rejected')
      || repoEvents.some((result) => result.status === 'rejected');
    return { status: hadErrors ? 'error' : 'empty', items: [], repos };
  }

  function dateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-');
  }

  function collectGithubData() {
    document.body.classList.remove(ACTIVE_CLASS);

    const repos = collectRepos();
    const avatar = document.querySelector('img.avatar, img[src*="avatars.githubusercontent.com"]');
    const loginMeta = document.querySelector('meta[name="user-login"]')?.content;
    const userName = loginMeta || compact(avatar?.alt).replace(/^@/, '') || repos[0]?.owner || 'GitHub';
    const dashboardFeedItems = parseDashboardFeedItems(userName);

    return {
      userName,
      avatar: avatar?.src || '',
      repos,
      users: usersFromRepos(repos, userName, avatar?.src || ''),
      feedItems: dashboardFeedItems,
      dashboardFeedItems,
      activityStatus: dashboardFeedItems.length ? 'ready' : 'loading',
      repoCount: repos.length,
      today: dateDaysAgo(0),
    };
  }

  function dataKey(data) {
    return `${data.userName}|${data.repos.map((repo) => repo.name).join(',')}`;
  }

  function loadActivityFor(data, key) {
    if (activityLoadKey === key) return;
    activityLoadKey = key;
    const requestId = ++activityRequestId;

    loadRealActivity(data)
      .then((result) => {
        if (requestId !== activityRequestId || key !== lastDataKey || !lastData) return;
        if (result.repos?.length) {
          lastData.repos = result.repos;
          lastData.repoCount = result.repos.length;
          lastData.users = usersFromRepos(result.repos, lastData.userName, lastData.avatar);
        }
        lastData.feedItems = result.items;
        lastData.activityStatus = result.status;
        activityLoadKey = '';
        renderWorkbench(lastData);
      })
      .catch((error) => {
        console.warn(`${LOG_PREFIX} failed to load real activity`, error);
        if (requestId !== activityRequestId || key !== lastDataKey || !lastData) return;
        lastData.feedItems = [];
        lastData.activityStatus = 'error';
        activityLoadKey = '';
        renderWorkbench(lastData);
      });
  }

  function repoListTemplate(repos) {
    return repos.slice(0, 5).map((repo) => `
      <a class="ghg-repo" href="${escapeHtml(repo.href)}">
        <span class="ghg-line-icon">${repo.private ? iconLock() : iconCode()}</span>
        <span>${escapeHtml(repo.name)}</span>
      </a>
    `).join('');
  }

  function eventAvatarTemplate(item, data) {
    const avatar = item.actorAvatar || (item.actor === data.userName ? data.avatar : '') || githubAvatarUrl(item.actor || data.userName);
    return `<img src="${escapeHtml(avatar)}" alt="">`;
  }

  function repoHref(repoTitle) {
    const parts = String(repoTitle || '').split('/').filter(Boolean);
    if (parts.length >= 2) {
      return safeGithubUrl(`/${parts[0]}/${parts[1]}`);
    }
    if (parts.length === 1) {
      return safeGithubUrl(`/${parts[0]}`);
    }
    return 'https://github.com/';
  }

  function repoRefHtml(repoTitle, refTitle) {
    const branch = refTitle || 'master';
    const repoLink = `<a class="ghg-event-repo" href="${escapeHtml(repoHref(repoTitle))}">${escapeHtml(repoTitle)}</a>`;
    return isChineseLocale()
      ? `${repoLink} 的 ${escapeHtml(branch)} 分支`
      : `${repoLink} / ${escapeHtml(branch)}`;
  }

  function eventCardTemplate(item, href) {
    const titleParts = String(item.title || '').split(' / ');
    const repoTitle = titleParts[0] || item.title || 'GitHub';
    const refTitle = titleParts.slice(1).join(' / ');
    const detail = item.detail || t('realEventFallback');
    const repoUrl = repoHref(repoTitle);

    if (item.kind === 'push' || item.sha) {
      return `
        <div class="ghg-event-card">
          <div class="ghg-event-ref">${repoRefHtml(repoTitle, refTitle)}</div>
          <a class="ghg-event-commit" href="${escapeHtml(href)}">
            <span class="ghg-commit-icon">${iconCode()}</span>
            ${item.sha ? `<code>${escapeHtml(item.sha)}</code>` : ''}
            <span>${escapeHtml(detail)}</span>
          </a>
        </div>
      `;
    }

    return `
      <div class="ghg-event-card ghg-event-card-link">
        <span class="ghg-event-repo-icon">${iconCode()}</span>
        <span class="ghg-event-card-text">
          <a class="ghg-event-repo" href="${escapeHtml(repoUrl)}">${escapeHtml(repoTitle)}</a>
          <a class="ghg-event-detail" href="${escapeHtml(href)}">${escapeHtml(detail)}</a>
        </span>
      </div>
    `;
  }

  function timelineTemplate(data, mode = 'all') {
    let lastDate = '';
    const items = mode === 'mine'
      ? data.feedItems.filter((item) => item.actor === data.userName)
      : data.feedItems;

    if (data.activityStatus === 'loading' && !items.length) {
      return `
        ${Array.from({ length: 3 }, () => `
          <li class="ghg-timeline-item ghg-skeleton-item" aria-hidden="true">
            <div class="ghg-event-head ghg-skeleton-meta">
              <span class="ghg-skeleton-avatar"></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="ghg-event-card ghg-skeleton-card">
              <span class="ghg-skeleton-line ghg-skeleton-line-lg"></span>
              <span class="ghg-skeleton-line ghg-skeleton-line-sm"></span>
            </div>
          </li>
        `).join('')}
      `;
    }

    if (!items.length) {
      const message = mode === 'mine' ? t('noPersonalActivity') : t('noActivity');
      return `<li class="ghg-empty">${escapeHtml(message)}</li>`;
    }

    return items.map((item) => {
      const verb = item.verbKey ? t(item.verbKey) : item.kind === 'push' ? t('pushedBranch') : item.kind === 'repo' ? t('contributedRepo') : t('updatedActivity');
      const href = item.href ? safeGithubUrl(item.href) : 'https://github.com/';
      const actor = item.actor || data.userName;
      const dateBlock = item.dateLabel !== lastDate
        ? `<li class="ghg-date-node"><span class="ghg-date-dot" aria-hidden="true"></span><time>${escapeHtml(item.dateLabel || data.today)}</time></li>`
        : '';
      lastDate = item.dateLabel;
      return `
        ${dateBlock}
        <li class="ghg-timeline-item">
          <div class="ghg-event-head">
            <a class="ghg-event-avatar" href="https://github.com/${encodeURIComponent(actor)}">
              ${eventAvatarTemplate(item, data)}
            </a>
            <a class="ghg-event-user" href="https://github.com/${encodeURIComponent(actor)}">${escapeHtml(actor)}</a>
            <span class="ghg-event-verb">${escapeHtml(verb)}</span>
            <time class="ghg-event-time">${escapeHtml(item.createdAt ? relativeTime(item.createdAt) : t('justNow'))}</time>
          </div>
          ${eventCardTemplate(item, href)}
        </li>
      `;
    }).join('');
  }

  function leftMenuTemplate(data) {
    return `
      <section>
        <h2>${escapeHtml(t('myWorkspace'))}</h2>
        <a class="ghg-left-row is-active" href="https://github.com/">
          <span><i>${iconCode()}</i>${escapeHtml(t('repositories'))}</span>
        </a>
        <div class="ghg-repo-list">${repoListTemplate(data.repos)}</div>
        <a class="ghg-more" href="https://github.com/${encodeURIComponent(data.userName)}?tab=repositories">${escapeHtml(t('viewAll'))}</a>
      </section>

      <section class="ghg-work-stats">
        <a href="https://github.com/pulls"><span><i>${iconPullRequest()}</i>${escapeHtml(t('pullRequests'))}</span></a>
        <a href="https://github.com/issues"><span><i>◎</i>${escapeHtml(t('issues'))}</span></a>
        <a href="https://gist.github.com/"><span><i>${iconCode()}</i>${escapeHtml(t('gists'))}</span></a>
        <a href="https://github.com/stars"><span><i>${iconStar()}</i>${escapeHtml(t('stars'))}</span></a>
      </section>
    `;
  }

  function findInsertionPoint() {
    return document.querySelector('.feed-background')
      || document.querySelector('.application-main')
      || document.querySelector('main')
      || document.body;
  }

  function renderWorkbench(data) {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      findInsertionPoint().before(root);
    }

    root.innerHTML = `
      <style>${styles()}</style>
      <div class="ghg-shell">
        <aside class="ghg-left" aria-label="${escapeHtml(t('myWorkspace'))}">
          ${leftMenuTemplate(data)}
        </aside>

        <main class="ghg-main" aria-label="${escapeHtml(t('activity'))}">
          <div class="ghg-main-head">
            <h1>${escapeHtml(t('activity'))}</h1>
            <details class="ghg-feed-select">
              <summary>
                <span class="ghg-feed-current">${currentFeedMode === 'mine' ? escapeHtml(t('myActivity')) : escapeHtml(t('allActivity'))}</span>
                <span class="ghg-feed-chevron" aria-hidden="true"><svg viewBox="0 0 16 16" width="12" height="12"><path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"></path></svg></span>
              </summary>
              <div class="ghg-feed-menu">
                <button type="button" data-feed-mode="all">${escapeHtml(t('allActivity'))}</button>
                <button type="button" data-feed-mode="mine">${escapeHtml(t('myActivity'))}</button>
              </div>
            </details>
          </div>
          <ol class="ghg-timeline" data-ghg-timeline>
            ${timelineTemplate(data, currentFeedMode)}
          </ol>
        </main>

        <aside class="ghg-right" aria-label="${escapeHtml(t('recommendations'))}">
          <section class="ghg-panel">
            <div class="ghg-panel-title">
              <h2>${escapeHtml(t('relatedUsers'))}</h2>
              <a href="https://github.com/explore">${escapeHtml(t('exploreMore'))}</a>
            </div>
            ${data.users.map((user) => `
              <div class="ghg-follow">
                <a class="ghg-follow-avatar" href="${escapeHtml(user.href)}">
                  ${user.avatar ? `<img src="${escapeHtml(user.avatar)}" alt="">` : `<img src="${escapeHtml(githubAvatarUrl(user.name))}" alt="">`}
                </a>
                <span>
                  <a class="ghg-user-link" href="${escapeHtml(user.href)}">${escapeHtml(user.name)}</a>
                  <em>${escapeHtml(t('from'))} ${escapeHtml(user.source)}</em>
                </span>
              </div>
            `).join('')}
          </section>

          <section class="ghg-panel">
            <div class="ghg-panel-title">
              <h2>${escapeHtml(t('relatedRepositories'))}</h2>
              <a href="https://github.com/explore">${escapeHtml(t('exploreRepositories'))}</a>
            </div>
            ${data.repos.slice(3, 9).map((repo) => `
              <a class="ghg-suggest-repo" href="${escapeHtml(repo.href)}">
                <span><strong>${escapeHtml(repo.repo || repo.name)}</strong><em>${escapeHtml(t('basedOnRepoActivity'))}</em></span>
                <b>${escapeHtml(t('viewRepository'))}</b>
              </a>
            `).join('')}
          </section>

          <section class="ghg-links">
            <a href="https://docs.github.com/get-started/using-git/about-git">${escapeHtml(t('gitCommandGuide'))}</a>
            <a href="https://github.com/trending">${escapeHtml(t('githubTrending'))}</a>
            <a href="https://github.com/features/copilot">${escapeHtml(t('aiCodingAssistant'))}</a>
            <a href="https://github.com/mobile">${escapeHtml(t('mobileApps'))}</a>
          </section>

          <footer class="ghg-footer">
            <a href="https://docs.github.com/">${escapeHtml(t('docs'))}</a>
            <a href="https://github.com/contact">${escapeHtml(t('support'))}</a>
            <a href="https://github.blog/changelog/">${escapeHtml(t('changelog'))}</a>
            <span>© GitHub.com</span>
          </footer>
        </aside>
      </div>
    `;

    root.querySelectorAll('[data-feed-mode]').forEach((button) => {
      const active = button.dataset.feedMode === currentFeedMode;
      button.classList.toggle('is-active', active);
      button.addEventListener('click', () => {
        currentFeedMode = button.dataset.feedMode === 'mine' ? 'mine' : 'all';
        root.querySelector('.ghg-feed-current').textContent = currentFeedMode === 'mine' ? t('myActivity') : t('allActivity');
        root.querySelectorAll('[data-feed-mode]').forEach((entry) => {
          entry.classList.toggle('is-active', entry.dataset.feedMode === currentFeedMode);
        });
        root.querySelector('[data-ghg-timeline]').innerHTML = timelineTemplate(data, currentFeedMode);
        root.querySelector('.ghg-feed-select').removeAttribute('open');
      });
    });

    document.body.classList.add(ACTIVE_CLASS);
    console.debug(`${LOG_PREFIX} rendered`, { path: location.pathname, repos: data.repoCount });
  }

  function styles() {
    return `
      html:has(body.${ACTIVE_CLASS}) { background: #ffffff !important; }
      body.${ACTIVE_CLASS} { background: #ffffff !important; overflow: auto !important; }
      body.${ACTIVE_CLASS} .feed-background { display: none !important; }
      body.${ACTIVE_CLASS} #${ROOT_ID} ~ .application-main .feed-background { display: none !important; }
      #${ROOT_ID}, #${ROOT_ID} * { box-sizing: border-box; }
      #${ROOT_ID} { min-height: calc(100vh - 64px); font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, "Microsoft YaHei", sans-serif; color: #1f2328; background: #ffffff; }
      #${ROOT_ID} a { text-decoration: none; }
      .ghg-panel a:hover, .ghg-footer a:hover, .ghg-links a:hover, .ghg-repo:hover, .ghg-work-stats a:hover { color: #0969da; }
      .ghg-shell { display: grid; grid-template-columns: 304px minmax(620px, 1fr) 328px; min-height: calc(100vh - 64px); border-top: 1px solid #d0d7de; }
      .ghg-left { position: sticky; top: 0; height: 100vh; overflow: auto; padding: 24px 16px 28px 24px; border-right: 1px solid #d0d7de; background: #f6f8fa; }
      .ghg-left section + section { margin-top: 30px; }
      .ghg-left h2 { margin: 0 0 18px; font-size: 14px; font-weight: 500; color: #57606a; }
      .ghg-panel h2 { margin: 0; font-size: 17px; font-weight: 800; color: #000; }
      .ghg-left-row { min-height: 34px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 10px; border-radius: 6px; color: #1f2328; font-size: 15px; }
      .ghg-left-row span { display: inline-flex; align-items: center; min-width: 0; }
      .ghg-left-row i, .ghg-line-icon, .ghg-work-stats i { width: 22px; margin-right: 8px; color: #6e7781; font-style: normal; text-align: center; white-space: nowrap; flex: 0 0 22px; }
      .ghg-left-row svg, .ghg-line-icon svg, .ghg-work-stats svg, .ghg-commit-icon svg { width: 16px; height: 16px; fill: currentColor; vertical-align: text-bottom; }
      .ghg-left-row strong, .ghg-work-stats strong { min-width: 18px; height: 18px; display: inline-grid; place-items: center; padding: 0 5px; border-radius: 9px; background: #eaeef2; color: #57606a; font-size: 12px; font-weight: 600; }
      .ghg-left-row.is-active { background: #ffffff; color: #1f2328; }
      .ghg-left-row:hover { color: #0969da; background: #ffffff; }
      .ghg-left-row:hover i { color: #0969da; }
      .ghg-repo-list { position: relative; display: grid; gap: 8px; margin-left: 16px; padding-left: 22px; border-left: 1px solid #d8dee4; }
      .ghg-repo { min-height: 32px; display: grid; grid-template-columns: 28px minmax(0, 1fr); align-items: center; border-radius: 6px; color: #1f2328; font-weight: 600; }
      .ghg-repo span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ghg-repo:hover { color: #0969da; }
      .ghg-more { display: inline-block; margin: 8px 0 0 36px; color: #57606a !important; }
      .ghg-work-stats { display: grid; gap: 8px; }
      .ghg-work-stats a { display: flex; justify-content: space-between; align-items: center; min-height: 34px; padding: 0 10px; border-radius: 6px; color: #1f2328; font-size: 15px; }
      .ghg-work-stats a span { display: inline-flex; align-items: center; min-width: 0; }
      .ghg-work-stats a:hover { background: #fff; color: #0969da; }
      .ghg-main { padding: 26px 38px 48px 46px; min-width: 0; }
      .ghg-main-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
      .ghg-main h1 { margin: 0; color: #1f2328; font-size: 22px; line-height: 30px; font-weight: 750; }
      .ghg-main-head a { height: 32px; display: inline-flex; align-items: center; padding: 0 14px; border: 1px solid #d0d7de; border-radius: 6px; background: #f6f8fa; color: #1f2328; font: inherit; }
      .ghg-timeline { --ghg-rail: 5px; position: relative; margin: 0; padding: 4px 0 0 calc(var(--ghg-rail) + 20px); list-style: none; }
      .ghg-timeline::before { content: ''; position: absolute; left: var(--ghg-rail); top: 0; bottom: 0; width: 2px; transform: translateX(-50%); background: #e8edf3; }
      .ghg-date-node { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; margin: 18px 0 10px calc(-1 * (var(--ghg-rail) + 20px)); list-style: none; }
      .ghg-date-node:first-child { margin-top: 0; }
      .ghg-date-dot { width: 10px; height: 10px; flex: 0 0 10px; border: 2px solid #4c84ff; border-radius: 50%; background: #fff; box-shadow: 0 0 0 2px #fff; }
      .ghg-date-node time { color: #1f2328; font-size: 14px; font-weight: 600; }
      .ghg-timeline-item { margin: 0 0 16px; padding: 0; list-style: none; }
      .ghg-event-head { display: flex; align-items: center; gap: 6px; min-width: 0; flex-wrap: wrap; }
      .ghg-event-avatar, .ghg-event-avatar img { width: 22px !important; height: 22px !important; border-radius: 50%; object-fit: cover; background: #e8edf3; flex: 0 0 22px; }
      .ghg-event-user { color: #1f2328; font-weight: 600; font-size: 14px; }
      .ghg-event-user:hover { color: #0969da; }
      .ghg-event-verb { color: #8b949e; font-size: 13px; }
      .ghg-event-time { margin-left: auto; color: #8b949e; font-size: 12px; white-space: nowrap; }
      .ghg-event-card { margin-top: 8px; padding: 10px 12px; border-radius: 6px; background: #f5f6f8; }
      .ghg-event-card-link { display: flex; align-items: flex-start; gap: 8px; color: #1f2328; }
      .ghg-event-card-link:hover { background: #eef1f5; }
      .ghg-event-ref { margin-bottom: 6px; color: #57606a; font-size: 13px; }
      .ghg-event-repo { color: #0969da; font-weight: 600; }
      .ghg-event-repo:hover { text-decoration: underline; }
      .ghg-event-detail { color: #57606a; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ghg-event-detail:hover { color: #0969da; text-decoration: underline; }
      .ghg-event-commit { display: flex; align-items: center; gap: 8px; min-width: 0; color: #1f2328; font-size: 13px; }
      .ghg-event-commit:hover code { text-decoration: underline; }
      .ghg-commit-icon, .ghg-event-repo-icon { width: 16px; color: #8b949e; flex: 0 0 16px; }
      .ghg-event-commit code { color: #0969da; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 12px; font-weight: 600; }
      .ghg-event-commit span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #57606a; }
      .ghg-event-card-text { min-width: 0; display: grid; gap: 2px; }
      .ghg-event-card-text .ghg-event-repo { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
      .ghg-skeleton-item { pointer-events: none; }
      .ghg-skeleton-avatar { width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(90deg, #eaeef2 25%, #f6f8fa 37%, #eaeef2 63%); background-size: 400% 100%; animation: ghg-shimmer 1.4s ease infinite; flex: 0 0 22px; }
      .ghg-skeleton-meta { display: flex; align-items: center; gap: 8px; min-height: 22px; }
      .ghg-skeleton-meta span { height: 12px; border-radius: 999px; background: linear-gradient(90deg, #eaeef2 25%, #f6f8fa 37%, #eaeef2 63%); background-size: 400% 100%; animation: ghg-shimmer 1.4s ease infinite; }
      .ghg-skeleton-meta span:nth-child(2) { width: 72px; }
      .ghg-skeleton-meta span:nth-child(3) { width: 88px; }
      .ghg-skeleton-meta span:nth-child(4) { width: 48px; margin-left: auto; }
      .ghg-skeleton-card { display: grid; gap: 8px; margin-top: 8px; }
      .ghg-skeleton-line { display: block; height: 12px; border-radius: 999px; background: linear-gradient(90deg, #eaeef2 25%, #f6f8fa 37%, #eaeef2 63%); background-size: 400% 100%; animation: ghg-shimmer 1.4s ease infinite; }
      .ghg-skeleton-line-lg { width: 58%; }
      .ghg-skeleton-line-sm { width: 82%; }
      @keyframes ghg-shimmer {
        0% { background-position: 100% 0; }
        100% { background-position: 0 0; }
      }
      .ghg-right { padding: 30px 28px 40px 14px; overflow: auto; }
      .ghg-panel { margin-bottom: 30px; }
      .ghg-panel-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      .ghg-panel-title a { color: #57606a; font-size: 13px; }
      .ghg-follow { display: grid; grid-template-columns: 46px minmax(0, 1fr); align-items: center; gap: 12px; min-height: 60px; }
      .ghg-follow span:nth-child(2) { min-width: 0; display: grid; }
      .ghg-follow em { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #57606a; font-size: 12px; font-style: normal; }
      .ghg-user-link { color: #1f2328 !important; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ghg-user-link:hover { color: #0969da !important; text-decoration: underline !important; }
      .ghg-follow-avatar, .ghg-follow-avatar img, .ghg-follow-avatar span { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: #57606a; color: #fff; font-size: 20px; font-weight: 700; object-fit: cover; }
      .ghg-suggest-repo { display: grid; grid-template-columns: minmax(0, 1fr) 72px; gap: 10px; margin: 0 -10px; padding: 8px 10px; border-radius: 6px; color: #57606a; }
      .ghg-suggest-repo span { min-width: 0; display: grid; }
      .ghg-suggest-repo strong { color: #666; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ghg-suggest-repo em { color: #57606a; font-style: normal; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ghg-suggest-repo b { color: #57606a; font-size: 12px; font-weight: 500; text-align: right; }
      .ghg-suggest-repo:hover { color: #0969da; background: #f6f8fa; }
      .ghg-suggest-repo:hover strong, .ghg-suggest-repo:hover b { color: #0969da; }
      .ghg-links { display: flex; flex-wrap: wrap; gap: 8px 10px; padding: 16px 0; border-top: 1px solid #d8dee4; border-bottom: 1px solid #d8dee4; color: #57606a; }
      .ghg-links a { color: #57606a; }
      .ghg-links a::after { content: "·"; margin-left: 10px; color: #c8cdd2; }
      .ghg-links a:last-child::after { content: ""; margin: 0; }
      .ghg-footer { display: flex; flex-wrap: wrap; gap: 8px 10px; margin-top: 16px; color: #57606a; font-size: 13px; }
      .ghg-footer a { color: #57606a; }
      .ghg-footer span { flex-basis: 100%; margin-top: 8px; }
      .ghg-empty { margin: 0; padding: 32px 16px; border-radius: 6px; background: #f5f6f8; color: #8b949e; text-align: center; font-size: 14px; list-style: none; }
      .ghg-feed-select { position: relative; }
      .ghg-feed-select summary { height: 32px; min-width: 118px; display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; border: 1px solid #d0d7de; border-radius: 6px; background: #f6f8fa; color: #1f2328; cursor: pointer; list-style: none; line-height: 1; }
      .ghg-feed-select summary::-webkit-details-marker { display: none; }
      .ghg-feed-current { flex: 1; min-width: 0; }
      .ghg-feed-chevron { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: #57606a; }
      .ghg-feed-chevron svg { display: block; width: 12px; height: 12px; fill: currentColor; }
      .ghg-feed-menu { position: absolute; top: 38px; right: 0; z-index: 10; width: 140px; padding: 6px; border: 1px solid #d0d7de; border-radius: 6px; background: #fff; box-shadow: 0 8px 24px rgba(140,149,159,0.2); }
      .ghg-feed-menu button { width: 100%; height: 34px; display: block; padding: 0 10px; border: 0; border-radius: 6px; background: transparent; color: #1f2328; text-align: left; font: inherit; cursor: pointer; }
      .ghg-feed-menu button:hover, .ghg-feed-menu button.is-active { background: #f0f6ff; color: #0969da; }
      .ghg-feed-menu button.is-active { font-weight: 600; }
      @media (max-width: 1180px) {
        .ghg-shell { grid-template-columns: 280px minmax(420px, 1fr); }
        .ghg-right { display: none; }
      }
      @media (max-width: 820px) {
        .ghg-shell { display: block; }
        .ghg-left { position: static; height: auto; width: auto; border-right: 0; border-bottom: 1px solid #d0d7de; padding: 16px 12px; }
        .ghg-main { padding: 24px 16px 40px; }
      }
    `;
  }

  function boot() {
    if (!isGithubHome()) {
      document.body.classList.remove(ACTIVE_CLASS);
      document.getElementById(ROOT_ID)?.remove();
      lastData = null;
      lastDataKey = '';
      activityLoadKey = '';
      return;
    }

    if (!document.body) return;
    if (!isLoggedInHome()) {
      console.debug(`${LOG_PREFIX} skipped: not on the logged-in dashboard home`);
      return;
    }

    const data = collectGithubData();
    const key = dataKey(data);
    if (lastData && lastDataKey === key && document.getElementById(ROOT_ID)) {
      const freshDashboard = parseDashboardFeedItems(lastData.userName);
      if (freshDashboard.length > (lastData.dashboardFeedItems?.length || 0)) {
        lastData.dashboardFeedItems = freshDashboard;
        lastData.feedItems = mergeFeedItems(freshDashboard, lastData.feedItems);
        lastData.activityStatus = 'ready';
        activityLoadKey = '';
      }
      renderWorkbench(lastData);
      if (lastData.activityStatus === 'loading') loadActivityFor(lastData, key);
      return;
    }

    lastData = data;
    lastDataKey = key;
    renderWorkbench(lastData);
    loadActivityFor(lastData, key);
  }

  let scheduled = false;
  function scheduleBoot() {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(() => {
      scheduled = false;
      boot();
    }, 0);
  }

  scheduleBoot();
  [300, 1000, 2500, 5000].forEach((delay) => {
    window.setTimeout(scheduleBoot, delay);
  });
  new MutationObserver((mutations) => {
    const langChanged = mutations.some((mutation) => mutation.type === 'attributes' && mutation.attributeName === 'lang');
    if (isGithubHome() && (langChanged || !document.getElementById(ROOT_ID))) scheduleBoot();
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['lang'] });
  window.addEventListener('turbo:load', scheduleBoot);
  window.addEventListener('turbo:render', scheduleBoot);
  window.addEventListener('pjax:end', scheduleBoot);
})();
