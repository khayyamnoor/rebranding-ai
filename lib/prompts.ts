import type { AssetType, BrandProfile } from './types';

const PREFIX =
  'Take the logo from the input image and integrate it natively into this scene: ';
const SUFFIX =
  ' Avoid: flat logo placement, sticker appearance, white box around the logo, logo floating above the surface, commercial product-shot framing, hero-shot lighting, bokeh blur, fashion editorial flash, busy compositions, multiple objects competing in the frame, generic stock photography feel.';

function pick<T>(arr: T[] | undefined, i: number, fallback: T): T {
  if (!arr || arr.length === 0) return fallback;
  return arr[i] ?? arr[arr.length - 1];
}

function bodyFor(assetType: AssetType, brand: BrandProfile): string {
  const style = brand.style || 'Luxury Minimal';
  const lighting = brand.lighting || 'soft daylight from one side';
  const m0 = pick(brand.materials, 0, 'premium cotton');
  const m1 = pick(brand.materials, 1, 'marble');
  const p0 = pick(brand.palette, 0, '#C9A84C');
  const p1 = pick(brand.palette, 1, '#1A1714');

  switch (assetType) {
    case 'towel':
      return `A single folded towel resting on a stone surface. ${lighting}, no flash. The logo is tonally embroidered into the cotton fibres — same color family as the towel, slightly lighter — with realistic thread texture and a soft shadow that follows the weave. Style: ${style}. Materials: ${m0}, ${m1}. Composition: still life, the towel set into the lower third of the frame, generous negative space above. Quiet, architectural, near-silent. Photorealistic fabric texture.`;
    case 'bottle':
      return `A single matte glass bottle on a ${m1} counter. Quiet corner of a bathroom, late afternoon, ${lighting}. The logo is screen-printed directly onto the curved label area, conforming to the bottle's surface curvature with realistic ink density and a soft catch of light on the print. Style: ${style}. Composition: vertical, the bottle placed off-center against a clean wall, the rest of the frame left empty. Stillness, refinement. Photorealistic glass and ink.`;
    case 'robe':
      return `A bathrobe hung against a textured wall. Slow morning, ${lighting}. The logo is tonally embroidered onto the chest panel with raised satin stitching that follows the waffle weave, casting soft thread shadows. Style: ${style}. Materials: ${m0}, premium terrycloth. Composition: vertical, the robe occupying the right half of the frame, the left half held as quiet negative space. Architectural, calm. Photorealistic fabric drape.`;
    case 'box':
      return `A closed rigid gift box on a paper-textured surface. Single warm side-light, long shadow falling across the surface. The logo is foil-stamped and lightly debossed into the lacquered lid, with realistic metallic foil reflectance and a soft pressed indentation in the paper stock. Style: ${style}. Materials: ${m0}, lacquered finish, matte paper. Composition: overhead three-quarter view, the box set into the corner of the frame, generous empty space around it. Permanence, restraint. Photorealistic foil and paper.`;
    case 'card':
      return `A single key card resting on a folded linen runner. Window light from one side. The logo is rendered directly on the card face as a UV-coated spot finish over the matte print, picking up a subtle highlight at the viewing angle, fully part of the card surface. Style: ${style}. Colors: ${p0}, ${p1}. Composition: close, slight angle, generous negative space above the card. Quiet, tactile. Photorealistic card material.`;
    case 'hanger':
      return `A door hanger against a deep wood-grain door. Hallway light, late afternoon. The logo is letterpress-printed into the matte card stock with a tactile pressed impression, ink sitting slightly below the paper surface, fully integrated with the card. Style: ${style}. Materials: premium card stock, matte finish, ${p0} as a single thread of color. Composition: vertical, the hanger occupying the central third of the frame, the door's wood grain visible around it. Stillness. Photorealistic paper texture.`;
    case 'stationery':
      return `Stationery laid out on a ${m1} surface — a single letterhead, a business card placed at a slight angle, a sealed envelope. Soft overhead daylight. The logo is letterpress-engraved into the cotton paper of each piece — a clean blind impression on the letterhead, a subtle ink-and-deboss on the business card, a tonal mark on the envelope flap — fully part of each paper surface. Style: ${style}. Materials: ${m0}, premium cotton paper. Composition: overhead, asymmetric arrangement, breathing room between the pieces. Editorial, calm. Photorealistic paper grain.`;
    case 'cup':
      return `A single ceramic cup on a stone surface, espresso settling. Quiet morning light. The logo is screen-printed directly onto the cup, wrapping naturally around its curved surface with the matte finish of the ceramic, fully part of the cup. Style: ${style}. Materials: ceramic, ${m0}. Composition: slight overhead, cup off-center, generous empty space around it. Stillness, refinement. Photorealistic ceramic surface.`;
    case 'fabric':
      return `A premium silk or fine cotton fabric draped over a polished brass horizontal bar against a deep black backdrop. The brand's logo monogram is repeated as a tonal pattern across the entire fabric — same color family as the textile, slightly lighter, woven into the fibres so it reads as an elegant repeating watermark rather than printed on top. The pattern conforms to the fabric's natural folds and drape. Style: ${style}. Materials: ${m0}, brass hardware. Lighting: single-source chiaroscuro, the fabric catching highlights with deep shadows. Composition: cinematic, the fabric flowing with realistic weight. Architectural. Photorealistic fabric weave.`;
    case 'social':
      return `A phone resting face-up on a ${m1} surface, displaying a vertical brand story. The screen content shows the brand's logo monogram natively rendered at the top in ${p0}, a powerful brand tagline below in elegant serif typography in cream, set against a deep ${p1} background. Single overhead light, soft, no flash. Style: ${style}. Composition: overhead, the phone placed off-center against the surface texture. No hand. No background environment. Stillness. Photorealistic phone screen rendering and surface texture.`;
    case 'poster':
      return `A printed poster lying on a ${m1} surface. The poster has a deep ${p1} background; the brand's logo monogram is printed in ${p0} foil at the top center, a heritage-style hero image (architectural detail or interior fragment) is framed in the middle, a powerful brand tagline runs in elegant serif type beneath the image — all integrated as part of the printed poster, not overlaid. Style: ${style}. Materials: heavyweight matte poster stock, visible paper grain, ${m0} accents on the surface. Lighting: ${lighting}, soft warm side-light revealing paper texture. Composition: slight overhead angle, the poster filling most of the frame, subtle shadow at the paper edge. Editorial print design. Photorealistic paper grain and ink density.`;
  }
}

export function buildPrompt(assetType: AssetType, brand: BrandProfile): string {
  return PREFIX + bodyFor(assetType, brand) + SUFFIX;
}
