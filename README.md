# Neuromorphic Metamaterials: group website

Plain static site. No build step, no external dependencies (fonts are self-hosted).

```
index.html  research.html  publications.html  people.html  join.html
css/site.css      palette, type, layout (variables at the top)
js/fields.js      the three live background simulations
fonts/            Fira Sans (SIL Open Font License, see fonts/OFL.txt)
assets/           favicon, people photos (assets/people/)
.nojekyll         tells GitHub Pages to serve files as-is
```

## Live backgrounds

Every page header runs one of three simulations, chosen at random on each page load and never the same
twice in a row:

- `ice`: square artificial spin ice, Metropolis dynamics, emergent monopoles. Pointer writes domains.
- `lasers`: random network laser on a Gabriel-graph waveguide mesh with a pixelated (DMD-style) pump and
  saturable gain. Pointer pumps the network.
- `kan`: physical Kolmogorov-Arnold network; each edge is a heterogeneous nonlinear device curve, retuned
  by random perturbations. Pointer drives the nodes.

Force one with `?field=ice`, `?field=lasers` or `?field=kan` on any page URL. Parameters sit at the top of
each `make...()` function in `js/fields.js`. Users with reduced motion enabled get a still frame.

## Publish on GitHub Pages (free)

1. Create a **public** repository, e.g. `neuromorphic-metamaterials`.
2. Upload the contents of this folder to the repository root (drag and drop on the repo page works).
3. Settings > Pages > Build and deployment: Source *Deploy from a branch*, Branch `main`, folder `/ (root)`.
4. The site appears at `https://<username>.github.io/neuromorphic-metamaterials/` within a minute or two.

For a shorter address, create a GitHub organisation and name the repo `<org>.github.io`.
A custom domain can be added later under Settings > Pages.

## Editing

The header and footer are repeated in each page; change them in all five files.

- People: copy an `<li>` in `people.html`. Photo for the PI: replace the `.photo` div with
  `<img class="photo" src="assets/people/jack.jpg" alt="Jack Gartside">` (portrait, 4:5).
- Publications: copy an `<li>` (or a whole `.pub-year` block) in `publications.html`. The three papers on
  the home page are listed separately in `index.html`.

## Placeholders to replace

- `your.email@imperial.ac.uk` (footer on every page, people, join)
- Google Scholar and ORCID links (`href="#"`)
- Paper links and author lists
- Member names and topics
