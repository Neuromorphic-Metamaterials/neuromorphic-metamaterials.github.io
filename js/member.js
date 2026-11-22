/* Member pages: reads team/<slug>/profile.md (details between --- lines, then a simple
 * Markdown page) and lists the member's papers from data/papers.json.
 * Members only ever edit their own profile.md and upload files to their own folder. */
(() => {
  'use strict';
  const root = document.getElementById('member');
  if (!root) return;
  const slug = root.dataset.slug, base = slug + '/';
  const $ = id => document.getElementById(id);

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const url = u => /^(https?:|mailto:|\/|#|\.\.\/)/.test(u) ? u : base + u;

  function inline(t) {
    t = esc(t);
    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, a, u) => `<img src="${url(u)}" alt="${a}">`);
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, a, u) => `<a href="${url(u)}">${a}</a>`);
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return t;
  }

  function parse(src) {
    src = src.replace(/\r/g, '');
    const meta = {};
    const fm = src.match(/^---\n([\s\S]*?)\n---\n?/);
    if (fm) {
      fm[1].split('\n').forEach(line => {
        const i = line.indexOf(':');
        if (i > 0) meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
      });
      src = src.slice(fm[0].length);
    }
    src = src.replace(/<!--[\s\S]*?-->/g, '');
    return { meta, html: blocks(src) };
  }

  function blocks(src) {
    const out = [], lines = src.split('\n');
    let para = [], list = [], gallery = [], raw = [];
    const flush = () => {
      if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
      if (list.length) { out.push('<ul>' + list.map(li => '<li>' + inline(li) + '</li>').join('') + '</ul>'); list = []; }
      if (gallery.length) {
        out.push('<div class="gallery">' + gallery.map(([c, u]) =>
          `<figure><img src="${esc(url(u))}" alt="${esc(c)}" loading="lazy">${c ? `<figcaption>${inline(c)}</figcaption>` : ''}</figure>`).join('') + '</div>');
        gallery = [];
      }
      if (raw.length) { out.push(raw.join('\n')); raw = []; }
    };
    for (const line of lines) {
      const t = line.trim();
      if (!t) { flush(); continue; }
      if (raw.length || /^<(iframe|div|figure|video|audio|blockquote|p|img|a)\b/i.test(t)) { raw.push(line); continue; }
      let m;
      if ((m = t.match(/^(#{1,3})\s+(.*)$/))) { flush(); out.push(m[1].length < 3 ? `<h2>${inline(m[2])}</h2>` : `<h3>${inline(m[2])}</h3>`); continue; }
      if ((m = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) { if (para.length || list.length) flush(); gallery.push([m[1], m[2]]); continue; }
      if ((m = t.match(/^[-*]\s+(.*)$/))) { if (para.length || gallery.length) flush(); list.push(m[1]); continue; }
      if (gallery.length || list.length) flush();
      para.push(t);
    }
    flush();
    return out.join('\n');
  }

  function links(meta) {
    const L = [];
    const add = (label, href) => href && L.push(`<a href="${esc(href)}">${label}</a>`);
    if (meta.email) add('Email', meta.email.includes(':') ? meta.email : 'mailto:' + meta.email);
    if (meta.website) add('Website', meta.website);
    if (meta.scholar) add('Google Scholar', meta.scholar);
    if (meta.orcid) add('ORCID', /^https?:/.test(meta.orcid) ? meta.orcid : 'https://orcid.org/' + meta.orcid);
    if (meta.github) add('GitHub', /^https?:/.test(meta.github) ? meta.github : 'https://github.com/' + meta.github);
    if (meta.linkedin) add('LinkedIn', meta.linkedin);
    if (meta.cv) add('CV', url(meta.cv));
    return L.join('&ensp; ');
  }

  function paper(p) {
    const href = p.doi ? 'https://doi.org/' + p.doi : 'https://arxiv.org/abs/' + p.arxiv;
    const venue = p.journal === 'arXiv' ? 'arXiv preprint' : p.journal;
    const L = [];
    if (p.doi) L.push(`<a href="https://doi.org/${esc(p.doi)}">Journal</a>`);
    if (p.arxiv) L.push(`<a href="https://arxiv.org/abs/${esc(p.arxiv)}">arXiv</a>`);
    return `<li><a class="title" href="${esc(href)}">${esc(p.title)}</a>
      <p class="authors">${esc(p.authors)}</p>
      <p class="meta"><span class="journal">${esc(venue)}</span>${p.vol ? ' ' + esc(p.vol) : ''} (${p.year})</p>
      <p class="rel-links">${L.join('&ensp; ')}</p></li>`;
  }

  fetch(base + 'profile.md', { cache: 'no-cache' }).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(src => {
    const { meta, html } = parse(src);
    if (meta.name) { document.title = meta.name + ' | Neuromorphic Metamaterials'; const h = document.querySelector('.field h1'); if (h) h.textContent = meta.name; }
    if (meta.role) $('m-role').textContent = meta.role;
    $('m-topics').textContent = meta.topics || '';
    if (meta.photo) $('m-photo').src = url(meta.photo);
    $('m-links').innerHTML = links(meta);
    $('m-body').innerHTML = html;

    const names = (meta.paper_name || '').split(';').map(s => s.trim()).filter(Boolean);
    if (!names.length) return;
    return fetch('../data/papers.json').then(r => r.json()).then(all => {
      const mine = all.filter(p => names.some(n => new RegExp('(^|, |including )' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(,|$)').test(p.authors)));
      if (!mine.length) return;
      $('m-papers').innerHTML = mine.map(paper).join('');
      $('m-papers-block').hidden = false;
    });
  }).catch(() => { /* keep the static fallback shown in the page */ });
})();
