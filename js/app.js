/* =========================================================
   DIVINETUBE 6.0 — APP.JS
   ========================================================= */

'use strict';

/* =========================================================
   SUPABASE
   ========================================================= */

function getSb() {
  try {
    if (
      typeof window === 'undefined' ||
      !window.DIVINETUBE_CONFIG
    ) {
      return null;
    }

    const cfg = window.DIVINETUBE_CONFIG;

    if (
      !cfg.SUPABASE_URL ||
      !cfg.SUPABASE_PUBLISHABLE_KEY
    ) {
      return null;
    }

    if (
      typeof window.supabase === 'undefined' ||
      typeof window.supabase.createClient !== 'function'
    ) {
      return null;
    }

    if (!window.__DIVINETUBE_SB) {
      window.__DIVINETUBE_SB =
        window.supabase.createClient(
          cfg.SUPABASE_URL,
          cfg.SUPABASE_PUBLISHABLE_KEY,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            }
          }
        );
    }

    return window.__DIVINETUBE_SB;

  } catch (error) {
    console.error('Supabase initialization error:', error);
    return null;
  }
}


/* =========================================================
   HELPERS
   ========================================================= */

function $(selector) {
  return document.querySelector(selector);
}


function esc(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function fmt(number) {
  const n = Number(number || 0);

  if (n >= 1000000000) {
    return (n / 1000000000).toFixed(1) + 'B';
  }

  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M';
  }

  if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K';
  }

  return String(n);
}


function date(value) {
  if (!value) {
    return '';
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return '';
  }

  return d.toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  );
}


function formatYouTubeCount(value) {
  const n = Number(value || 0);

  if (n >= 1000000000) {
    return (n / 1000000000).toFixed(1) + 'B';
  }

  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M';
  }

  if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K';
  }

  return String(n);
}


/* =========================================================
   CURRENT USER
   ========================================================= */

async function currentUser() {
  const s = getSb();

  if (!s) {
    return null;
  }

  try {
    const {
      data,
      error
    } = await s.auth.getUser();

    if (error) {
      return null;
    }

    return data?.user || null;

  } catch (error) {
    console.error('Current user error:', error);
    return null;
  }
}


function initials(user) {
  if (!user) {
    return '?';
  }

  const username =
    user.user_metadata?.username ||
    user.email?.split('@')[0] ||
    'U';

  const parts =
    String(username)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length >= 2) {
    return (
      parts[0][0] +
      parts[1][0]
    ).toUpperCase();
  }

  return username
    .slice(0, 2)
    .toUpperCase();
}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {
  document.body.classList.toggle('light');

  if (
    document.body.classList.contains('light')
  ) {
    localStorage.dt_theme = 'light';
  } else {
    localStorage.removeItem('dt_theme');
  }
}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {
  let el = $('#toast');

  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';

    Object.assign(
      el.style,
      {
        position: 'fixed',
        left: '50%',
        bottom: '24px',
        transform: 'translateX(-50%)',
        zIndex: '99999',
        padding: '12px 18px',
        borderRadius: '12px',
        background: '#111827',
        color: '#fff',
        fontSize: '14px',
        boxShadow:
          '0 10px 30px rgba(0,0,0,.25)',
        maxWidth: '90vw',
        textAlign: 'center'
      }
    );

    document.body.appendChild(el);
  }

  el.textContent = message;
  el.style.display = 'block';

  clearTimeout(
    window.__dtToastTimer
  );

  window.__dtToastTimer =
    setTimeout(() => {
      el.style.display = 'none';
    }, 3000);
}


/* =========================================================
   AVATAR
   ========================================================= */

function avatar(user, size = 40) {
  if (!user) {
    return `
      <div
        class="avatar"
        style="
          width:${size}px;
          height:${size}px;
        "
      >
        ?
      </div>
    `;
  }

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.avatar ||
    '';

  if (avatarUrl) {
    return `
      <img
        class="avatar"
        src="${esc(avatarUrl)}"
        alt=""
        style="
          width:${size}px;
          height:${size}px;
        "
      >
    `;
  }

  return `
    <div
      class="avatar"
      style="
        width:${size}px;
        height:${size}px;
      "
    >
      ${esc(initials(user))}
    </div>
  `;
}


/* =========================================================
   LOADING
   ========================================================= */

function loading(message = 'Loading…') {
  return `
    <div class="loading">
      <div class="spinner"></div>
      <span>${esc(message)}</span>
    </div>
  `;
}


/* =========================================================
   LOCAL VIDEO CARD
   ========================================================= */

function card(v) {
  const username =
    v.profiles?.username ||
    v.username ||
    'DivineTube';

  const thumbnail =
    v.thumbnail_url ||
    'assets/default-thumbnail.jpg';

  return `
    <article
      class="videoCard"
      data-video-id="${esc(v.id)}"
    >
      <a
        href="watch.html?id=${encodeURIComponent(v.id)}"
        class="videoThumb"
      >
        <img
          src="${esc(thumbnail)}"
          alt="${esc(v.title || 'Video')}"
          loading="lazy"
          onerror="
            this.onerror=null;
            this.src='assets/default-thumbnail.jpg';
          "
        >

        ${
          v.duration
            ? `
              <span class="duration">
                ${esc(v.duration)}
              </span>
            `
            : ''
        }
      </a>

      <div class="videoInfo">
        <div class="videoAvatar">
          ${
            v.profiles?.avatar_url
              ? `
                <img
                  src="${esc(v.profiles.avatar_url)}"
                  alt=""
                >
              `
              : `
                <div class="avatar">
                  ${esc(
                    String(username)
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </div>
              `
          }
        </div>

        <div class="videoText">
          <a
            href="watch.html?id=${encodeURIComponent(v.id)}"
            class="videoTitle"
          >
            ${esc(v.title || 'Untitled video')}
          </a>

          <div class="channelName">
            ${esc(username)}
          </div>

          <div class="videoMeta">
            ${fmt(v.views || 0)} views
            ${
              v.created_at
                ? ` • ${esc(date(v.created_at))}`
                : ''
            }
          </div>
        </div>
      </div>
    </article>
  `;
}


/* =========================================================
   YOUTUBE CARD
   ========================================================= */

function youtubeCard(v) {
  const snippet = v.snippet || {};
  const stats = v.statistics || {};

  const id =
    typeof v.id === 'string'
      ? v.id
      : v.id?.videoId;

  const title =
    snippet.title || 'YouTube video';

  const channel =
    snippet.channelTitle || '';

  const thumb =
    snippet.thumbnails?.high?.url ||
    snippet.thumbnails?.medium?.url ||
    snippet.thumbnails?.default?.url ||
    '';

  const views =
    stats.viewCount || 0;

  return `
    <article class="videoCard youtubeCard">

      <a
        class="videoThumb"
        href="watch.html?yt=${encodeURIComponent(id)}"
      >
        <img
          src="${esc(thumb)}"
          alt="${esc(title)}"
          loading="lazy"
        >
      </a>

      <div class="videoInfo">

        <div class="videoAvatar">
          <div class="avatar">
            YT
          </div>
        </div>

        <div class="videoText">

          <a
            class="videoTitle"
            href="watch.html?yt=${encodeURIComponent(id)}"
          >
            ${esc(title)}
          </a>

          <div class="channelName">
            ${esc(channel)}
          </div>

          <div class="videoMeta">
            ${formatYouTubeCount(views)} views
          </div>

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   YOUTUBE API
   ========================================================= */

function getYouTubeKey() {
  return (
    window.DIVINETUBE_CONFIG?.YOUTUBE_API_KEY ||
    window.YOUTUBE_API_KEY ||
    ''
  );
}


async function youtubeRequest(
  endpoint,
  params = {}
) {
  const key = getYouTubeKey();

  if (!key) {
    return {
      error: 'YouTube API key not configured.',
      data: null
    };
  }

  const query =
    new URLSearchParams({
      ...params,
      key
    });

  try {
    const response =
      await fetch(
        `https://www.googleapis.com/youtube/v3/${endpoint}?${query}`
      );

    const data =
      await response.json();

    if (!response.ok) {
      return {
        error:
          data?.error?.message ||
          'YouTube request failed.',
        data: null
      };
    }

    return {
      error: null,
      data
    };

  } catch (error) {
    return {
      error:
        error.message ||
        'Could not connect to YouTube.',
      data: null
    };
  }
}


