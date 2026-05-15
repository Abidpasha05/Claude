/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@restaurant-saas/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    typedRoutes: false,
  },
};
export default nextConfig;
