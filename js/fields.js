/* Neuromorphic Metamaterials: live fields
 *
 * Three small simulations, one per page load (never the same twice in a row).
 * Force one with ?field=ice | lasers | kan
 *
 *   ice     Square artificial spin ice. Metropolis dynamics on E = J q^2 + K |m|^2
 *           per vertex. q != 0 vertices are emergent monopoles.
 *   lasers  Random network laser. Gabriel-graph waveguide mesh, DMD-style pump
 *           pattern, saturable gain above transparency, low-loss diffusive coupling
 *           between links, and photon packets that run outward and split at junctions.
 *   kan     Physical Kolmogorov-Arnold network. Each edge is a heterogeneous
 *           nonlinear device curve phi(x); weights are retuned by random
 *           perturbations (perturbative learning). The pointer acts as a local
 *           control voltage that bends nearby curves.
 *
 * Colours: amber marks physical events (monopoles, lasing, learning updates).
 */
(() => {
  'use strict';
  const canvas = document.getElementById('field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const INK = '#0c1d31';
  const PAPER = [234, 228, 214], CYAN = [155, 203, 232], AMBER = [242, 169, 75];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  let W = 0, H = 0, dpr = 1;

  /* ================================================================ ICE */
  function makeIce() {
    const J = 1.0, K = 0.14, T = 1.15, RATE = 0.06, EASE = 0.14;
    let a, nx, ny, ox, oy, h, v, hd, vd, N;
    const gH = (i, j) => (i < 0 || i >= nx || j < 0 || j > ny) ? 0 : h[j * nx + i];
    const gV = (i, j) => (i < 0 || i > nx || j < 0 || j >= ny) ? 0 : v[j * (nx + 1) + i];
    const charge = (i, j) => gH(i - 1, j) - gH(i, j) + gV(i, j - 1) - gV(i, j);
    const vertexE = (i, j) => {
      const q = charge(i, j), mx = gH(i - 1, j) + gH(i, j), my = gV(i, j - 1) + gV(i, j);
      return J * q * q + K * (mx * mx + my * my);
    };
    function tryFlip(temp) {
      const k = (Math.random() * N) | 0;
      let i, j, arr, idx, bi, bj;
      if (k < h.length) { idx = k; arr = h; j = (k / nx) | 0; i = k - j * nx; bi = i + 1; bj = j; }
      else { idx = k - h.length; arr = v; j = (idx / (nx + 1)) | 0; i = idx - j * (nx + 1); bi = i; bj = j + 1; }
      const e0 = vertexE(i, j) + vertexE(bi, bj);
      arr[idx] = -arr[idx];
      const dE = vertexE(i, j) + vertexE(bi, bj) - e0;
      if (dE > 0 && Math.random() >= Math.exp(-dE / temp)) arr[idx] = -arr[idx];
    }
    return {
      name: 'Artificial spin ice',
      caption: 'Each bar is a nanomagnet with its north end lit. Glowing points are emergent magnetic monopoles. Move the pointer to write a domain.',
      build() {
        a = clamp(W / 38, 26, 40);
        nx = Math.ceil(W / a) + 2; ny = Math.ceil(H / a) + 2; ox = -a; oy = -a;
        h = new Int8Array(nx * (ny + 1)).map(() => Math.random() < .5 ? 1 : -1);
        v = new Int8Array((nx + 1) * ny).map(() => Math.random() < .5 ? 1 : -1);
        N = h.length + v.length;
        for (let s = 0; s < 60; s++) for (let n = 0; n < N; n++) tryFlip(4 - 2.85 * s / 59);
        hd = Float32Array.from(h); vd = Float32Array.from(v);
      },
      step() { const n = Math.ceil(N * RATE); for (let s = 0; s < n; s++) tryFlip(T); },
      pointer(x0, y0, x1, y1) {
        const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
        if (len < 2) return;
        const fx = dx / len, fy = dy / len, R = a * 1.8, steps = Math.ceil(len / (a * .5));
        for (let s = 0; s <= steps; s++) {
          const px = x0 + dx * s / steps - ox, py = y0 + dy * s / steps - oy;
          for (let j = Math.max(0, Math.floor((py - R) / a)); j <= Math.min(ny, Math.ceil((py + R) / a)); j++)
            for (let i = Math.max(0, Math.floor((px - R) / a)); i <= Math.min(nx, Math.ceil((px + R) / a)); i++) {
              if (i < nx && Math.abs(fx) > .3 && Math.hypot((i + .5) * a - px, j * a - py) < R) h[j * nx + i] = fx > 0 ? 1 : -1;
              if (j < ny && Math.abs(fy) > .3 && Math.hypot(i * a - px, (j + .5) * a - py) < R) v[j * (nx + 1) + i] = fy > 0 ? 1 : -1;
            }
        }
      },
      draw() {
        const L = a * .66, t = a * .2, hl = L / 2 - t / 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let j = 0; j <= ny; j++) for (let i = 0; i < nx; i++) { const cx = ox + (i + .5) * a, cy = oy + j * a; ctx.moveTo(cx - hl, cy); ctx.lineTo(cx + hl, cy); }
        for (let j = 0; j < ny; j++) for (let i = 0; i <= nx; i++) { const cx = ox + i * a, cy = oy + (j + .5) * a; ctx.moveTo(cx, cy - hl); ctx.lineTo(cx, cy + hl); }
        ctx.strokeStyle = rgba(PAPER, .06); ctx.lineWidth = t; ctx.stroke();

        ctx.beginPath();
        for (let j = 0; j <= ny; j++) for (let i = 0; i < nx; i++) {
          const k = j * nx + i; hd[k] += (h[k] - hd[k]) * EASE;
          const cx = ox + (i + .5) * a, cy = oy + j * a, d = hd[k] * hl;
          if (Math.abs(d) > .5) { ctx.moveTo(cx + d * .05, cy); ctx.lineTo(cx + d, cy); }
        }
        for (let j = 0; j < ny; j++) for (let i = 0; i <= nx; i++) {
          const k = j * (nx + 1) + i; vd[k] += (v[k] - vd[k]) * EASE;
          const cx = ox + i * a, cy = oy + (j + .5) * a, d = vd[k] * hl;
          if (Math.abs(d) > .5) { ctx.moveTo(cx, cy + d * .05); ctx.lineTo(cx, cy + d); }
        }
        ctx.strokeStyle = rgba(CYAN, .34); ctx.lineWidth = t * .8; ctx.stroke();

        const mono = [];
        ctx.beginPath();
        for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
          const q = charge(i, j), x = ox + i * a, y = oy + j * a;
          if (q !== 0) { mono.push(x, y, q); continue; }
          if (gH(i - 1, j) + gH(i, j) || gV(i, j - 1) + gV(i, j)) { ctx.moveTo(x + 1.6, y); ctx.arc(x, y, 1.6, 0, 6.2832); }
        }
        ctx.fillStyle = rgba(CYAN, .16); ctx.fill();
        for (let m = 0; m < mono.length; m += 3) {
          const x = mono[m], y = mono[m + 1], q = mono[m + 2], c = q > 0 ? AMBER : CYAN;
          const r = a * (Math.abs(q) > 2 ? .8 : .58);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, rgba(c, .95)); g.addColorStop(.25, rgba(c, .42)); g.addColorStop(1, rgba(c, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
        }
      }
    };
  }

  /* ============================================================= LASERS */
  function makeLasers() {
    // Gain medium + passive waveguide mesh. Pumped links amplify (saturable gain above transparency);
    // light diffuses through junctions and decays slowly, so lasing modes spill far beyond the pump.
    const LOSS = .1, G0 = .5, ISAT = .13, COUPLE = 1.2, SPONT = .003, DT = .06, IREF = 1.1;
    const MAXP = 750, SPEED = 4.2, TAIL = 34;
    const WARM = [255, 214, 150], CORE = [255, 244, 222];
    let s, px, py, edges, elen, inc, nbr, I, Pn, S, phase, omega, spots, trail, t, cell, gw, gh, pump, off, offCtx, img, packets;

    function addGauss(field, x, y, amp, sig) {
      const R = sig * 3, i0 = Math.max(0, Math.floor((x - R) / cell)), i1 = Math.min(gw - 1, Math.ceil((x + R) / cell));
      const j0 = Math.max(0, Math.floor((y - R) / cell)), j1 = Math.min(gh - 1, Math.ceil((y + R) / cell));
      const k = -1 / (2 * sig * sig);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const dx = (i + .5) * cell - x, dy = (j + .5) * cell - y;
        field[j * gw + i] += amp * Math.exp((dx * dx + dy * dy) * k);
      }
    }
    // launch a photon packet on edge l, travelling away from (ox, oy)
    function launch(l, ox, oy, e) {
      if (packets.length >= MAXP) return;
      const [i, j] = edges[l];
      const di = Math.hypot(px[i] - ox, py[i] - oy), dj = Math.hypot(px[j] - ox, py[j] - oy);
      packets.push({ l, from: di < dj ? i : j, to: di < dj ? j : i, d: 0, e, ox, oy });
    }
    function sources() {
      const out = [];
      for (const sp of spots) if (sp.A > .3) out.push([sp.x, sp.y]);
      const head = trail[trail.length - 1];
      if (head && head.a > .25) out.push([head.x, head.y]);
      return out;
    }

    return {
      name: 'Random network laser',
      caption: 'Light circulates in a mesh of waveguides. Where the pixelated pump is strong enough the network lases, and light spreads out through the mesh. Move the pointer to pump it.',
      build() {
        t = 0; packets = [];
        s = clamp(W / 24, 52, 78);
        const cols = Math.ceil(W / s) + 2, rows = Math.ceil(H / s) + 2;
        px = []; py = [];
        const at = [];
        for (let c = 0; c < cols; c++) { at.push([]); for (let r = 0; r < rows; r++) {
          at[c].push(px.length); px.push((c - .5) * s + rand(-.4, .4) * s); py.push((r - .5) * s + rand(-.4, .4) * s);
        } }
        // Gabriel graph on local neighbourhoods: planar and irregular, like a fabricated random mesh
        edges = [];
        for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
          const i = at[c][r], near = [];
          for (let dc = -2; dc <= 2; dc++) for (let dr = -2; dr <= 2; dr++) {
            const cc = c + dc, rr = r + dr;
            if (cc >= 0 && cc < cols && rr >= 0 && rr < rows && at[cc][rr] !== i) near.push(at[cc][rr]);
          }
          for (const j of near) {
            if (j < i) continue;
            const d = Math.hypot(px[j] - px[i], py[j] - py[i]);
            if (d > 1.9 * s) continue;
            const mx = (px[i] + px[j]) / 2, my = (py[i] + py[j]) / 2;
            let ok = true;
            for (const k of near) if (k !== j && Math.hypot(px[k] - mx, py[k] - my) < d / 2) { ok = false; break; }
            if (ok) edges.push([i, j]);
          }
        }
        const deg = new Int16Array(px.length);
        edges.forEach(([i, j]) => { deg[i]++; deg[j]++; });
        edges = edges.filter(([i, j]) => {
          if (Math.random() < .2 && deg[i] > 2 && deg[j] > 2) { deg[i]--; deg[j]--; return false; }
          return true;
        });
        elen = edges.map(([i, j]) => Math.hypot(px[j] - px[i], py[j] - py[i]));
        inc = px.map(() => []);
        edges.forEach(([i, j], l) => { inc[i].push(l); inc[j].push(l); });
        nbr = edges.map(([i, j], l) => inc[i].concat(inc[j]).filter(m => m !== l));
        I = new Float32Array(edges.length).map(() => rand(0, .01));
        phase = new Float32Array(edges.length).map(() => rand(0, 6.28));
        omega = new Float32Array(edges.length).map(() => rand(1.5, 4));
        Pn = new Float32Array(px.length); S = new Float32Array(px.length);
        spots = Array.from({ length: 3 }, (_, k) => ({
          cx: rand(.4, .9) * W, cy: rand(.2, .8) * H, ax: rand(.08, .18) * W, ay: rand(.08, .18) * H,
          fx: rand(.04, .1), fy: rand(.04, .1), p: rand(0, 6.28), fe: rand(.05, .09), pe: k * 2.1, sig: rand(1.2, 1.8) * s,
        }));
        trail = [];
        cell = 12; gw = Math.ceil(W / cell); gh = Math.ceil(H / cell);
        pump = new Float32Array(gw * gh);
        off = document.createElement('canvas'); off.width = gw; off.height = gh;
        offCtx = off.getContext('2d'); img = offCtx.createImageData(gw, gh);
        for (let k = 0; k < 400; k++) this.step();
      },
      step() {
        t += 1 / 60;
        for (const p of trail) p.a *= .985;
        while (trail.length && trail[0].a < .03) trail.shift();
        Pn.fill(0); pump.fill(0);
        const all = [];
        for (const sp of spots) {
          sp.x = sp.cx + sp.ax * Math.sin(sp.fx * t * 6.28 + sp.p);
          sp.y = sp.cy + sp.ay * Math.cos(sp.fy * t * 6.28 + sp.p * 1.3);
          sp.A = 2.6 * Math.max(0, Math.sin(sp.fe * t * 6.28 + sp.pe)) ** .5;
          if (sp.A > .01) all.push([sp.x, sp.y, sp.A, sp.sig]);
        }
        for (const p of trail) all.push([p.x, p.y, 2.2 * p.a, .95 * s]);
        for (let i = 0; i < px.length; i++) {
          let P = 0;
          for (const [x, y, A, sg] of all) { const dx = px[i] - x, dy = py[i] - y, d2 = dx * dx + dy * dy; if (d2 < 9 * sg * sg) P += A * Math.exp(-d2 / (2 * sg * sg)); }
          Pn[i] = P;
        }
        for (const [x, y, A, sg] of all) addGauss(pump, x, y, A, sg);

        S.fill(0);
        for (let l = 0; l < edges.length; l++) { S[edges[l][0]] += I[l]; S[edges[l][1]] += I[l]; }
        for (let l = 0; l < edges.length; l++) {
          const [i, j] = edges[l], G = (Pn[i] + Pn[j]) / 2;
          const g = Math.max(0, G - G0) / (1 + (S[i] + S[j]) / (2 * ISAT * Math.max(1, inc[i].length)));
          let inflow = 0; const nb = nbr[l];
          for (let m = 0; m < nb.length; m++) inflow += I[nb[m]];
          inflow /= Math.max(1, nb.length);
          I[l] = clamp(I[l] + DT * ((g - LOSS) * I[l] + COUPLE * (inflow - I[l]) + SPONT * G), 0, 6);
        }

        // emission: lasing links shed photon packets that run outward from the nearest source
        const src = sources();
        if (src.length) for (let l = 0; l < edges.length; l++) {
          const b = I[l] / IREF;
          if (b < .2 || Math.random() > .012 * b) continue;
          const [i, j] = edges[l], mx = (px[i] + px[j]) / 2, my = (py[i] + py[j]) / 2;
          let best = src[0], bd = 1e9;
          for (const q of src) { const d = (q[0] - mx) ** 2 + (q[1] - my) ** 2; if (d < bd) { bd = d; best = q; } }
          launch(l, best[0], best[1], Math.min(1, .45 + .4 * b));
        }

        // propagate packets; at junctions choose an outward link, sometimes split
        const born = [];
        for (const p of packets) {
          p.d += SPEED; p.e *= .993;
          if (p.d < elen[p.l]) continue;
          const n = p.to, ox = px[n] - p.ox, oy = py[n] - p.oy, on = Math.hypot(ox, oy) || 1;
          const cand = [], w = [];
          for (const m of inc[n]) {
            if (m === p.l) continue;
            const k = edges[m][0] === n ? edges[m][1] : edges[m][0];
            const dx = px[k] - px[n], dy = py[k] - py[n], dn = Math.hypot(dx, dy) || 1;
            cand.push([m, k]); w.push(Math.max(.03, (dx * ox + dy * oy) / (dn * on) + .35) ** 2);
          }
          if (!cand.length) { p.e = 0; continue; }
          const pick = () => { let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let c = 0; c < w.length; c++) { r -= w[c]; if (r <= 0) return c; } return w.length - 1; };
          const c = pick();
          if (Math.random() < .3 && cand.length > 1 && packets.length + born.length < MAXP) {
            const c2 = pick();
            if (c2 !== c) born.push({ l: cand[c2][0], from: n, to: cand[c2][1], d: p.d - elen[p.l], e: p.e * .55, ox: p.ox, oy: p.oy });
            p.e *= .7;
          } else p.e *= .9;
          p.d -= elen[p.l]; p.l = cand[c][0]; p.from = n; p.to = cand[c][1];
        }
        packets = packets.concat(born).filter(p => p.e > .06);
      },
      pointer(x0, y0, x1, y1) {
        const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(len / 18));
        for (let k = 1; k <= n; k++) trail.push({ x: x0 + (x1 - x0) * k / n, y: y0 + (y1 - y0) * k / n, a: 1 });
        while (trail.length > 90) trail.shift();
        // a burst of light from links under the pointer, running away from it
        let fired = 0;
        for (let l = 0; l < edges.length && fired < 5; l++) {
          const [i, j] = edges[l], mx = (px[i] + px[j]) / 2, my = (py[i] + py[j]) / 2;
          if ((mx - x1) ** 2 + (my - y1) ** 2 < (s * 1.1) ** 2 && Math.random() < .5) { launch(l, x1, y1, 1); fired++; }
        }
      },
      draw() {
        // pump: DMD micromirror pattern
        const d = img.data;
        for (let k = 0; k < pump.length; k++) {
          d[k * 4] = CYAN[0]; d[k * 4 + 1] = CYAN[1]; d[k * 4 + 2] = CYAN[2];
          d[k * 4 + 3] = Math.min(1, pump[k] / 2.6) * 26;
        }
        offCtx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, gw * cell, gh * cell);
        ctx.beginPath();
        for (let i = 0; i <= gw; i++) { ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, H); }
        for (let j = 0; j <= gh; j++) { ctx.moveTo(0, j * cell); ctx.lineTo(W, j * cell); }
        ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();

        // passive waveguides
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (const [i, j] of edges) { ctx.moveTo(px[i], py[i]); ctx.lineTo(px[j], py[j]); }
        ctx.strokeStyle = rgba(PAPER, .12); ctx.lineWidth = 1.1; ctx.stroke();

        ctx.globalCompositeOperation = 'lighter';

        // guided light: halo, body and hot core, bucketed by brightness (sqrt for a soft falloff)
        const B = 7, paths = Array.from({ length: B }, () => new Path2D());
        for (let l = 0; l < edges.length; l++) {
          const b = Math.sqrt(I[l] / IREF) * (.82 + .18 * Math.sin(omega[l] * t + phase[l]));
          const lv = Math.min(B - 1, Math.floor(b * B));
          if (lv < 1) continue;
          const [i, j] = edges[l];
          paths[lv].moveTo(px[i], py[i]); paths[lv].lineTo(px[j], py[j]);
        }
        for (let lv = 1; lv < B; lv++) {
          const f = lv / (B - 1);
          ctx.strokeStyle = rgba(AMBER, .035 * f); ctx.lineWidth = 16; ctx.stroke(paths[lv]);
          ctx.strokeStyle = rgba(AMBER, .09 * f); ctx.lineWidth = 6; ctx.stroke(paths[lv]);
          ctx.strokeStyle = rgba(WARM, .12 + .5 * f * f); ctx.lineWidth = 1.6; ctx.stroke(paths[lv]);
        }

        // scattering at bright junctions: light leaking out of plane
        for (let i = 0; i < px.length; i++) {
          const b = Math.sqrt(S[i] / (IREF * Math.max(1, inc[i].length)));
          if (b < .35) continue;
          const r = 10 + 22 * Math.min(1.4, b);
          const g = ctx.createRadialGradient(px[i], py[i], 0, px[i], py[i], r);
          g.addColorStop(0, rgba(CORE, Math.min(.55, .25 * b))); g.addColorStop(.2, rgba(AMBER, Math.min(.22, .1 * b))); g.addColorStop(1, rgba(AMBER, 0));
          ctx.fillStyle = g; ctx.fillRect(px[i] - r, py[i] - r, 2 * r, 2 * r);
        }

        // photon packets: comet streaks travelling outward
        const NL = 4, tails = Array.from({ length: NL }, () => new Path2D()), heads = Array.from({ length: NL }, () => new Path2D());
        for (const p of packets) {
          const a = p.from, b = p.to, L = elen[p.l], ux = (px[b] - px[a]) / L, uy = (py[b] - py[a]) / L;
          const hx = px[a] + ux * Math.min(p.d, L), hy = py[a] + uy * Math.min(p.d, L);
          const tl = Math.min(TAIL, p.d), lv = Math.min(NL - 1, Math.floor(p.e * NL));
          tails[lv].moveTo(hx - ux * tl, hy - uy * tl); tails[lv].lineTo(hx, hy);
          heads[lv].moveTo(hx + 2.2, hy); heads[lv].arc(hx, hy, 2.2, 0, 6.2832);
        }
        for (let lv = 0; lv < NL; lv++) {
          const f = (lv + 1) / NL;
          ctx.strokeStyle = rgba(AMBER, .16 * f); ctx.lineWidth = 7; ctx.stroke(tails[lv]);
          ctx.strokeStyle = rgba(WARM, .5 * f); ctx.lineWidth = 1.8; ctx.stroke(tails[lv]);
          ctx.fillStyle = rgba(CORE, .9 * f); ctx.fill(heads[lv]);
        }

        ctx.globalCompositeOperation = 'source-over';

        // junctions
        ctx.beginPath();
        for (let i = 0; i < px.length; i++) { ctx.moveTo(px[i] + 1.4, py[i]); ctx.arc(px[i], py[i], 1.4, 0, 6.2832); }
        ctx.fillStyle = rgba(PAPER, .26); ctx.fill();
      }
    };
  }

  /* ================================================================ KAN */
  function makeKan() {
    const GW = 34, GH = 20;
    let nodes, layers, edges, pulses, t, frame, ptr;
    const phi = (p, x) => (p.a * Math.tanh(p.b * (x - p.c)) + p.d * Math.exp(-(((x - p.e) / p.w) ** 2))) / (Math.abs(p.a) + Math.abs(p.d));
    const newParams = () => ({ a: (Math.random() < .5 ? -1 : 1) * rand(.6, 1.2), b: rand(1, 5), c: rand(-.5, .5), d: rand(-.8, .8), e: rand(-.6, .6), w: rand(.15, .4) });
    const bez = (e, u) => {
      const A = nodes[e.a], Bn = nodes[e.b], dx = (Bn.x - A.x) * .5, m = 1 - u;
      return [m * m * m * A.x + 3 * m * m * u * (A.x + dx) + 3 * m * u * u * (Bn.x - dx) + u * u * u * Bn.x,
              m * m * m * A.y + 3 * m * m * u * A.y + 3 * m * u * u * Bn.y + u * u * u * Bn.y];
    };
    return {
      name: 'Physical Kolmogorov-Arnold network',
      caption: 'Every connection is a different nonlinear device curve. Move the pointer to reshape the curves near it and drive the nodes. Amber flashes are perturbative learning updates.',
      build() {
        t = 0; frame = 0; pulses = []; ptr = null;
        const nL = clamp(Math.round(W / 240), 4, 7), m = clamp(Math.round(H / 105), 4, 8);
        nodes = []; layers = [];
        for (let k = 0; k < nL; k++) {
          const L = [];
          const x = W * (.05 + .92 * k / (nL - 1));
          for (let j = 0; j < m; j++) {
            L.push(nodes.length);
            nodes.push({ x: x + rand(-14, 14), y: H * (.1 + .8 * (j + .5 + (k % 2 ? .25 : -.25)) / m), v: 0, inj: 0, w: rand(.15, .45), p: rand(0, 6.28) });
          }
          layers.push(L);
        }
        edges = [];
        for (let k = 0; k < nL - 1; k++) {
          const A = layers[k], Bl = layers[k + 1];
          A.forEach((ai, j) => {
            const set = new Set([Bl[clamp(j + (Math.random() < .5 ? 0 : -1), 0, m - 1)], Bl[clamp(j + 1, 0, m - 1)], Bl[(Math.random() * m) | 0]]);
            set.forEach(bi => {
              const p = newParams();
              edges.push({ a: ai, b: bi, p, q: { ...p }, flash: 0, u: rand(.4, .6) });
            });
          });
        }
        nodes.forEach(n => n.inEdges = []);
        edges.forEach(e => nodes[e.b].inEdges.push(e));
        for (let k = 0; k < 120; k++) this.step();
      },
      step() {
        t += 1 / 60; frame++;
        for (const n of nodes) {
          if (n.inEdges.length === 0) n.v = .9 * Math.sin(n.w * t * 6.28 + n.p);
          else {
            let s = 0; for (const e of n.inEdges) s += phi(e.p, nodes[e.a].v);
            n.v += (Math.tanh(1.4 * s / Math.sqrt(n.inEdges.length)) - n.v) * .08;
          }
          if (ptr) { const d = Math.hypot(n.x - ptr.x, n.y - ptr.y); if (d < 110) n.inj = ptr.s; }
          n.v = clamp(n.v + n.inj * .35, -1, 1); n.inj *= .9;
        }
        ptr = null;
        // perturbative learning: random device retuned, curve eases to its new shape
        if (frame % 7 === 0) {
          const e = edges[(Math.random() * edges.length) | 0];
          e.q = { a: e.p.a * rand(.8, 1.2), b: clamp(e.p.b + rand(-1, 1), .8, 6), c: clamp(e.p.c + rand(-.3, .3), -.7, .7),
                  d: clamp(e.p.d + rand(-.4, .4), -.9, .9), e: clamp(e.p.e + rand(-.3, .3), -.7, .7), w: clamp(e.p.w + rand(-.08, .08), .12, .45) };
          e.flash = 1;
        }
        for (const e of edges) {
          const rate = e.touch > .05 ? .16 : .05;
          for (const k in e.q) e.p[k] += (e.q[k] - e.p[k]) * rate;
          e.flash *= .965; e.touch = (e.touch || 0) * .955;
          if (pulses.length < 420 && Math.random() < .014 * Math.abs(nodes[e.a].v)) pulses.push({ e, u: 0, amp: phi(e.p, nodes[e.a].v) });
        }
        for (const p of pulses) p.u += .011;
        pulses = pulses.filter(p => p.u < 1);
      },
      pointer(x0, y0, x1, y1) {
        const dy = y1 - y0, dx = x1 - x0;
        if (Math.hypot(dx, dy) < 1) return;
        ptr = { x: x1, y: y1, s: (Math.abs(dy) > Math.abs(dx) ? dy : dx) > 0 ? 1 : -1 };
        // the pointer acts as a local control voltage: nearby device curves bend towards it
        const R = 150;
        for (const e of edges) {
          const [gx, gy] = bez(e, e.u), dist = Math.hypot(gx - x1, gy - y1);
          if (dist > R) continue;
          const w = (1 - dist / R) ** 1.5, q = e.q;
          q.d = clamp(q.d * (1 - w) + w * clamp((gy - y1) / (GH * 2.5), -1, 1), -1, 1);
          q.e = clamp(q.e * (1 - w) + w * clamp((x1 - gx) / (GW * 1.5), -.8, .8), -.8, .8);
          q.w = clamp(q.w * (1 - w) + w * (.12 + .25 * dist / R), .1, .45);
          q.c = clamp(q.c + w * dx / 90, -.8, .8);
          q.b = clamp(q.b * (1 + w * dy / 160), .8, 7);
          e.touch = Math.max(e.touch || 0, w);
        }
      },
      draw() {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (const e of edges) {
          const A = nodes[e.a], B = nodes[e.b], dx = (B.x - A.x) * .5;
          ctx.moveTo(A.x, A.y); ctx.bezierCurveTo(A.x + dx, A.y, B.x - dx, B.y, B.x, B.y);
        }
        ctx.strokeStyle = rgba(PAPER, .11); ctx.lineWidth = 1; ctx.stroke();

        // device curves
        const calm = new Path2D(), dots = new Path2D();
        for (const e of edges) {
          const [gx, gy] = bez(e, e.u);
          const hot = e.flash > .06 || e.touch > .06, path = hot ? new Path2D() : calm;
          for (let k = 0; k <= 16; k++) {
            const x = -1 + 2 * k / 16, X = gx + x * GW / 2, Y = gy - phi(e.p, x) * GH / 2;
            k ? path.lineTo(X, Y) : path.moveTo(X, Y);
          }
          if (hot) {
            if (e.touch > e.flash) { ctx.strokeStyle = rgba(CYAN, .4 + .6 * e.touch); ctx.lineWidth = 1.4 + e.touch; }
            else { ctx.strokeStyle = rgba(AMBER, .25 + .75 * e.flash); ctx.lineWidth = 1.6; }
            ctx.stroke(path);
          }
          const xv = nodes[e.a].v, X = gx + xv * GW / 2, Y = gy - phi(e.p, xv) * GH / 2;
          dots.moveTo(X + 2, Y); dots.arc(X, Y, 2, 0, 6.2832);
        }
        ctx.strokeStyle = rgba(PAPER, .42); ctx.lineWidth = 1.3; ctx.stroke(calm);
        ctx.fillStyle = rgba(CYAN, .95); ctx.fill(dots);

        // signal pulses travelling along the devices
        const lv = [new Path2D(), new Path2D(), new Path2D()];
        for (const p of pulses) {
          const [x, y] = bez(p.e, p.u), b = Math.min(2, Math.floor(Math.abs(p.amp) * 3));
          lv[b].moveTo(x + 1.7, y); lv[b].arc(x, y, 1.7, 0, 6.2832);
        }
        lv.forEach((P, b) => { ctx.fillStyle = rgba(CYAN, .25 + .3 * b); ctx.fill(P); });

        // neurons
        for (const n of nodes) {
          ctx.beginPath(); ctx.arc(n.x, n.y, 7, 0, 6.2832);
          ctx.fillStyle = INK; ctx.fill();
          ctx.fillStyle = rgba(CYAN, Math.abs(n.v) * .85); ctx.fill();
          ctx.strokeStyle = rgba(PAPER, .4); ctx.lineWidth = 1; ctx.stroke();
        }
      }
    };
  }

  /* ============================================================ RUNNER */
  const FIELDS = { ice: makeIce, lasers: makeLasers, kan: makeKan };
  const KEYS = Object.keys(FIELDS);
  let key = new URLSearchParams(location.search).get('field');
  if (!FIELDS[key]) {
    let last = null;
    try { last = sessionStorage.getItem('nm-field'); } catch (e) { /* storage unavailable */ }
    const opts = KEYS.filter(k => k !== last);
    key = opts[(Math.random() * opts.length) | 0];
  }
  let field;
  const nameEl = document.getElementById('field-name'), capEl = document.getElementById('field-caption');

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function render() { ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H); field.draw(); }
  function use(k) {
    key = k;
    try { sessionStorage.setItem('nm-field', k); } catch (e) { /* storage unavailable */ }
    field = FIELDS[k]();
    resize(); field.build(); render();
    if (nameEl) nameEl.textContent = field.name;
    if (capEl) capEl.textContent = field.caption;
  }

  let last = null;
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect(), p = [e.clientX - r.left, e.clientY - r.top];
    if (last) field.pointer(last[0], last[1], p[0], p[1]);
    last = p;
    if (reduced) { field.step(); render(); }
  });
  canvas.addEventListener('pointerleave', () => { last = null; });

  const next = document.getElementById('field-next');
  if (next) next.addEventListener('click', () => use(KEYS[(KEYS.indexOf(key) + 1) % KEYS.length]));

  let raf = 0, visible = true;
  const loop = () => { field.step(); render(); raf = requestAnimationFrame(loop); };
  const run = on => { cancelAnimationFrame(raf); if (on && !reduced) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; run(visible && !document.hidden); }).observe(canvas);
  document.addEventListener('visibilitychange', () => run(visible && !document.hidden));
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); field.build(); render(); }, 200); });

  use(key);
})();