async function loadYouTubePopular(
  container,
  category = ''
) {
  if (!container) {
    return;
  }

  const key = getYouTubeKey();

  if (!key) {
    return;
  }

  const params = {
    part: 'snippet,statistics',
    chart: 'mostPopular',
    maxResults: '12',
    regionCode: 'NG'
  };

  if (category) {
    params.videoCategoryId = category;
  }

  const result =
    await youtubeRequest(
      'videos',
      params
    );

  if (result.error) {
    console.warn(
      'YouTube:',
      result.error
    );
    return;
  }

  const items =
    result.data?.items || [];

  if (!items.length) {
    return;
  }

  container.insertAdjacentHTML(
    'beforeend',
    items.map(youtubeCard).join('')
  );
}


async function loadYouTubeSearch(
  container,
  query
) {
  if (!container || !query) {
    return;
  }

  const result =
    await youtubeRequest(
      'search',
      {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: '12'
      }
    );

  if (result.error) {
    console.warn(
      'YouTube search:',
      result.error
    );
    return;
  }

  const items =
    result.data?.items || [];

  if (!items.length) {
    return;
  }

  const ids =
    items
      .map(x => x.id?.videoId)
      .filter(Boolean);

  let fullItems = items;

  if (ids.length) {
    const details =
      await youtubeRequest(
        'videos',
        {
          part: 'snippet,statistics',
          id: ids.join(',')
        }
      );

    if (!details.error) {
      fullItems =
        details.data?.items || items;
    }
  }

  container.insertAdjacentHTML(
    'beforeend',
    fullItems.map(youtubeCard).join('')
  );
}


/* =========================================================
   HEADER
   ========================================================= */

async function header() {
  const s = getSb();
  const u = await currentUser();

  const avatarEl = $('#avatar');
  const authLinkEl = $('#authLink');

  if (u) {

    if (avatarEl) {
      avatarEl.textContent = initials(u);
      avatarEl.style.display = 'grid';
    }

    if (authLinkEl) {
      authLinkEl.textContent = 'Sign out';
      authLinkEl.href = '#';

      authLinkEl.onclick =
        async e => {
          e.preventDefault();

          if (!s) {
            toast(
              'Authentication is not available.'
            );
            return;
          }

          authLinkEl.textContent =
            'Signing out…';

          authLinkEl.style.pointerEvents =
            'none';

          try {
            const {
              error
            } =
              await s.auth.signOut();

            if (error) {
              console.error(
                'Sign out error:',
                error
              );

              authLinkEl.textContent =
                'Sign out';

              authLinkEl.style.pointerEvents =
                '';

              toast(
                error.message ||
                'Could not sign out.'
              );

              return;
            }

            if (avatarEl) {
              avatarEl.style.display =
                'none';
            }

            authLinkEl.textContent =
              'Sign in';

            authLinkEl.href =
              'auth.html';

            authLinkEl.onclick =
              null;

            authLinkEl.style.pointerEvents =
              '';

            toast(
              'You have been signed out.'
            );

            setTimeout(() => {
              location.href =
                'index.html';
            }, 500);

          } catch (error) {
            console.error(
              'Sign out error:',
              error
            );

            authLinkEl.textContent =
              'Sign out';

            authLinkEl.style.pointerEvents =
              '';

            toast(
              'Something went wrong while signing out.'
            );
          }
        };
    }

  } else {

    if (avatarEl) {
      avatarEl.style.display = 'none';
    }

    if (authLinkEl) {
      authLinkEl.textContent =
        'Sign in';

      authLinkEl.href =
        'auth.html';

      authLinkEl.onclick =
        null;

      authLinkEl.style.pointerEvents =
        '';
    }
  }

  if (
    localStorage.dt_theme === 'light'
  ) {
    document.body.classList.add('light');
  }
}


/* =========================================================
   YOUTUBE ERROR
   ========================================================= */

function youtubeErrorHtml(message) {
  return `
    <div class="notice">
      ${esc(message)}
    </div>
  `;
}


/* =========================================================
   LOAD VIDEOS
   ========================================================= */

async function loadVideos(
  container,
  options = {}
) {
  if (!container) {
    return;
  }

  const s = getSb();

  const {
    title = '',
    category = '',
    youtube = true
  } = options;

  container.innerHTML =
    loading('Loading videos…');

  let localItems = [];

  if (s) {
    try {
      let query =
        s
          .from('videos')
          .select(
            `
              *,
              profiles(username,avatar_url)
            `
          )
          .order(
            'created_at',
            {
              ascending: false
            }
          )
          .limit(30);

      if (title) {
        query =
          query.ilike(
            'title',
            `%${title}%`
          );
      }

      if (category) {
        query =
          query.eq(
            'category',
            category
          );
      }

      const {
        data,
        error
      } = await query;

      if (error) {
        console.error(
          'Load videos error:',
          error
        );
      } else {
        localItems =
          data || [];
      }

    } catch (error) {
      console.error(
        'Load local videos error:',
        error
      );
    }
  }

  container.innerHTML = '';

  if (localItems.length) {
    container.insertAdjacentHTML(
      'beforeend',
      localItems.map(card).join('')
    );
  }

  if (
    !localItems.length &&
    !youtube
  ) {
    container.innerHTML =
      `
        <div class="notice">
          No videos found.
        </div>
      `;
  }

  if (youtube) {
    if (title) {
      await loadYouTubeSearch(
        container,
        title
      );
    } else {
      await loadYouTubePopular(
        container
      );
    }
  }

  if (!container.children.length) {
    container.innerHTML =
      `
        <div class="notice">
          No videos found.
        </div>
      `;
  }
}


/* =========================================================
   AUTH PAGE
   ========================================================= */

