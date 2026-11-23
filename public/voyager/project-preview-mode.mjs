const sizes = {
  desktop: { width: 800, height: 1500 },
  mobile: { width: 320, height: 1600 },
};

export function canScrollProjectPreview(source, width, height, mobile = false, scrollAnimation = null) {
  if (!source || !width || !height) return false;
  if (scrollAnimation === true) return true;
  if (scrollAnimation === false) return false;
  let url;
  try { url = new URL(source, 'https://preview.local'); }
  catch { return false; }
  const filename = url.searchParams.get('name') || url.pathname.split('/').pop() || '';
  const expected = sizes[mobile ? 'mobile' : 'desktop'];
  return /\.jpe?g$/i.test(filename) && width === expected.width && height === expected.height;
}
