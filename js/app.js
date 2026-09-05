/* =========================================
   UPLOAD
========================================= */

async function uploadPage() {

  const s = getSb();
  const f = $('#uploadForm');

  if (!f || !s) return;

  const u = await currentUser();

  if (!u) {

    $('#uploadGate').innerHTML = `
      <div class="notice">
        Please sign in before uploading.
      </div>
    `;

    f.style.display = 'none';
    return;
  }

  const vi = $('#video');
  const ti = $('#thumb');

  /* CUSTOM THUMBNAIL PREVIEW */

  ti?.addEventListener('change', () => {

    const file = ti.files?.[0];

    if (file && $('#preview')) {

      $('#preview').src =
        URL.createObjectURL(file);

      $('#preview')
        .classList
        .remove('hidden');
    }
  });

  /* SUBMIT */

  f.onsubmit = async e => {

    e.preventDefault();

    const video = vi?.files?.[0];
    const customThumb = ti?.files?.[0] || null;

    const title =
      $('#title')
        .value
        .trim();

    const desc =
      $('#desc')
        .value
        .trim();

    const category =
      $('#category')
        .value;

    if (!video) {

      $('#msg').textContent =
        'Please choose a video file.';

      return;
    }

    if (!title) {

      $('#msg').textContent =
        'Title is required.';

      return;
    }

    if (!video.type.startsWith('video/')) {

      $('#msg').textContent =
        'Please select a valid video file.';

      return;
    }

    /* CREATE THUMBNAIL */

    let thumbBlob = customThumb;

    if (!thumbBlob) {

      $('#msg').textContent =
        'Creating thumbnail from video…';

      thumbBlob =
        await extractVideoFrame(video);
    }

    /* GET DURATION */

    $('#msg').textContent =
      'Reading video information…';

    const duration =
      await getVideoDuration(video);

    /* SAFE FILE NAME */

    const safe =
      name =>
        name.replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        );

    const videoPath =
      `${u.id}/${crypto.randomUUID()}-${safe(video.name)}`;

    /* UPLOAD VIDEO */

    $('#msg').textContent =
      'Uploading video…';

    let r =
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

    if (r.error) {

      console.error(r.error);

      $('#msg').textContent =
        r.error.message;

      return;
    }

    const videoUrl =
      s.storage
        .from('videos')
        .getPublicUrl(videoPath)
        .data
        .publicUrl;

    /* UPLOAD THUMBNAIL */

    let thumbnailUrl = null;

    if (thumbBlob) {

      $('#msg').textContent =
        'Uploading thumbnail…';

      const thumbnailPath =
        `${u.id}/${crypto.randomUUID()}-thumb.jpg`;

      r =
        await s.storage
          .from('thumbnails')
          .upload(
            thumbnailPath,
            thumbBlob,
            {
              upsert: false,
              contentType:
                'image/jpeg'
            }
          );

      if (r.error) {

        console.error(r.error);

      } else {

        thumbnailUrl =
          s.storage
            .from('thumbnails')
            .getPublicUrl(
              thumbnailPath
            )
            .data
            .publicUrl;
      }
    }

    /* SAVE DATABASE RECORD */

    $('#msg').textContent =
      'Publishing video…';

    r =
      await s
        .from('videos')
        .insert({
          owner_id: u.id,
          title: title,
          description: desc,
          category: category,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          duration: duration
        })
        .select()
        .single();

    if (r.error) {

      console.error(r.error);

      $('#msg').textContent =
        r.error.message;

      return;
    }

    $('#msg').textContent =
      'Published successfully!';

    toast('Video published!');

    setTimeout(() => {

      location.href =
        'watch.html?id=' +
        r.data.id;

    }, 700);
  };
}
