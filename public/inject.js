(() => {
  // If already loaded, we don't want to re-hook fetch/XHR,
  // but we DO want to re-register the specific listeners below.
  const isFirstLoad = !window.__xvmNet;
  const DEBUG = (() => {
    try {
      // 优先检查脚本标签上的 data-debug 属性
      if (document.currentScript && document.currentScript.dataset.debug === 'true') {
        return true;
      }
      return localStorage.getItem('XCOCLAWS_DEBUG') === 'true';
    } catch (e) {
      return false;
    }
  })();

  const log = (...args) => DEBUG && console.log('%c[XCoClaws]', 'color: #1d9bf0; font-weight: bold;', ...args);
  const debug = (...args) => DEBUG && console.debug('%c[XCoClaws]', 'color: #71767b;', ...args);

  if (isFirstLoad) {
    const reqSubs = []; // [{ matcher, fn }]
    const resSubs = [];
    let latestBearer = null;

    function notifyReq(url, init, headers, source) {
      if (!url) return;
      for (const sub of reqSubs) {
        if (!sub.matcher.test(url)) continue;
        try { sub.fn({ url, init, headers, source }); } catch (_) { }
      }
    }

    function notifyRes(url, response, source) {
      if (!url) return;
      // Filter out non-api calls to reduce noise in console if needed,
      // but for now let's just log matches.
      for (const sub of resSubs) {
        if (!sub.matcher.test(url)) continue;
        debug(`Match! [${source}] ${url}`);
        try { sub.fn({ url, response, source }); } catch (e) {
          console.error('[XCoClaws] Subscriber error', e);
        }
      }
    }

    function trackBearer(headers) {
      const auth = headers?.authorization;
      if (auth) latestBearer = auth;
    }

    function extractUrl(input) {
      if (input instanceof Request) return input.url;
      if (input instanceof URL) return input.href;
      if (typeof input === 'string') return input;
      return null;
    }

    function normalize(headersLike) {
      const out = {};
      if (!headersLike) return out;
      try {
        if (headersLike instanceof Headers) {
          headersLike.forEach((v, k) => { out[k.toLowerCase()] = v; });
        } else if (typeof headersLike === 'object') {
          for (const k of Object.keys(headersLike)) {
            out[k.toLowerCase()] = headersLike[k];
          }
        }
      } catch (_) { }
      return out;
    }

    // === fetch ===
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const url = extractUrl(args[0]);
      const init = args[1] || {};
      let raw = null;
      if (init.headers) raw = init.headers;
      else if (args[0] instanceof Request) raw = args[0].headers;
      const headers = normalize(raw);
      trackBearer(headers);
      notifyReq(url, init, headers, 'fetch');
      const response = await originalFetch.apply(this, args);
      notifyRes(url, response, 'fetch');
      return response;
    };

    // === XHR ===
    const xhrOpen = XMLHttpRequest.prototype.open;
    const xhrSetH = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      const urlStr = url instanceof URL ? url.href : (typeof url === 'string' ? url : null);
      this.__xvmNet = { method, url: urlStr, headers: {} };
      if (urlStr) {
        this.addEventListener('load', function () {
          const xhr = this;
          notifyReq(urlStr, { method: xhr.__xvmNet.method }, xhr.__xvmNet.headers, 'xhr');
          notifyRes(urlStr, {
            status: xhr.status,
            getHeader: (n) => xhr.getResponseHeader(n),
            text: () => xhr.responseText,
            json: () => JSON.parse(xhr.responseText),
          }, 'xhr');
        });
      }
      return xhrOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      if (this.__xvmNet) {
        this.__xvmNet.headers[String(name).toLowerCase()] = value;
        if (/^authorization$/i.test(name) && value) latestBearer = value;
      }
      return xhrSetH.apply(this, arguments);
    };

    window.__xvmNet = {
      originalFetch,
      onRequest(matcher, fn) { reqSubs.push({ matcher, fn }); },
      onResponse(matcher, fn) { resSubs.push({ matcher, fn }); },
      getBearer: () => latestBearer,
      _resetSubs() { reqSubs.length = 0; resSubs.length = 0; },
    };
  } else {
    // If already loaded, just reset existing subscribers to prepare for new ones
    window.__xvmNet._resetSubs();
    debug('API Interceptor re-initialized');
  }

  // --- XCoClaws Specific Logic ---
  debug('Registering GraphQL listeners');

  const GRAPHQL_RE = /\/i\/api\/graphql\//;

  function reportRateLimit(remaining, reset) {
    if (remaining !== null && reset !== null) {
      debug(`Rate Limit - Remaining: ${remaining}, Reset: ${reset}`);
    }
  }

  function scanForTweets(data, url) {
    if (!data) return;
    debug(`url`, url, `\n`, data);

    // Identify query name from URL
    let queryName = 'Unknown';
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      queryName = pathParts[pathParts.length - 1] || 'GraphQL';

      // For some GraphQL URLs, the query name is in the path after /graphql/
      // or sometimes it's a long hash. We can check if common names are in the URL.
      if (url.includes('/BlueVerifiedFollowers')) queryName = 'BlueVerifiedFollowers';
      else if (url.includes('/Followers')) queryName = 'Followers';
      else if (url.includes('/Following')) queryName = 'Following';
      else if (url.includes('/UserByScreenName')) queryName = 'UserByScreenName';
      else if (url.includes('/HomeTimeline')) queryName = 'HomeTimeline';
      else if (url.includes('/HomeLatestTimeline')) queryName = 'HomeLatestTimeline';
      else if (url.includes('/TweetDetail')) queryName = 'TweetDetail';
      else if (url.includes('/SearchTimeline')) queryName = 'SearchTimeline';
      else if (url.includes('/ListLatestTweetsTimeline')) queryName = 'ListLatestTweetsTimeline';
    } catch (e) { }

    debug(`Intercepted ${queryName} Data`);

    const foundUsers = [];
    function findUsers(obj) {
      if (!obj || typeof obj !== 'object') return;

      // Handle GraphQL User object (has core and legacy)
      if (obj.legacy && obj.core?.screen_name && obj.legacy.followers_count !== undefined) {
        foundUsers.push({
          id: obj.rest_id,
          name: obj.core?.name || obj.legacy.name,
          screen_name: obj.core?.screen_name || obj.legacy.screen_name,
          followers_count: obj.legacy.followers_count,
          friends_count: obj.legacy.friends_count || obj.legacy.following_count,
          is_following: obj.relationship_perspectives?.following,
          is_followed_by: obj.relationship_perspectives?.followed_by
        });
        return; // Found a user, don't recurse further into this object
      }

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          findUsers(obj[key]);
        }
      }
    }

    findUsers(data);

    if (foundUsers.length > 0) {
      debug(`Found ${foundUsers.length} users in ${queryName} response`);
      window.postMessage({
        type: 'X_STATS_DATA',
        data: {
          query: queryName,
          users: foundUsers
        }
      }, '*');
    }
  }

  window.__xvmNet.onRequest(GRAPHQL_RE, ({ url, headers }) => {
    // console.debug('XCoClaws: GraphQL Request intercepted', url);
  });

  window.__xvmNet.onResponse(GRAPHQL_RE, async ({ url, response, source }) => {
    try {
      let data;
      if (source === 'fetch') {
        reportRateLimit(
          response.headers.get('x-rate-limit-remaining'),
          response.headers.get('x-rate-limit-reset')
        );
        data = await response.clone().json();
      } else {
        reportRateLimit(
          response.getHeader('x-rate-limit-remaining'),
          response.getHeader('x-rate-limit-reset')
        );
        data = response.json();
      }
      scanForTweets(data, url);
    } catch (e) {
      // console.error('XCoClaws: Error processing GraphQL response', e);
    }
  });

  // Also support legacy v1.1 API
  window.__xvmNet.onResponse(/\/i\/api\/1\.1\//, async ({ url, response, source }) => {
    try {
      let data;
      if (source === 'fetch') {
        data = await response.clone().json();
      } else {
        data = response.json();
      }
      scanForTweets(data, url);
    } catch (e) { }
  });

})();


