/* =========================================
   SUPABASE CLIENT & UTILITIES
========================================= */

function getSb() {
  if (
    !window.supabaseClient &&
    window.supabase &&
    window.DIVINETUBE_CONFIG?.SUPABASE_URL
  ) {
    window.supabaseClient = window.supabase.createClient(
      window.DIVINETUBE_CONFIG.SUPABASE_URL,
      window.DIVINETUBE_CONFIG.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }
  return window.supabaseClient;
}

const $ = s => document.querySelector(s);

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));

const fmt = n => Number(n || 0).toLocaleString();

const date = n =>
  new Date(n).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

async function currentUser() {
  const s = getSb();
  if (!s) return null;

  try {
    return (await s.auth.getUser()).data.user;
  } catch {
    return null;
  }
}

function initials(u) {
  return (
    u?.user_metadata?.username ||
    u?.email?.split('@')[0] ||
    'D'
  ).slice(0, 1).toUpperCase();
}

function toggleTheme() {
  document.body.classList.toggle('light');
  localStorage.dt_theme = document.body.classList.contains('light')
    ? 'light'
    : 'dark';
}

function toast(m) {
  const t = $('#toast');
  if (t) {
    t.textContent = m;
    t.classList.add('show');
    setTimeout(() => {
      t.classList.remove('show');
    }, 2200);
  }
}

function avatar(n = 'D') {
  return `<div class="mini">${esc(n[0]?.toUpperCase() || 'D')}</div>`;
}

function loading(e) {
  e.innerHTML = `
    <div class="skeletonGrid">
      ${Array.from({ length: 8 }, () => '<div class="skeleton"></div>').join('')}
    </div>
  `;
}

/* =========================================
   VIDEO CARD
========================================= */

function card(v) {
  const n = v.profiles?.username || 'Creator';

  return `
    <article class="card">
      <a href="watch.html?id=${encodeURIComponent(v.id)}">
        <div class="thumb">
          ${
            v.thumbnail_url
              ? `<img loading="lazy" src="${esc(v.thumbnail_url)}" alt="${esc(v.title)}">`
              : `<div class="thumbFallback">▶</div>`
          }
          ${
            v.duration
              ? `<span class="duration">${esc(v.duration)}</span>`
              : ''
          }
        </div>
        <div class="meta">
          ${avatar(n)}
          <div>
            <div class="title">${esc(v.title)}</div>
            <div class="muted">${esc(n)}</div>
            <div class="muted">
              ${fmt(v.views)} views • ${date(v.created_at)}
            </div>
          </div>
        </div>
      </a>
    </article>
  `;
}

/* =========================================
   HEADER
========================================= */

async function header() {
  const s = getSb();
  const u = await currentUser();

  if ($('#avatar')) {
    $('#avatar').textContent = initials(u);
  }

  const l = $('#authLink');

  if (l) {
    l.textContent = u ? 'Sign out' : 'Sign in';
    l.onclick = async () => {
      if (u && s) {
        await s.auth.signOut();
        location.href = 'index.html';
      } else {
        location.href = 'auth.html';
      }
    };
  }

  if (localStorage.dt_theme === 'light') {
    document.body.classList.add('light');
  }
}

/* =========================================
   LOAD VIDEOS
========================================= */

async function loadVideos(
  target = '#videoGrid',
  query = '',
  limit = 40,
  category = ''
) {
  const s = getSb();
  const e = $(target);

  if (!e || !s) return;

  loading(e);

  let q = s
    .from('videos')
    .select('*,profiles(username)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (query) {
    q = q.ilike('title', `%${query}%`);
  }

  if (category) {
    q = q.eq('category', category);
  }

  const { data, error } = await q;

  if (error) {
    e.innerHTML = `
      <div class="notice">
        Supabase error: ${esc(error.message)}
      </div>
    `;
    return;
  }

  e.innerHTML =
    (data || []).map(card).join('') ||
    `<div class="notice">No videos found.</div>`;
}

/* =========================================
   AUTH
========================================= */

async function authPage() {
  const s = getSb();
  const f = $('#authForm');

  if (!f || !s) return;

  f.onsubmit = async e => {
    e.preventDefault();

    const signup = $('#signup')?.checked;
    const email = $('#email').value.trim();
    const password = $('#password').value;
    const user = $('#username')?.value.trim();

    $('#msg').textContent = 'Please wait…';

    const r = signup
      ? await s.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: user || email.split('@')[0]
            }
          }
        })
      : await s.auth.signInWithPassword({
          email,
          password
        });

    if (r.error) {
      $('#msg').textContent = r.error.message;
    } else if (signup && !r.data.session) {
      $('#msg').textContent =
        'Account created. Check your email if confirmation is enabled.';
    } else {
      location.href = 'index.html';
    }
  };
}