async function authPage() {
  const f = $('#authForm');

  if (!f) {
    return;
  }

  const s = getSb();

  if (!s) {
    const msg = $('#msg');

    if (msg) {
      msg.textContent =
        'Supabase is not configured.';
    }

    return;
  }

  const username =
    $('#username');

  const email =
    $('#email');

  const password =
    $('#password');

  const msg =
    $('#msg');

  const submit =
    $('#authSubmit');

  const forgot =
    $('#forgotPassword');

  let isSignup =
    window.isSignup !== false;

  function updateMode() {

    if (username) {
      username.closest('.field')?.classList.toggle(
        'hidden',
        !isSignup
      );

      username.style.display =
        isSignup
          ? ''
          : 'none';
    }

    if (forgot) {
      forgot.style.display =
        isSignup
          ? 'none'
          : '';
    }

    if (submit) {
      submit.textContent =
        isSignup
          ? 'Create account'
          : 'Sign in';
    }

    const switchBtn =
      $('#switchAuth');

    if (switchBtn) {
      switchBtn.textContent =
        isSignup
          ? 'Already have an account? Sign in'
          : "Don't have an account? Sign up";
    }
  }

  updateMode();

  const switchAuth =
    $('#switchAuth');

  if (switchAuth) {
    switchAuth.onclick =
      e => {
        e.preventDefault();

        isSignup =
          !isSignup;

        window.isSignup =
          isSignup;

        updateMode();

        if (msg) {
          msg.textContent = '';
        }
      };
  }

  if (forgot) {
    forgot.onclick =
      async e => {
        e.preventDefault();

        const value =
          email?.value.trim();

        if (!value) {
          if (msg) {
            msg.textContent =
              'Enter your email first.';
          }

          return;
        }

        try {
          const {
            error
          } =
            await s.auth.resetPasswordForEmail(
              value,
              {
                redirectTo:
                  `${location.origin}${location.pathname.replace(
                    /[^/]*$/,
                    ''
                  )}update-password.html`
              }
            );

          if (error) {
            if (msg) {
              msg.textContent =
                error.message;
            }

            return;
          }

          if (msg) {
            msg.textContent =
              'Password reset email sent. Check your inbox.';
          }

        } catch (error) {
          if (msg) {
            msg.textContent =
              error.message ||
              'Could not send reset email.';
          }
        }
      };
  }

  f.onsubmit =
    async e => {
      e.preventDefault();

      const em =
        email?.value.trim();

      const pw =
        password?.value || '';

      const un =
        username?.value.trim();

      if (!em || !pw) {
        if (msg) {
          msg.textContent =
            'Email and password are required.';
        }

        return;
      }

      if (
        isSignup &&
        !un
      ) {
        if (msg) {
          msg.textContent =
            'Username is required.';
        }

        return;
      }

      if (submit) {
        submit.disabled = true;
        submit.textContent =
          isSignup
            ? 'Creating account…'
            : 'Signing in…';
      }

      try {

        if (isSignup) {

          const {
            data,
            error
          } =
            await s.auth.signUp({
              email: em,
              password: pw,
              options: {
                data: {
                  username: un
                }
              }
            });

          if (error) {
            throw error;
          }

          if (
            data?.session
          ) {
            if (msg) {
              msg.textContent =
                'Account created successfully!';
            }

            setTimeout(() => {
              location.href =
                'index.html';
            }, 700);

          } else {
            if (msg) {
              msg.textContent =
                'Account created! Check your email to verify your account.';
            }
          }

        } else {

          const {
            data,
            error
          } =
            await s.auth.signInWithPassword({
              email: em,
              password: pw
            });

          if (error) {
            throw error;
          }

          if (!data?.user) {
            throw new Error(
              'Sign in failed.'
            );
          }

          if (msg) {
            msg.textContent =
              'Signed in successfully!';
          }

          setTimeout(() => {
            location.href =
              'index.html';
          }, 500);
        }

      } catch (error) {
        console.error(
          'Auth error:',
          error
        );

        if (msg) {
          msg.textContent =
            error.message ||
            'Authentication failed.';
        }

      } finally {

        if (submit) {
          submit.disabled = false;

          submit.textContent =
            isSignup
              ? 'Create account'
              : 'Sign in';
        }
      }
    };
}


/* =========================================================
   VIDEO THUMBNAIL
   ========================================================= */

function extractVideoFrame(file) {
  return new Promise(
    (resolve, reject) => {

      if (!file) {
        reject(
          new Error(
            'No video selected.'
          )
        );

        return;
      }

      const video =
        document.createElement('video');

      const url =
        URL.createObjectURL(file);

      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';

      let done = false;

      function cleanup() {
        URL.revokeObjectURL(url);

        video.removeAttribute('src');

        try {
          video.load();
        } catch (_) {}
      }

      function fail(error) {
        if (done) {
          return;
        }

        done = true;
        cleanup();
        reject(error);
      }

      video.onerror =
        () => {
          fail(
            new Error(
              'Could not read the video to create a thumbnail.'
            )
          );
        };

      video.onloadedmetadata =
        () => {
          const duration =
            Number(video.duration);

          let target =
            Number.isFinite(duration) &&
            duration > 0
              ? duration * 0.15
              : 0;

          if (
            !Number.isFinite(target) ||
            target < 0
          ) {
            target = 0;
          }

          try {
            video.currentTime =
              target;
          } catch (_) {
            video.currentTime = 0;
          }
        };

      video.onseeked =
        () => {
          if (done) {
            return;
          }

          try {

            const canvas =
              document.createElement(
                'canvas'
              );

            const width =
              video.videoWidth ||
              1280;

            const height =
              video.videoHeight ||
              720;

            const maxWidth =
              1280;

            const scale =
              width > maxWidth
                ? maxWidth / width
                : 1;

            canvas.width =
              Math.round(
                width * scale
              );

            canvas.height =
              Math.round(
                height * scale
              );

            const ctx =
              canvas.getContext(
                '2d'
              );

            if (!ctx) {
              throw new Error(
                'Canvas is not supported.'
              );
            }

            ctx.drawImage(
              video,
              0,
              0,
              canvas.width,
              canvas.height
            );

            canvas.toBlob(
              blob => {

                if (done) {
                  return;
                }

                if (!blob) {
                  fail(
                    new Error(
                      'Could not create thumbnail.'
                    )
                  );

                  return;
                }

                done = true;
                cleanup();

                resolve(blob);

              },
              'image/jpeg',
              0.88
            );

          } catch (error) {
            fail(error);
          }
        };
    }
  );
}


/* =========================================================
   VIDEO DURATION
   ========================================================= */

function getVideoDuration(file) {
  return new Promise(
    (resolve, reject) => {

      if (!file) {
        reject(
          new Error(
            'No video selected.'
          )
        );

        return;
      }

      const video =
        document.createElement('video');

      const url =
        URL.createObjectURL(file);

      video.src = url;
      video.preload = 'metadata';

      video.onloadedmetadata =
        () => {

          const seconds =
            Math.round(
              Number(video.duration) || 0
            );

          URL.revokeObjectURL(url);

          const mins =
            Math.floor(
              seconds / 60
            );

          const secs =
            seconds % 60;

          resolve(
            `${mins}:${String(secs).padStart(2, '0')}`
          );
        };

      video.onerror =
        () => {
          URL.revokeObjectURL(url);

          reject(
            new Error(
              'Could not read video duration.'
            )
          );
        };
    }
  );
}


/* =========================================================
   UPLOAD PROGRESS HELPERS
   ========================================================= */

function setUploadProgress(percent) {
  const value =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) || 0
      )
    );

  const fill =
    $('#uploadProgressFill') ||
    $('#progressFill') ||
    $('.uploadProgressFill');

  const bar =
    $('#uploadProgress') ||
    $('#progressBar') ||
    $('.uploadProgress');

  const text =
    $('#uploadProgressText') ||
    $('#progressText');

  if (fill) {
    fill.style.width =
      `${value}%`;
  }

  if (bar) {
    bar.setAttribute(
      'aria-valuenow',
      String(value)
    );
  }

  if (text) {
    text.textContent =
      `${Math.round(value)}%`;
  }
}


function setUploadStatus(message) {
  const status =
    $('#uploadStatus');

  if (status) {
    status.textContent =
      message;
  }
}


/* =========================================================
   UPLOAD PAGE
   ========================================================= */

