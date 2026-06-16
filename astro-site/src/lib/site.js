// Build-time data loaders & markdown rendering for the Astro site.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { marked } from 'marked';

// Resolve against the project root (cwd during `astro dev`/`astro build`)
// rather than import.meta.url, which points into dist/ after bundling.
const ROOT = process.cwd();
const DATA = path.join(ROOT, 'src/data');
const PUBLIC = path.join(ROOT, 'public');
const RES = path.join(DATA, 'resources');

export const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

/* ---------------- instruments ---------------- */
export const CAT_NAMES = {
  laboratory_automation: 'Laboratory Automation',
  spectrophotometry: 'Spectrophotometry',
  microscopy: 'Microscopy',
};
const INST_IMG = {
  hamilton_starlet: 'Hamilton', tecan_evo: 'Tecan', opentrons_flex: 'Opentron',
  tecan_spark: null, ti2_u: null, ti2_e: 'Ti2e',
};

function folderImages(folder) {
  if (!folder) return [];
  const dir = path.join(PUBLIC, 'materials/instrumentation/images', folder);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).sort();
  const named = files.filter((f) => !f.startsWith('IMG_') && !/^\d/.test(f));
  const rest = files.filter((f) => !named.includes(f));
  return [...named, ...rest].map((f) => `/materials/instrumentation/images/${enc(folder + '/' + f)}`);
}

export function instruments() {
  const data = yaml.load(fs.readFileSync(path.join(DATA, 'instruments.yaml'), 'utf8'));
  const cats = [];
  for (const [cat, items] of Object.entries(data)) {
    const cards = [];
    for (const [key, info] of Object.entries(items)) {
      const imgs = folderImages(INST_IMG[key]);
      cards.push({ model: info.model || key, desc: info.description || '', img: imgs[0] || null });
    }
    cats.push({ name: CAT_NAMES[cat] || cat, cards });
  }
  return cats;
}

export function instrumentGallery() {
  const out = [];
  for (const folder of ['Hamilton', 'Tecan', 'Opentron', 'Ti2e', 'UR3'])
    for (const src of folderImages(folder)) out.push({ src, label: folder });
  return out;
}

/* ---------------- research images ---------------- */
export function researchImages() {
  const dir = path.join(PUBLIC, 'materials/research/images');
  return fs.readdirSync(dir).sort().map((f) => ({
    src: `/materials/research/images/${encodeURIComponent(f)}`,
    label: f.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
  }));
}

/* ---------------- resources ---------------- */
export const RES_TREE = [
  ['Solutions & Reagents', 'Solutions/README.md', [
    ['Buffers', 'Solutions/Buffers/README.md', [
      ['Phosphate Buffers', 'Solutions/Buffers/Phosphate Buffers.md', []],
      ['Citrate Buffers', 'Solutions/Buffers/Citrate Buffers.md', []],
      ['Cacodylate Buffer', 'Solutions/Buffers/Cacodylate Buffer.md', []],
      ['Tris Buffers', 'Solutions/Buffers/Tris Buffers.md', []],
    ]],
    ['Fixatives & Microscopy Solutions', 'Solutions/Microscopy/README.md', [
      ['Fixative Solutions', 'Solutions/Microscopy/Fixative Solutions/README.md', [
        ['Formaldehyde', 'Solutions/Microscopy/Fixative Solutions/Formaldehyde.md', []],
        ['Glutaraldehyde', 'Solutions/Microscopy/Fixative Solutions/Glutaraldehyde.md', []],
        ['Glyocal', 'Solutions/Microscopy/Fixative Solutions/Glyocal.md', []],
      ]],
      ['Staining', 'Solutions/Microscopy/Staining.md', []],
    ]],
    ['Culture Media', 'Solutions/Culture Media.md', []],
  ]],
  ['Microscopy & Imaging', 'Optical Microscopy/README.md', [
    ['Sample Preparation', 'Optical Microscopy/Sample Preparation/README.md', [
      ['Optical Microscopy', 'Optical Microscopy/Sample Preparation/Optical Microscopy.md', []],
      ['Electron Microscopy', 'Optical Microscopy/Sample Preparation/Electron Microscopy.md', []],
    ]],
    ['Staining Protocols', 'Optical Microscopy/Staining Protocols/README.md', [
      ['Live / Dead', 'Optical Microscopy/Staining Protocols/Live-Dead.md', []],
      ['Nucleus', 'Optical Microscopy/Staining Protocols/Nucleus.md', []],
    ]],
    ['Cell Counting', 'Optical Microscopy/Cell Counting.md', []],
  ]],
  ['Aseptic Techniques', 'Aseptic Techniques/README.md', [
    ['Sterilization of Work Area & Spillage', 'Aseptic Techniques/Sterilization of Work Area and Spillage.md', []],
    ['Sterilization of Equipment & Media', 'Aseptic Techniques/Sterilization of Equipment and Media.md', []],
    ['Waste Disposal', 'Aseptic Techniques/Waste Disposal.md', []],
  ]],
  ['Laboratory Protocols', 'Laboratory Protocols/README.md', [
    ['Storage & Recovery of Culture', 'Laboratory Protocols/Storage and Recovery of Culture.md', []],
  ]],
];

export const slug = (s) => s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'x';

function renderMarkdown(file) {
  let md = fs.readFileSync(path.join(RES, file), 'utf8');
  let lines = md.split('\n');
  if (lines[0]?.startsWith('# ')) lines = lines.slice(1);     // drop title
  md = lines.join('\n').split(/\n#+\s+Subpages\s*\n/)[0].trim();
  if (!md) return { html: '', stub: true };
  md = md.replace(/^(#{1,5}) /gm, '#$1 ');                    // shift headings down one
  let htmlOut = marked.parse(md, { mangle: false, headerIds: false });
  const dir = path.posix.dirname(file);
  // rewrite relative <img src> to /resources/... and tag for lightbox
  htmlOut = htmlOut.replace(/<img ([^>]*?)src="([^"]+)"([^>]*)>/g, (m, a, src, b) => {
    if (!/^https?:|^\//.test(src)) src = '/resources/' + enc(dir + '/' + src);
    return `<img data-zoom ${a}src="${src}"${b}>`;
  });
  return { html: htmlOut, stub: false };
}

export function resourceDocs() {
  const docs = [], nav = [];
  const walk = (node, depth, crumb) => {
    const [title, file, kids] = node;
    const id = slug([...crumb, title].join('-'));
    const { html, stub } = renderMarkdown(file);
    docs.push({ id, depth, title, crumb: crumb.join(' / '), html, stub });
    nav.push({ id, depth: Math.min(depth, 2), title });
    for (const k of kids) walk(k, depth + 1, [...crumb, title]);
  };
  for (const t of RES_TREE) walk(t, 0, []);
  return { docs, nav };
}
