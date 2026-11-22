/* Click-to-load players: thumbnail until clicked, then YouTube (data-id), Bandcamp (data-bc) or SoundCloud (data-sc). */
document.querySelectorAll('.video-play').forEach(b => {
  b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    if (b.dataset.sc) {
      f.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(b.dataset.sc) + '&color=%23f2a94b&auto_play=true&visual=true&show_comments=false&show_reposts=false&show_teaser=false';
      f.allow = 'autoplay';
    } else if (b.dataset.bc) {
      f.src = 'https://bandcamp.com/EmbeddedPlayer/track=' + b.dataset.bc + '/size=large/bgcol=333333/linkcol=9bcbe8/tracklist=false/artwork=small/transparent=true/';
      f.className = 'bc-in-card';
    } else {
      f.src = 'https://www.youtube-nocookie.com/embed/' + b.dataset.id + '?autoplay=1&rel=0';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
    }
    f.title = b.getAttribute('aria-label').replace(/^Play /, '');
    b.replaceWith(f);
  });
});