async function uploadPage() {
  const s = getSb();
  const f = $('#uploadForm');

  if (!f || !s) {
    return;
  }

  const u =
    await currentUser();

  if (!u) {

    if ($('#uploadGate')) {
      $('#uploadGate').innerHTML = `
        <div class="notice">
          Please sign in before uploading.
        </div>
      `;
    }

    f.style.display =
      'none';

    return;
  }

  const vi =
    $('#video');

  const ti =
    $('#thumb');

  const publishButton =
    f.querySelector(
      'button[type="submit"]'
    );

  /* -------------------------------------------------------
     VIDEO INPUT
     ------------------------------------------------------- */

  if (vi) {

    vi.addEventListener(
      'change',
      () => {

        const file =
          vi.files?.[0];

        if (!file) {
          return;
        }

        if (
          !file.type.startsWith('video/')
        ) {
          vi.value = '';

          toast(
            'Please select a video file.'
          );

          return;
        }

        const previewVideo =
          $('#videoPreview');

        if (
          previewVideo &&
          previewVideo.tagName === 'VIDEO'
        ) {
          const oldUrl =
            previewVideo.dataset.objectUrl;

          if (oldUrl) {
            URL.revokeObjectURL(
              oldUrl
            );
          }

          const url =
            URL.createObjectURL(file);

          previewVideo.src =
            url;

          previewVideo.dataset.objectUrl =
            url;

          previewVideo.classList.remove(
            'hidden'
          );
        }

        const fileName =
          $('#videoFileName');

        if (fileName) {
          fileName.textContent =
            file.name;
        }

        const fileSize =
          $('#videoFileSize');

        if (fileSize) {
          fileSize.textContent =
            `${(
              file.size /
              (1024 * 1024)
            ).toFixed(1)} MB`;
        }

        const title =
          $('#title');

        const previewTitle =
          $('#previewTitle');

        if (
          previewTitle &&
          title
        ) {
          previewTitle.textContent =
            title.value.trim() ||
            'Your video title';
        }
      }
    );
  }


  /* -------------------------------------------------------
     CUSTOM THUMBNAIL
     ------------------------------------------------------- */

  if (ti) {

    ti.addEventListener(
      'change',
      () => {

        const x =
          ti.files?.[0];

        if (!x) {
          return;
        }

        if (
          !x.type.startsWith('image/')
        ) {
          ti.value = '';

          toast(
            'Please select an image thumbnail.'
          );

          return;
        }

        if ($('#preview')) {

          const oldUrl =
            $('#preview').dataset.objectUrl;

          if (oldUrl) {
            URL.revokeObjectURL(
              oldUrl
            );
          }

          const url =
            URL.createObjectURL(x);

          $('#preview').src =
            url;

          $('#preview').dataset.objectUrl =
            url;

          $('#preview').classList.remove(
            'hidden'
          );
        }
      }
    );
  }


  /* -------------------------------------------------------
     TITLE LIVE PREVIEW
     ------------------------------------------------------- */

  const titleInput =
    $('#title');

  const previewTitle =
    $('#previewTitle');

  if (
    titleInput &&
    previewTitle
  ) {
    titleInput.addEventListener(
      'input',
      () => {
        previewTitle.textContent =
          titleInput.value.trim() ||
          'Your video title';
      }
    );
  }


  /* -------------------------------------------------------
     FORM SUBMIT
     ------------------------------------------------------- */

  if (
    f.dataset.uploadHandler === 'true'
  ) {
    return;
  }

  f.dataset.uploadHandler =
    'true';

  f.onsubmit =
    async e => {

      e.preventDefault();

      if (
        f.dataset.uploading === 'true'
      ) {
        return;
      }

      const video =
        vi?.files?.[0];

      const customThumb =
        ti?.files?.[0] ||
        null;

      const title =
        $('#title')?.value.trim() ||
        '';

      const desc =
        $('#desc')?.value.trim() ||
        '';

      const category =
        $('#category')?.value ||
        '';

      /* -----------------------------------------------------
         VALIDATION
         ----------------------------------------------------- */

      if (!video || !title) {

        $('#msg').textContent =
          'Title and video are required.';

        return;
      }

      if (
        !video.type.startsWith('video/')
      ) {

        $('#msg').textContent =
          'Please select a valid video file.';

        return;
      }

      if (
        customThumb &&
        !customThumb.type.startsWith('image/')
      ) {

        $('#msg').textContent =
          'Please select a valid image thumbnail.';

        return;
      }

      /* -----------------------------------------------------
         START
         ----------------------------------------------------- */

      f.dataset.uploading =
        'true';

      if (publishButton) {
        publishButton.disabled =
          true;

        publishButton.dataset.originalText =
          publishButton.textContent;

        publishButton.textContent =
          'Publishing…';
      }

      setUploadProgress(0);

      setUploadStatus(
        'Preparing your video…'
      );

      $('#msg').textContent =
        'Preparing upload…';

      try {

        /* ---------------------------------------------------
           THUMBNAIL
           --------------------------------------------------- */

        let thumbBlob =
          customThumb;

        if (!thumbBlob) {

          $('#msg').textContent =
            'Creating thumbnail from your video…';

          setUploadStatus(
            'Creating thumbnail…'
          );

          setUploadProgress(5);

          try {

            thumbBlob =
              await extractVideoFrame(
                video
              );

          } catch (thumbError) {

            console.warn(
              'Thumbnail generation failed:',
              thumbError
            );

            /*
             * Thumbnail generation is optional.
             * The video can still be published.
             */

            thumbBlob =
              null;
          }
        }

        /* ---------------------------------------------------
           VIDEO INFORMATION
           --------------------------------------------------- */

        $('#msg').textContent =
          'Reading video information…';

        setUploadStatus(
          'Reading video information…'
        );

        setUploadProgress(10);

        let durationStr =
          '';

        try {

          durationStr =
            await getVideoDuration(
              video
            );

        } catch (durationError) {

          console.warn(
            'Duration error:',
            durationError
          );

          durationStr =
            '';
        }

        /* ---------------------------------------------------
           SAFE FILE NAME
           --------------------------------------------------- */

        const safe =
          name =>
            String(name)
              .replace(
                /[^a-zA-Z0-9._-]/g,
                '_'
              );

        const videoPath =
          `${u.id}/${crypto.randomUUID()}-${safe(video.name)}`;

        /* ---------------------------------------------------
           VIDEO UPLOAD
           --------------------------------------------------- */

        $('#msg').textContent =
          'Uploading video…';

        setUploadStatus(
          'Uploading video…'
        );

        setUploadProgress(15);

        const videoUpload =
          await s.storage
            .from('videos')
            .upload(
              videoPath,
              video,
              {
                upsert: false,
                contentType:
                  video.type ||
                  'video/mp4'
              }
            );

        if (videoUpload.error) {
          throw videoUpload.error;
        }

        setUploadProgress(70);

        const videoUrl =
          s.storage
            .from('videos')
            .getPublicUrl(
              videoPath
            )
            .data
            .publicUrl;

        /* ---------------------------------------------------
           THUMBNAIL UPLOAD
           --------------------------------------------------- */

        let thumbUrl =
          null;

        if (thumbBlob) {

          $('#msg').textContent =
            'Uploading video thumbnail…';

          setUploadStatus(
            'Uploading thumbnail…'
          );

          setUploadProgress(75);

          const thumbPath =
            `${u.id}/${crypto.randomUUID()}-thumb.jpg`;

          const thumbUpload =
            await s.storage
              .from('thumbnails')
              .upload(
                thumbPath,
                thumbBlob,
                {
                  upsert: false,
                  contentType:
                    'image/jpeg'
                }
              );

          if (
            !thumbUpload.error
          ) {

            thumbUrl =
              s.storage
                .from('thumbnails')
                .getPublicUrl(
                  thumbPath
                )
                .data
                .publicUrl;

            setUploadProgress(85);

          } else {

            console.warn(
              'Thumbnail upload failed:',
              thumbUpload.error
            );

            /*
             * Do not fail the entire video
             * upload because the thumbnail failed.
             */
          }
        }

        /* ---------------------------------------------------
           DATABASE INSERT
           --------------------------------------------------- */

        $('#msg').textContent =
          'Publishing your video…';

        setUploadStatus(
          'Publishing video…'
        );

        setUploadProgress(90);

        const result =
          await s
            .from('videos')
            .insert({
              owner_id: u.id,
              title,
              description: desc,
              category,
              video_url: videoUrl,
              thumbnail_url: thumbUrl,
              duration: durationStr
            })
            .select()
            .single();

        if (result.error) {
          throw result.error;
        }

        /* ---------------------------------------------------
           SUCCESS
           --------------------------------------------------- */

        setUploadProgress(100);

        setUploadStatus(
          'Published successfully!'
        );

        $('#msg').textContent =
          'Published!';

        toast(
          'Video published!'
        );

        setTimeout(
          () => {
            location.href =
              'watch.html?id=' +
              encodeURIComponent(
                result.data.id
              );
          },
          700
        );

      } catch (error) {

        console.error(
          'Upload error:',
          error
        );

        const message =
          error?.message ||
          'Upload failed.';

        $('#msg').textContent =
          message;

        setUploadStatus(
          'Upload failed.'
        );

        toast(
          message
        );

      } finally {

        f.dataset.uploading =
          'false';

        if (publishButton) {
          publishButton.disabled =
            false;

          publishButton.textContent =
            publishButton.dataset.originalText ||
            'Publish';
        }
      }
    };
}


