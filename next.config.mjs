/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  experimental: {
    agentUpgrade: 'security',
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
