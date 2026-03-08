import type { SlideBackground } from '@/types/presentation';

/** Build a CSS styles object for a slide background (color, gradient, image only – pattern/texture need overlays) */
export function buildBgStyle(bg: SlideBackground): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (bg.type === 'color') {
    style.backgroundColor = bg.value;
  } else if (bg.type === 'gradient') {
    if (bg.gradient) {
      const stops = bg.gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');
      if (bg.gradient.type === 'radial') {
        style.background = `radial-gradient(circle, ${stops})`;
      } else {
        const angle = bg.gradient.type === 'diagonal-lr' ? '135deg' : bg.gradient.type === 'diagonal-rl' ? '225deg' : `${bg.gradient.angle}deg`;
        style.background = `linear-gradient(${angle}, ${stops})`;
      }
    } else {
      style.background = `linear-gradient(${bg.gradientDirection || '135deg'}, ${bg.value}, ${bg.secondaryValue || '#ffffff'})`;
    }
  } else if (bg.type === 'image') {
    if (bg.image) {
      style.backgroundImage = `url(${bg.image.src})`;
      style.backgroundPosition = 'center';
      const fit = bg.image.fit;
      if (fit === 'fill') style.backgroundSize = 'cover';
      else if (fit === 'fit') style.backgroundSize = 'contain';
      else if (fit === 'stretch') style.backgroundSize = '100% 100%';
      else if (fit === 'tile') { style.backgroundSize = 'auto'; style.backgroundRepeat = 'repeat'; }
      else if (fit === 'center') style.backgroundSize = 'auto';
      if (fit !== 'tile') style.backgroundRepeat = 'no-repeat';
    } else {
      style.backgroundImage = `url(${bg.value})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    }
  } else if (bg.type === 'pattern' && bg.pattern) {
    style.backgroundColor = bg.pattern.backgroundColor;
  } else if (bg.type === 'texture') {
    // Handled by overlay
  }
  return style;
}