/* =========================================================
   YOUTUBE WATCH PAGE
   ========================================================= */

async function youtubeWatchPage(id) {
  const player =
    $('#player');

  if (!player || !id) {
    return;
  }

  const result =
    await youtubeRequest(
      'videos',
      {
        part:
          'snippet,statistics',
        id
      }
    );

  if (
    result.error ||
    !result.data?.items?.length
  ) {
    player.innerHTML =
      youtubeErrorHtml(
        result.error ||
        'YouTube video not found.'
      );

    return;
  }

  const video =
    result.data.items[0];

  const snippet =
    video.snippet || {};

  const stats =
    video.statistics || {};

  player.innerHTML = `
    <div class="playerInner">
      <iframe
        src="https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0"
        title="${esc(snippet.title || 'YouTube video')}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  `;

  const title =
    $('#watchTitle');

  if (title) {
    title.textContent =
      snippet.title ||
      'YouTube video';
  }

  const channel =
    $('#watchChannel');

  if (channel) {
    channel.textContent =
      snippet.channelTitle ||
      '';
  }

  const views =
    $('#watchViews');

  if (views) {
    views.textContent =
      `${formatYouTubeCount(
        stats.viewCount
      )} views`;
  }

  const desc =
    $('#watchDescription');

  if (desc) {
    desc.textContent =
      snippet.description ||
      '';
  }
}


/* =========================================================
   RELATED YOUTUBE VIDEOS
   ========================================================= */

async function loadYouTubeRelated(
  container,
  query
) {
  if (!container) {
    return;
  }

  await loadYouTubeSearch(
    container,
    query || 'DivineTube'
  );
}


/* =========================================================
   LOCAL WATCH PAGE
   ========================================================= */

async function localWatchPage(id) {
  const s = getSb();

  if (!s || !id) {
    return;
  }

  const player =
    $('#player');

  if (player) {
    player.innerHTML =
      loading('Loading video…');
  }

  const {
    data: video,
    error
  } =
    await s
      .from('videos')
      .select(
        `
          *,
          profiles(
            username,
            avatar_url
          )
        `
      )
      .eq('id', id)
      .maybeSingle();

  if (error) {
    console.error(
      'Load video error:',
      error
    );

    if (player) {
      player.innerHTML =
        `
          <div class="notice">
            ${esc(error.message)}
          </div>
        `;
    }

    return;
  }

  if (!video) {
    if (player) {
      player.innerHTML =
        `
          <div class="notice">
            Video not found.
          </div>
        `;
    }

    return;
  }

  /* -------------------------------------------------------
     PLAYER
     ------------------------------------------------------- */

  if (player) {

    player.innerHTML = `
      <div class="playerInner">

        <video
          id="mainVideo"
          controls
          playsinline
          preload="metadata"
          ${
            video.thumbnail_url
              ? `poster="${esc(video.thumbnail_url)}"`
              : ''
          }
        >
          <source
            src="${esc(video.video_url)}"
            type="video/mp4"
          >

          Your browser does not support video playback.
        </video>

      </div>
    `;
  }

  const mainVideo =
    $('#mainVideo');

  /* -------------------------------------------------------
     RESUME POSITION
     ------------------------------------------------------- */

  const resumeKey =
    `dt_resume_${id}`;

  if (mainVideo) {

    const saved =
      Number(
        localStorage.getItem(
          resumeKey
        ) || 0
      );

    if (
      Number.isFinite(saved) &&
      saved > 3
    ) {
      mainVideo.addEventListener(
        'loadedmetadata',
        () => {

          try {

            if (
              saved <
              mainVideo.duration - 5
            ) {
              mainVideo.currentTime =
                saved;
            }

          } catch (_) {}
        },
        {
          once: true
        }
      );
    }

    let saveTimer;

    mainVideo.addEventListener(
      'timeupdate',
      () => {

        clearTimeout(
          saveTimer
        );

        saveTimer =
          setTimeout(
            () => {
              try {
                localStorage.setItem(
                  resumeKey,
                  String(
                    Math.floor(
                      mainVideo.currentTime
                    )
                  )
                );
              } catch (_) {}
            },
            500
          );
      }
    );

    mainVideo.addEventListener(
      'ended',
      () => {
        localStorage.removeItem(
          resumeKey
        );
      }
    );
  }

  /* -------------------------------------------------------
     VIEW COUNT
     ------------------------------------------------------- */

  let counted =
    false;

  async function countView() {

    if (counted) {
      return;
    }

    counted = true;

    try {

      const {
        error
      } =
        await s.rpc(
          'increment_view',
          {
            video_id:
              id
          }
        );

      if (error) {
        console.warn(
          'View count RPC:',
          error
        );
      }

    } catch (error) {
      console.warn(
        'View count error:',
        error
      );
    }
  }

  if (mainVideo) {
    mainVideo.addEventListener(
      'play',
      countView,
      {
        once: true
      }
    );
  }

  /* -------------------------------------------------------
     HISTORY
     ------------------------------------------------------- */

  const user =
    await currentUser();

  if (user) {
    await recordHistory(
      user.id,
      id
    );
  }

  /* -------------------------------------------------------
     TITLE
     ------------------------------------------------------- */

  const title =
    $('#watchTitle');

  if (title) {
    title.textContent =
      video.title ||
      'Untitled video';
  }

  /* -------------------------------------------------------
     CHANNEL
     ------------------------------------------------------- */

  const username =
    video.profiles?.username ||
    'DivineTube';

  const channel =
    $('#watchChannel');

  if (channel) {
    channel.textContent =
      username;
  }

  /* -------------------------------------------------------
     VIEWS
     ------------------------------------------------------- */

  const views =
    $('#watchViews');

  if (views) {
    views.textContent =
      `${fmt(video.views || 0)} views`;
  }

  /* -------------------------------------------------------
     DESCRIPTION
     ------------------------------------------------------- */

  const description =
    $('#watchDescription');

  if (description) {
    description.textContent =
      video.description ||
      '';
  }

  /* -------------------------------------------------------
     LIKE
     ------------------------------------------------------- */

  const likeBtn =
    $('#likeBtn');

  const likeCount =
    $('#likeCount');

  if (likeBtn) {

    likeBtn.onclick =
      async () => {

        if (!user) {
          toast(
            'Please sign in to like videos.'
          );

          return;
        }

        await updateLike(
          id,
          user.id,
          likeBtn,
          likeCount
        );
      };
  }

  /* -------------------------------------------------------
     SAVE
     ------------------------------------------------------- */

  const saveBtn =
    $('#saveBtn');

  if (saveBtn) {

    saveBtn.onclick =
      async () => {

        if (!user) {
          toast(
            'Please sign in to save videos.'
          );

          return;
        }

        await updateSave(
          id,
          user.id,
          saveBtn
        );
      };
  }

  /* -------------------------------------------------------
     COMMENTS
     ------------------------------------------------------- */

  await loadComments(
    id
  );

  const commentForm =
    $('#commentForm');

  if (
    commentForm &&
    user
  ) {

    commentForm.onsubmit =
      async e => {

        e.preventDefault();

        const input =
          $('#commentInput');

        const content =
          input?.value.trim() ||
          '';

        if (!content) {
          return;
        }

        const {
          error
        } =
          await s
            .from('comments')
            .insert({
              video_id: id,
              user_id: user.id,
              content
            });

        if (error) {
          toast(
            error.message ||
            'Could not post comment.'
          );

          return;
        }

        if (input) {
          input.value = '';
        }

        await loadComments(
          id
        );

        toast(
          'Comment posted.'
        );
      };
  }

  /* -------------------------------------------------------
     SUBSCRIBE
     ------------------------------------------------------- */

  const subscribeBtn =
    $('#subscribeBtn');

  if (
    subscribeBtn &&
    user
  ) {

    subscribeBtn.onclick =
      async () => {

        await subscribe(
          user.id,
          video.owner_id,
          subscribeBtn
        );
      };
  }

  /* -------------------------------------------------------
     SHARE
     ------------------------------------------------------- */

  const shareBtn =
    $('#shareBtn');

  if (shareBtn) {

    shareBtn.onclick =
      async () => {

        const url =
          location.href;

        try {

          if (
            navigator.share
          ) {
            await navigator.share({
              title:
                video.title,
              url
            });

          } else if (
            navigator.clipboard
          ) {
            await navigator.clipboard.writeText(
              url
            );

            toast(
              'Video link copied.'
            );
          }

        } catch (error) {
          console.warn(
            'Share cancelled:',
            error
          );
        }
      };
  }

  /* -------------------------------------------------------
     RELATED VIDEOS
     ------------------------------------------------------- */

  const related =
    $('#relatedVideos');

  if (related) {

    await loadVideos(
      related,
      {
        category:
          video.category ||
          '',
        youtube: true
      }
    );
  }
}


