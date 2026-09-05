function card(v){
  const n = v.profiles?.username || 'Creator';

  return `
    <article class="card">
      <a href="watch.html?id=${encodeURIComponent(v.id)}">
        <div class="thumb">
          ${
            v.thumbnail_url
              ? `<img
                  loading="lazy"
                  src="${esc(v.thumbnail_url)}"
                  alt="${esc(v.title)}"
                >`
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
