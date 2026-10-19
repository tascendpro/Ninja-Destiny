/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Site 100 % statique : `next build` produit le dossier out/, déployable tel quel sur Vercel ou Netlify.
  output: 'export',
};

export default nextConfig;