/* =========================================================
   WATCH ROUTER
   ========================================================= */

async function watchPage() {
  const params =
    new URLSearchParams(
      location.search
    );

  const localId =
    params.get('id');

  const ytId =
    params.get('yt');

  if (localId) {
    await localWatchPage(
      localId
    );

    return;
  }

  if (ytId) {
    await youtubeWatchPage(
      ytId
    );

    return;
  }
}


/* =========================================================
   HISTORY
   ========================================================= */

async function recordHistory(
  userId,
  videoId
) {
  const s = getSb();

  if (!s || !userId || !videoId) {
    return;
  }

  try {

    const {
      error
    } =
      await s
        .from('history')
        .upsert(
          {
            user_id:
              userId,
            video_id:
              videoId,
            watched_at:
              new Date().toISOString()
          },
          {
            onConflict:
              'user_id,video_id'
          }
        );

    if (error) {
      console.warn(
        'History error:',
        error
      );
    }

  } catch (error) {
    console.warn(
      'History error:',
      error
    );
  }
}


/* =========================================================
   LIKE
   ========================================================= */

async function updateLike(
  videoId,
  userId,
  button,
  countEl
) {
  const s = getSb();

  if (!s) {
    return;
  }

  try {

    const {
      data: existing,
      error: checkError
    } =
      await s
        .from('likes')
        .select('id')
        .eq(
          'video_id',
          videoId
        )
        .eq(
          'user_id',
          userId
        )
        .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {

      const {
        error
      } =
        await s
          .from('likes')
          .delete()
          .eq(
            'id',
            existing.id
          );

      if (error) {
        throw error;
      }

      if (button) {
        button.classList.remove(
          'active'
        );
      }

      if (countEl) {
        const current =
          Number(
            countEl.dataset.count ||
            countEl.textContent ||
            0
          );

        countEl.dataset.count =
          String(
            Math.max(
              0,
              current - 1
            )
          );

        countEl.textContent =
          fmt(
            Math.max(
              0,
              current - 1
            )
          );
      }

    } else {

      const {
        error
      } =
        await s
          .from('likes')
          .insert({
            video_id:
              videoId,
            user_id:
              userId
          });

      if (error) {
        throw error;
      }

      if (button) {
        button.classList.add(
          'active'
        );
      }

      if (countEl) {
        const current =
          Number(
            countEl.dataset.count ||
            countEl.textContent ||
            0
          );

        countEl.dataset.count =
          String(
            current + 1
          );

        countEl.textContent =
          fmt(
            current + 1
          );
      }
    }

  } catch (error) {

    console.error(
      'Like error:',
      error
    );

    toast(
      error.message ||
      'Could not update like.'
    );
  }
}


/* =========================================================
   SAVE
   ========================================================= */

async function updateSave(
  videoId,
  userId,
  button
) {
  const s = getSb();

  if (!s) {
    return;
  }

  try {

    const {
      data: existing,
      error: checkError
    } =
      await s
        .from('saved_videos')
        .select('id')
        .eq(
          'video_id',
          videoId
        )
        .eq(
          'user_id',
          userId
        )
        .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {

      const {
        error
      } =
        await s
          .from('saved_videos')
          .delete()
          .eq(
            'id',
            existing.id
          );

      if (error) {
        throw error;
      }

      button.classList.remove(
        'active'
      );

      button.textContent =
        'Save';

      toast(
        'Removed from saved videos.'
      );

    } else {

      const {
        error
      } =
        await s
          .from('saved_videos')
          .insert({
            video_id:
              videoId,
            user_id:
              userId
          });

      if (error) {
        throw error;
      }

      button.classList.add(
        'active'
      );

      button.textContent =
        'Saved';

      toast(
        'Video saved.'
      );
    }

  } catch (error) {

    console.error(
      'Save error:',
      error
    );

    toast(
      error.message ||
      'Could not save video.'
    );
  }
}


/* =========================================================
   COMMENTS
   ========================================================= */

