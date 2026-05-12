const COVER_STYLES = ['minimal', 'nature', 'album', 'elegant'];
const FONT_STYLES = ['modern', 'classic', 'playful', 'elegant'];

function applyCoverClasses(coverPreview, coverStyle, fontStyle, zodiacSign = '') {
  coverPreview.className = 'cover-preview';
  coverPreview.classList.add(`theme-${coverStyle}`);

  if (zodiacSign) {
    coverPreview.classList.add(`zodiac-${zodiacSign}`);
  }
}

function applyPreviewBackground(coverPreview, coverStyle, color) {
  if (coverStyle === 'minimal') {
    coverPreview.style.background = color;
  } else {
    coverPreview.style.background = '';
  }
}

function applyThemeColorToRoot(color) {
  document.documentElement.style.setProperty('--primary-color', color || '#222222');
}

function applyAppCoverStyle(settings) {
  const appLayout = document.getElementById('appLayout');
  if (!appLayout) return;

  appLayout.classList.remove(
    'app-theme-minimal',
    'app-theme-nature',
    'app-theme-album',
    'app-theme-elegant'
  );

  const style = settings?.coverStyle || 'minimal';
  appLayout.classList.add(`app-theme-${style}`);
}