/* =========================================
   CREATE THUMBNAIL FROM VIDEO
========================================= */

function extractVideoFrame(file) {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    let finished = false;

    function finish(result) {
      if (finished) return;
      finished = true;

      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();

      resolve(result);
    }

    video.onloadedmetadata = () => {
      if (
        !video.duration ||
        !video.videoWidth ||
        !video.videoHeight
      ) {
        finish(null);
        return;
      }

      const wantedTime = video.duration * 0.15;
      const safeTime = Math.min(
        Math.max(wantedTime, 0.1),
        Math.max(video.duration - 0.1, 0.1)
      );

      video.currentTime = safeTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          blob => {
            finish(blob);
          },
          'image/jpeg',
          0.88
        );
      } catch (error) {
        console.error('Thumbnail generation error:', error);
        finish(null);
      }
    };

    video.onerror = () => {
      console.error('Could not read video.');
      finish(null);
    };
  });
}

/* =========================================
   VIDEO DURATION
========================================= */

function getVideoDuration(file) {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.preload = 'metadata';
    video.src = url;

    video.onloadedmetadata = () => {
      const total = Math.max(0, Math.floor(video.duration));
      const min = Math.floor(total / 60);
      const sec = total % 60;

      URL.revokeObjectURL(url);
      resolve(`${min}:${sec < 10 ? '0' : ''}${sec}`);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
  });
}

/* =========================================
   GET VIDEO FROM DIRECT URL
========================================= */