async function loadComments(
  videoId
) {
  const s = getSb();

  const container =
    $('#comments');

  if (!container || !s) {
    return;
  }

  container.innerHTML =
    loading('Loading comments…');

  try {

    const {
      data,
      error
    } =
      await s
        .from('comments')
        .select(
          'content,created_at,profiles(username)'
        )
        .eq(
          'video_id',
          videoId
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    if (!data?.length) {
      container.innerHTML =
        `
          <div class="notice">
            No comments yet.
          </div>
        `;

      return;
    }

    container.innerHTML =
      data
        .map(comment => {

          const username =
            comment.profiles?.username ||
            'User';

          return `
            <div class="comment">

              <div class="commentAvatar">
                ${esc(
                  username
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>

              <div class="commentBody">

                <strong>
                  ${esc(username)}
                </strong>

                <span class="commentDate">
                  ${esc(
                    date(
                      comment.created_at
                    )
                  )}
                </span>

                <p>
                  ${esc(
                    comment.content
                  )}
                </p>

              </div>

            </div>
          `;
        })
        .join('');

  } catch (error) {

    console.error(
      'Comments error:',
      error
    );

    container.innerHTML =
      `
        <div class="notice">
          ${esc(
            error.message ||
            'Could not load comments.'
          )}
        </div>
      `;
  }
}


/* =========================================================
   SUBSCRIBE
   ========================================================= */

async function subscribe(
  userId,
  channelId,
  button
) {
  const s = getSb();

  if (!s) {
    return;
  }

  if (
    !userId ||
    !channelId
  ) {
    return;
  }

  if (
    userId === channelId
  ) {
    toast(
      'You cannot subscribe to yourself.'
    );

    return;
  }

  try {

    const {
      data: existing,
      error: checkError
    } =
      await s
        .from('subscriptions')
        .select('id')
        .eq(
          'subscriber_id',
          userId
        )
        .eq(
          'channel_id',
          channelId
        )
        .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {

      const {
        error
      } =
        await s
          .from('subscriptions')
          .delete()
          .eq(
            'id',
            existing.id
          );

      if (error) {
        throw error;
      }

      if (button) {
        button.textContent =
          'Subscribe';

        button.classList.remove(
          'subscribed'
        );
      }

      toast(
        'Unsubscribed.'
      );

    } else {

      const {
        error
      } =
        await s
          .from('subscriptions')
          .insert({
            subscriber_id:
              userId,
            channel_id:
              channelId
          });

      if (error) {
        throw error;
      }

      if (button) {
        button.textContent =
          'Subscribed';

        button.classList.add(
          'subscribed'
        );
      }

      toast(
        'Subscribed.'
      );
    }

  } catch (error) {

    console.error(
      'Subscribe error:',
      error
    );

    toast(
      error.message ||
      'Could not update subscription.'
    );
  }
}


/* =========================================================
   TRENDING
   ========================================================= */

async function loadTrending() {
  const container =
    $('#trendingVideos');

  if (!container) {
    return;
  }

  await loadVideos(
    container,
    {
      youtube: true
    }
  );
}


/* =========================================================
   CHANNEL PAGE
   ========================================================= */

async function channelPage() {
  const container =
    $('#channelVideos');

  if (!container) {
    return;
  }

  const params =
    new URLSearchParams(
      location.search
    );

  const channelId =
    params.get('id');

  if (!channelId) {
    container.innerHTML =
      `
        <div class="notice">
          Channel not found.
        </div>
      `;

    return;
  }

  const s = getSb();

  if (!s) {
    return;
  }

  try {

    const {
      data: profile,
      error
    } =
      await s
        .from('profiles')
        .select(
          'id,username,avatar_url'
        )
        .eq(
          'id',
          channelId
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (profile) {

      const name =
        $('#channelName');

      if (name) {
        name.textContent =
          profile.username ||
          'Channel';
      }

      const avatarEl =
        $('#channelAvatar');

      if (avatarEl) {

        if (profile.avatar_url) {
          avatarEl.innerHTML =
            `
              <img
                src="${esc(
                  profile.avatar_url
                )}"
                alt=""
              >
            `;
        } else {
          avatarEl.textContent =
            String(
              profile.username ||
              'U'
            )
              .slice(0, 2)
              .toUpperCase();
        }
      }
    }

    const {
      data: videos,
      error: videosError
    } =
      await s
        .from('videos')
        .select(
          `
            *,
            profiles(username,avatar_url)
          `
        )
        .eq(
          'owner_id',
          channelId
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );

    if (videosError) {
      throw videosError;
    }

    if (!videos?.length) {

      container.innerHTML =
        `
          <div class="notice">
            This channel has no videos yet.
          </div>
        `;

      return;
    }

    container.innerHTML =
      videos
        .map(card)
        .join('');

  } catch (error) {

    console.error(
      'Channel error:',
      error
    );

    container.innerHTML =
      `
        <div class="notice">
          ${esc(
            error.message ||
            'Could not load channel.'
          )}
        </div>
      `;
  }
}


/* =========================================================
   SUBSCRIPTIONS PAGE
   ========================================================= */

async function subscriptionsPage() {
  const container =
    $('#subscriptionVideos');

  if (!container) {
    return;
  }

  const s = getSb();
  const user =
    await currentUser();

  if (!user) {
    container.innerHTML =
      `
        <div class="notice">
          Please sign in to view your subscriptions.
        </div>
      `;

    return;
  }

  if (!s) {
    return;
  }

  try {

    const {
      data: subscriptions,
      error
    } =
      await s
        .from('subscriptions')
        .select(
          'channel_id'
        )
        .eq(
          'subscriber_id',
          user.id
        );

    if (error) {
      throw error;
    }

    const ids =
      (subscriptions || [])
        .map(x => x.channel_id)
        .filter(Boolean);

    if (!ids.length) {

      container.innerHTML =
        `
          <div class="notice">
            You are not subscribed to any channels yet.
          </div>
        `;

      return;
    }

    const {
      data: videos,
      error: videoError
    } =
      await s
        .from('videos')
        .select(
          `
            *,
            profiles(username,avatar_url)
          `
        )
        .in(
          'owner_id',
          ids
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );

    if (videoError) {
      throw videoError;
    }

    if (!videos?.length) {

      container.innerHTML =
        `
          <div class="notice">
            Your subscribed channels have no videos yet.
          </div>
        `;

      return;
    }

    container.innerHTML =
      videos
        .map(card)
        .join('');

  } catch (error) {

    console.error(
      'Subscriptions error:',
      error
    );

    container.innerHTML =
      `
        <div class="notice">
          ${esc(
            error.message ||
            'Could not load subscriptions.'
          )}
        </div>
      `;
  }
}


/* =========================================================
   LIBRARY PAGE
   ========================================================= */

async function libraryPage() {
  const container =
    $('#libraryVideos');

  if (!container) {
    return;
  }

  const s = getSb();
  const user =
    await currentUser();

  if (!user) {

    container.innerHTML =
      `
        <div class="notice">
          Please sign in to view your library.
        </div>
      `;

    return;
  }

  if (!s) {
    return;
  }

  try {

    const {
      data: saved,
      error
    } =
      await s
        .from('saved_videos')
        .select(
          'video_id'
        )
        .eq(
          'user_id',
          user.id
        );

    if (error) {
      throw error;
    }

    const ids =
      (saved || [])
        .map(x => x.video_id)
        .filter(Boolean);

    if (!ids.length) {

      container.innerHTML =
        `
          <div class="notice">
            You have no saved videos yet.
          </div>
        `;

      return;
    }

    const {
      data: videos,
      error: videoError
    } =
      await s
        .from('videos')
        .select(
          `
            *,
            profiles(username,avatar_url)
          `
        )
        .in(
          'id',
          ids
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );

    if (videoError) {
      throw videoError;
    }

    container.innerHTML =
      (videos || [])
        .map(card)
        .join('');

  } catch (error) {

    console.error(
      'Library error:',
      error
    );

    container.innerHTML =
      `
        <div class="notice">
          ${esc(
            error.message ||
            'Could not load library.'
          )}
        </div>
      `;
  }
}


/* =========================================================
   HISTORY PAGE
   ========================================================= */

async function historyPage() {
  const container =
    $('#historyVideos');

  if (!container) {
    return;
  }

  const s = getSb();
  const user =
    await currentUser();

  if (!user) {

    container.innerHTML =
      `
        <div class="notice">
          Please sign in to view your history.
        </div>
      `;

    return;
  }

  if (!s) {
    return;
  }

  try {

    const {
      data: history,
      error
    } =
      await s
        .from('history')
        .select(
          'video_id,watched_at'
        )
        .eq(
          'user_id',
          user.id
        )
        .order(
          'watched_at',
          {
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    const ids =
      (history || [])
        .map(x => x.video_id)
        .filter(Boolean);

    if (!ids.length) {

      container.innerHTML =
        `
          <div class="notice">
            No watch history yet.
          </div>
        `;

      return;
    }

    const {
      data: videos,
      error: videoError
    } =
      await s
        .from('videos')
        .select(
          `
            *,
            profiles(username,avatar_url)
          `
        )
        .in(
          'id',
          ids
        );

    if (videoError) {
      throw videoError;
    }

    const byId =
      new Map(
        (videos || [])
          .map(v => [
            String(v.id),
            v
          ])
      );

    const ordered =
      ids
        .map(id =>
          byId.get(
            String(id)
          )
        )
        .filter(Boolean);

    container.innerHTML =
      ordered
        .map(card)
        .join('');

  } catch (error) {

    console.error(
      'History error:',
      error
    );

    container.innerHTML =
      `
        <div class="notice">
          ${esc(
            error.message ||
            'Could not load history.'
          )}
        </div>
      `;
  }
}


/* =========================================================
   STUDIO PAGE
   ========================================================= */

async function studioPage() {
  const container =
    $('#studioVideos');

  if (!container) {
    return;
  }

  const s = getSb();
  const user =
    await currentUser();

  if (!user) {

    container.innerHTML =
      `
        <div class="notice">
          Please sign in to use Studio.
        </div>
      `;

    return;
  }

  if (!s) {
    return;
  }

  try {

    const {
      data: videos,
      error
    } =
      await s
        .from('videos')
        .select(
          `
            *,
            profiles(username,avatar_url)
          `
        )
        .eq(
          'owner_id',
          user.id
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    if (!videos?.length) {

      container.innerHTML =
        `
          <div class="notice">
            You have not published any videos yet.
          </div>
        `;

      return;
    }

    container.innerHTML =
      videos
        .map(card)
        .join('');

  } catch (error) {

    console.error(
      'Studio error:',
      error
    );

    container.innerHTML =
      `
        <div class="notice">
          ${esc(
            error.message ||
            'Could not load Studio.'
          )}
        </div>
      `;
  }
}


/* =========================================================
   CHIPS / CATEGORY FILTERS
   ========================================================= */

function initChips() {
  const chips =
    document.querySelectorAll(
      '[data-category]'
    );

  if (!chips.length) {
    return;
  }

  chips.forEach(
    chip => {

      chip.addEventListener(
        'click',
        async () => {

          chips.forEach(
            x =>
              x.classList.remove(
                'active'
              )
          );

          chip.classList.add(
            'active'
          );

          const category =
            chip.dataset.category ||
            '';

          const container =
            $('#videos') ||
            $('#videoGrid') ||
            $('#homeVideos');

          if (!container) {
            return;
          }

          await loadVideos(
            container,
            {
              category,
              youtube: true
            }
          );
        }
      );
    }
  );
}


/* =========================================================
   SEARCH
   ========================================================= */

function searchGo() {
  const input =
    $('#searchInput');

  const button =
    $('#searchBtn');

  if (!input) {
    return;
  }

  async function go() {

    const q =
      input.value.trim();

    if (!q) {
      return;
    }

    const container =
      $('#searchResults') ||
      $('#videos') ||
      $('#videoGrid');

    if (
      container &&
      location.pathname.endsWith(
        'search.html'
      )
    ) {

      const params =
        new URLSearchParams(
          location.search
        );

      params.set(
        'q',
        q
      );

      history.replaceState(
        null,
        '',
        `search.html?${params}`
      );

      await loadVideos(
        container,
        {
          title: q,
          youtube: true
        }
      );

      return;
    }

    location.href =
      `search.html?q=${encodeURIComponent(q)}`;
  }

  input.addEventListener(
    'keydown',
    e => {

      if (
        e.key === 'Enter'
      ) {
        e.preventDefault();
        go();
      }
    }
  );

  if (button) {
    button.addEventListener(
      'click',
      e => {
        e.preventDefault();
        go();
      }
    );
  }

  const form =
    input.closest('form');

  if (form) {
    form.addEventListener(
      'submit',
      e => {
        e.preventDefault();
        go();
      }
    );
  }
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function initMobileMenu() {
  const button =
    $('#menuBtn') ||
    $('#mobileMenuBtn');

  const menu =
    $('#mobileMenu') ||
    $('.mobileMenu');

  if (!button || !menu) {
    return;
  }

  button.addEventListener(
    'click',
    () => {

      menu.classList.toggle(
        'open'
      );

      button.setAttribute(
        'aria-expanded',
        menu.classList.contains(
          'open'
        )
          ? 'true'
          : 'false'
      );
    }
  );

  menu
    .querySelectorAll('a')
    .forEach(
      link => {

        link.addEventListener(
          'click',
          () => {
            menu.classList.remove(
              'open'
            );
          }
        );
      }
    );
}


/* =========================================================
   INIT
   ========================================================= */

async function init() {

  try {
    await header();
  } catch (error) {
    console.error(
      'Header init error:',
      error
    );
  }

  initMobileMenu();

  searchGo();

  initChips();

  const themeBtn =
    $('#themeBtn') ||
    $('#themeToggle');

  if (themeBtn) {
    themeBtn.addEventListener(
      'click',
      toggleTheme
    );
  }

  try {
    await authPage();
  } catch (error) {
    console.error(
      'Auth page init error:',
      error
    );
  }

  try {
    await uploadPage();
  } catch (error) {
    console.error(
      'Upload page init error:',
      error
    );
  }

  try {
    await watchPage();
  } catch (error) {
    console.error(
      'Watch page init error:',
      error
    );
  }

  try {
    await channelPage();
  } catch (error) {
    console.error(
      'Channel page init error:',
      error
    );
  }

  try {
    await subscriptionsPage();
  } catch (error) {
    console.error(
      'Subscriptions page init error:',
      error
    );
  }

  try {
    await libraryPage();
  } catch (error) {
    console.error(
      'Library page init error:',
      error
    );
  }

  try {
    await historyPage();
  } catch (error) {
    console.error(
      'History page init error:',
      error
    );
  }

  try {
    await studioPage();
  } catch (error) {
    console.error(
      'Studio page init error:',
      error
    );
  }

  /* -------------------------------------------------------
     HOME
     ------------------------------------------------------- */

  const homeVideos =
    $('#homeVideos') ||
    $('#videos') ||
    (
      location.pathname.endsWith(
        'index.html'
      )
        ? $('#videoGrid')
        : null
    );

  if (homeVideos) {

    await loadVideos(
      homeVideos,
      {
        youtube: true
      }
    );
  }

  /* -------------------------------------------------------
     SEARCH PAGE
     ------------------------------------------------------- */

  const searchResults =
    $('#searchResults');

  if (searchResults) {

    const params =
      new URLSearchParams(
        location.search
      );

    const q =
      params.get('q') ||
      '';

    const input =
      $('#searchInput');

    if (
      input &&
      q
    ) {
      input.value =
        q;
    }

    await loadVideos(
      searchResults,
      {
        title: q,
        youtube: true
      }
    );
  }

  /* -------------------------------------------------------
     TRENDING
     ------------------------------------------------------- */

  if (
    $('#trendingVideos')
  ) {
    await loadTrending();
  }
}


/* =========================================================
   DOM READY
   ========================================================= */

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    init
  );

} else {

  init();
}


/* =========================================================
   MINI PLAYER
   ========================================================= */

(function initMiniPlayer() {

  let mini =
    $('#divineMiniPlayer');

  let lastScroll =
    window.scrollY;

  let ticking = false;

  function update() {

    ticking = false;

    const current =
      window.scrollY;

    const player =
      document.querySelector(
        '.playerInner'
      );

    if (!player) {
      return;
    }

    const rect =
      player.getBoundingClientRect();

    if (
      rect.bottom < 0 &&
      current > lastScroll
    ) {

      if (!mini) {

        mini =
          document.createElement(
            'div'
          );

        mini.id =
          'divineMiniPlayer';

        mini.style.position =
          'fixed';

        mini.style.right =
          '16px';

        mini.style.bottom =
          '16px';

        mini.style.width =
          '320px';

        mini.style.maxWidth =
          'calc(100vw - 32px)';

        mini.style.zIndex =
          '9998';

        mini.style.background =
          '#000';

        mini.style.borderRadius =
          '12px';

        mini.style.overflow =
          'hidden';

        mini.style.boxShadow =
          '0 10px 40px rgba(0,0,0,.35)';

        document.body.appendChild(
          mini
        );

        const clone =
          player.cloneNode(
            true
          );

        mini.appendChild(
          clone
        );
      }

      mini.style.display =
        'block';

    } else {

      if (mini) {
        mini.style.display =
          'none';
      }
    }

    lastScroll =
      current;
  }

  window.addEventListener(
    'scroll',
    () => {

      if (!ticking) {

        ticking = true;

        requestAnimationFrame(
          update
        );
      }
    },
    {
      passive: true
    }
  );

})();
