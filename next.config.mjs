/** Static export so the site can be hosted on GitHub Pages (and later a custom domain). */
const repoBase = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default {
  output: 'export',
  basePath: repoBase,
  images: { unoptimized: true },
  trailingSlash: true,
};