async function getVideoFromUrl(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not fetch video (${response.status})`);
  }

  const type = response.headers.get('content-type') || '';

  if (!type.startsWith('video/')) {
    throw new Error('That link is not a direct video file.');
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error('The video file is empty.');
  }

  return blob;
}

/* =========================================
   UPLOAD PAGE
========================================= */

async function uploadPage() {
  const s = getSb();
  const f = $('#uploadForm');

  if (!f || !s) return;

  const u = await currentUser();

  if (!u) {
    if ($('#uploadGate')) {
      $('#uploadGate').innerHTML = `
        <div class="notice">
          Please sign in before uploading.
        </div>
      `;
    }
    f.style.display = 'none';
    return;
  }

  const vi = $('#video');
  const urlInput = $('#videoUrl');
  const ti = $('#thumb');

  ti?.addEventListener('change', () => {
    const file = ti.files?.[0];
    if (file && $('#preview')) {
      $('#preview').src = URL.createObjectURL(file);
      $('#preview').classList.remove('hidden');
    }
  });

  vi?.addEventListener('change', () => {
    if (vi.files?.length && urlInput) {
      urlInput.value = '';
    }
  });

  urlInput?.addEventListener('input', () => {
    if (urlInput.value.trim() && vi) {
      vi.value = '';
    }
  });

  f.onsubmit = async e => {
    e.preventDefault();

    const videoFile = vi?.files?.[0] || null;
    const externalUrl = urlInput?.value.trim() || '';
    const customThumb = ti?.files?.[0] || null;
    const title = $('#title').value.trim();
    const desc = $('#desc')?.value.trim() || '';
    const category = $('#category')?.value || 'General';

    if (!title) {
      $('#msg').textContent = 'Title is required.';
      return;
    }

    if (!videoFile && !externalUrl) {
      $('#msg').textContent = 'Choose a video file or paste a direct video URL.';
      return;
    }

    let fileToUpload = videoFile;

    if (!videoFile && externalUrl) {
      $('#msg').textContent = 'Getting video from URL…';
      try {
        fileToUpload = await getVideoFromUrl(externalUrl);
      } catch (error) {
        $('#msg').textContent = error.message;
        return;
      }
    }

    let thumbBlob = customThumb;
    if (!thumbBlob) {
      $('#msg').textContent = 'Creating thumbnail from video…';
      thumbBlob = await extractVideoFrame(fileToUpload);
    }

    $('#msg').textContent = 'Reading video information…';
    const duration = await getVideoDuration(fileToUpload);

    let filename = videoFile?.name || 'external-video.mp4';
    if (!videoFile && externalUrl) {
      try {
        const pathname = new URL(externalUrl).pathname;
        const name = pathname.split('/').pop();
        if (name) filename = name;
      } catch {}
    }

    const safe = name => name.replace(/[^a-zA-Z0-9._-]/g, '_');

    $('#msg').textContent = 'Uploading video…';
    const videoPath = `${u.id}/${crypto.randomUUID()}-${safe(filename)}`;

    let r = await s.storage.from('videos').upload(videoPath, fileToUpload, {
      upsert: false,
      contentType: fileToUpload.type || 'video/mp4'
    });

    if (r.error) {
      console.error(r.error);
      $('#msg').textContent = r.error.message;
      return;
    }

    const videoUrl = s.storage.from('videos').getPublicUrl(videoPath).data.publicUrl;

    let thumbnailUrl = null;
    if (thumbBlob) {
      $('#msg').textContent = 'Uploading thumbnail…';
      const thumbnailPath = `${u.id}/${crypto.randomUUID()}-thumb.jpg`;

      r = await s.storage.from('thumbnails').upload(thumbnailPath, thumbBlob, {
        upsert: false,
        contentType: 'image/jpeg'
      });

      if (!r.error) {
        thumbnailUrl = s.storage.from('thumbnails').getPublicUrl(thumbnailPath).data.publicUrl;
      }
    }

    r = await s
      .from('videos')
      .insert({
        owner_id: u.id,
        title,
        description: desc,
        category,
        video_url: videoUrl,
        external_url: externalUrl || null,
        thumbnail_url: thumbnailUrl,
        duration
      })
      .select()
      .single();

    if (r.error) {
      console.error(r.error);
      $('#msg').textContent = r.error.message;
      return;
    }

    $('#msg').textContent = 'Published!';
    setTimeout(() => {
      location.href = 'watch.html?id=' + r.data.id;
    }, 700);
  };
}

/* =========================================
   WATCH PAGE
========================================= */

async function watchPage() {
  const s = getSb();
  const id = new URLSearchParams(location.search).get('id');

  if (!id || !s) return;

  const { data: v, error } = await s
    .from('videos')
    .select('*,profiles(username,avatar_url)')
    .eq('id', id)
    .single();

  if (error || !v) return;

  if ($('#title')) $('#title').textContent = v.title;
  if ($('#desc')) $('#desc').textContent = v.description || 'No description.';
  if ($('#views')) $('#views').textContent = `${fmt(v.views)} views • ${date(v.created_at)}`;

  if ($('#player')) {
    const player = $('#player');
    player.controls = true;
    player.playsInline = true;
    player.preload = 'metadata';

    if (v.thumbnail_url) player.poster = v.thumbnail_url;
    player.src = v.video_url;

    const savedTime = localStorage.getItem(`dt_pos_${v.id}`);
    if (savedTime) {
      player.addEventListener(
        'loadedmetadata',
        () => {
          const time = Number(savedTime);
          if (Number.isFinite(time) && time > 0 && time < player.duration) {
            player.currentTime = time;
          }
        },
        { once: true }
      );
    }

    player.ontimeupdate = () => {
      if (player.currentTime > 2) {
        localStorage.setItem(`dt_pos_${v.id}`, player.currentTime);
      }
    };
  }

  if ($('#channel')) $('#channel').textContent = v.profiles?.username || 'Creator';
  if ($('#category')) $('#category').textContent = v.category || 'General';

  loadVideos('#related', '', 8);

  await s.rpc('increment_view', { video_uuid: v.id });
  await recordHistory(v.id);
  await updateLike(id);
  await updateSave(id);
  loadComments(id);

  /* LIKE */
  $('#like')?.addEventListener('click', async () => {
    const u = await currentUser();
    if (!u) {
      location.href = 'auth.html';
      return;
    }

    const { data } = await s
      .from('likes')
      .select('video_id')
      .eq('video_id', id)
      .eq('user_id', u.id)
      .maybeSingle();

    if (data) {
      await s.from('likes').delete().eq('video_id', id).eq('user_id', u.id);
    } else {
      await s.from('likes').insert({ video_id: id, user_id: u.id });
    }
    updateLike(id);
  });

  /* SAVE */
  $('#save')?.addEventListener('click', async () => {
    const u = await currentUser();
    if (!u) {
      location.href = 'auth.html';
      return;
    }

    const { data } = await s
      .from('saved_videos')
      .select('video_id')
      .eq('video_id', id)
      .eq('user_id', u.id)
      .maybeSingle();

    if (data) {
      await s.from('saved_videos').delete().eq('video_id', id).eq('user_id', u.id);
    } else {
      await s.from('saved_videos').insert({ video_id: id, user_id: u.id });
    }
    updateSave(id);
  });

  /* SHARE */
  $('#share')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast('Link copied');
    } catch {
      toast('Copy the page URL');
    }
  });

  /* SUBSCRIBE */
  $('#subscribe')?.addEventListener('click', () => subscribe(v.owner_id));

  /* COMMENT */
  $('#commentBtn')?.addEventListener('click', async () => {
    const u = await currentUser();
    if (!u) {
      location.href = 'auth.html';
      return;
    }

    const content = $('#commentInput').value.trim();
    if (!content) return;

    const r = await s.from('comments').insert({
      video_id: id,
      user_id: u.id,
      content
    });

    if (r.error) {
      toast(r.error.message);
      return;
    }

    $('#commentInput').value = '';
    loadComments(id);
  });
}

/* =========================================
   HISTORY
========================================= */

async function recordHistory(id) {
  const s = getSb();
  const u = await currentUser();

  if (u && s) {
    await s.from('watch_history').upsert(
      {
        user_id: u.id,
        video_id: id,
        watched_at: new Date().toISOString()
      },
      { onConflict: 'user_id,video_id' }
    );
  }
}

/* =========================================
   LIKE & SAVE STATUS UPDATES
========================================= */

async function updateLike(id) {
  const s = getSb();
  const u = await currentUser();
  const b = $('#like');

  if (!b || !s) return;
  if (!u) {
    b.textContent = '👍 Like';
    return;
  }

  const { data } = await s
    .from('likes')
    .select('video_id')
    .eq('video_id', id)
    .eq('user_id', u.id)
    .maybeSingle();

  b.textContent = data ? '👍 Liked' : '👍 Like';
}

async function updateSave(id) {
  const s = getSb();
  const u = await currentUser();
  const b = $('#save');

  if (!b || !s) return;
  if (!u) {
    b.textContent = '💾 Save';
    return;
  }

  const { data } = await s
    .from('saved_videos')
    .select('video_id')
    .eq('video_id', id)
    .eq('user_id', u.id)
    .maybeSingle();

  b.textContent = data ? '💾 Saved' : '💾 Save';
}

/* =========================================
   COMMENTS & SUBSCRIPTIONS
========================================= */

async function loadComments(id) {
  const s = getSb();
  if (!s) return;

  const { data, error } = await s
    .from('comments')
    .select('content,created_at,profiles(username)')
    .eq('video_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  if ($('#comments')) {
    $('#comments').innerHTML =
      (data || [])
        .map(
          c => `
            <div class="comment">
              ${avatar(c.profiles?.username || 'U')}
              <div>
                <strong>${esc(c.profiles?.username || 'User')}</strong>
                <p>${esc(c.content)}</p>
                <small class="muted">${new Date(c.created_at).toLocaleString()}</small>
              </div>
            </div>
          `
        )
        .join('') || `<p class="muted">No comments yet.</p>`;
  }
}

async function subscribe(channelId) {
  const s = getSb();
  const u = await currentUser();

  if (!u || !s) {
    location.href = 'auth.html';
    return;
  }

  if (u.id === channelId) {
    toast('This is your channel.');
    return;
  }

  const { data } = await s
    .from('subscriptions')
    .select('channel_id')
    .eq('subscriber_id', u.id)
    .eq('channel_id', channelId)
    .maybeSingle();

  if (data) {
    await s.from('subscriptions').delete().eq('subscriber_id', u.id).eq('channel_id', channelId);
  } else {
    await s.from('subscriptions').insert({ subscriber_id: u.id, channel_id: channelId });
  }

  toast(data ? 'Unsubscribed' : 'Subscribed');
}

/* =========================================
   TRENDING, CHANNEL, SUBSCRIPTIONS, LIBRARY, HISTORY
========================================= */

async function loadTrending() {
  const s = getSb();
  const e = $('#trending');

  if (!e || !s) return;
  loading(e);

  const { data, error } = await s
    .from('videos')
    .select('*,profiles(username)')
    .order('views', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    e.innerHTML = `<div class="notice">${esc(error.message)}</div>`;
    return;
  }

  e.innerHTML = (data || []).map(card).join('') || `<div class="notice">No videos yet.</div>`;
}

async function channelPage() {
  const s = getSb();
  if (!$('#channelVideos') || !s) return;

  const u = await currentUser();
  if (!u) {
    $('#channelVideos').innerHTML = `<div class="notice">Sign in to see your channel.</div>`;
    return;
  }

  const { data: p } = await s.from('profiles').select('*').eq('id', u.id).single();

  if ($('#channelName')) $('#channelName').textContent = p?.username || u.email.split('@')[0];
  if ($('#channelAvatar')) $('#channelAvatar').textContent = initials(u);

  const { count } = await s
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', u.id);

  if ($('#subs')) $('#subs').textContent = `${fmt(count)} subscribers`;

  const { data } = await s
    .from('videos')
    .select('*,profiles(username)')
    .eq('owner_id', u.id)
    .order('created_at', { ascending: false });

  $('#channelVideos').innerHTML = (data || []).map(card).join('') || `<div class="notice">No videos yet.</div>`;
}

async function subscriptionsPage() {
  const s = getSb();
  if (!$('#subVideos') || !s) return;

  const u = await currentUser();
  if (!u) {
    $('#subVideos').innerHTML = `<div class="notice">Sign in to see subscriptions.</div>`;
    return;
  }

  const { data } = await s.from('subscriptions').select('channel_id').eq('subscriber_id', u.id);
  const ids = (data || []).map(x => x.channel_id);

  if (!ids.length) {
    $('#subVideos').innerHTML = `<div class="notice">No subscriptions yet.</div>`;
    return;
  }

  const r = await s
    .from('videos')
    .select('*,profiles(username)')
    .in('owner_id', ids)
    .order('created_at', { ascending: false });

  $('#subVideos').innerHTML = (r.data || []).map(card).join('') || `<div class="notice">No new videos.</div>`;
}

async function libraryPage() {
  const s = getSb();
  if (!$('#libraryVideos') || !s) return;

  const u = await currentUser();
  if (!u) {
    $('#libraryVideos').innerHTML = `<div class="notice">Sign in to use your library.</div>`;
    return;
  }

  const { data, error } = await s
    .from('saved_videos')
    .select('videos(*,profiles(username))')
    .eq('user_id', u.id);

  if (error) {
    $('#libraryVideos').innerHTML = `<div class="notice">${esc(error.message)}</div>`;
    return;
  }

  $('#libraryVideos').innerHTML =
    (data || []).map(x => x.videos).filter(Boolean).map(card).join('') ||
    `<div class="notice">No saved videos.</div>`;
}

async function historyPage() {
  const s = getSb();
  if (!$('#historyVideos') || !s) return;

  const u = await currentUser();
  if (!u) {
    $('#historyVideos').innerHTML = `<div class="notice">Sign in to see history.</div>`;
    return;
  }

  const { data, error } = await s
    .from('watch_history')
    .select('watched_at,videos(*,profiles(username))')
    .eq('user_id', u.id)
    .order('watched_at', { ascending: false });

  if (error) {
    $('#historyVideos').innerHTML = `<div class="notice">${esc(error.message)}</div>`;
    return;
  }

  $('#historyVideos').innerHTML =
    (data || []).map(x => x.videos).filter(Boolean).map(card).join('') ||
    `<div class="notice">No history yet.</div>`;
}

/* =========================================
   STUDIO (COMPLETED)
========================================= */

async function studioPage() {
  const s = getSb();
  if (!$('#studioStats') || !s) return;

  const u = await currentUser();
  if (!u) {
    $('#studioStats').innerHTML = `<div class="notice">Sign in to open Studio.</div>`;
    return;
  }

  const { data, error } = await s
    .from('videos')
    .select('id,title,views,created_at')
    .eq('owner_id', u.id)
    .order('created_at', { ascending: false });

  if (error) {
    $('#studioStats').innerHTML = `<div class="notice">${esc(error.message)}</div>`;
    return;
  }

  // Calculate stats
  const totalUploads = data ? data.length : 0;
  const totalViews = data ? data.reduce((acc, curr) => acc + (curr.views || 0), 0) : 0;

  $('#studioStats').innerHTML = `
    <div class="statsGrid">
      <div class="statCard">
        <h3>${fmt(totalUploads)}</h3>
        <p class="muted">Total Videos</p>
      </div>
      <div class="statCard">
        <h3>${fmt(totalViews)}</h3>
        <p class="muted">Total Views</p>
      </div>
    </div>
  `;

  const listElement = $('#studioVideoList');
  if (listElement) {
    if (!data || data.length === 0) {
      listElement.innerHTML = `<div class="notice">You haven't uploaded any videos yet.</div>`;
      return;
    }

    listElement.innerHTML = `
      <table class="studioTable">
        <thead>
          <tr>
            <th>Title</th>
            <th>Uploaded</th>
            <th>Views</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(video => `
            <tr>
              <td><strong>${esc(video.title)}</strong></td>
              <td>${date(video.created_at)}</td>
              <td>${fmt(video.views)}</td>
              <td>
                <button onclick="deleteVideo('${video.id}')" class="btnDanger">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

async function deleteVideo(videoId) {
  if (!confirm('Are you sure you want to delete this video?')) return;

  const s = getSb();
  const { error } = await s.from('videos').delete().eq('id', videoId);

  if (error) {
    toast(`Failed to delete: ${error.message}`);
  } else {
    toast('Video deleted.');
    studioPage(); // Reload the list
  }
}
