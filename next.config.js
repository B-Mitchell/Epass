/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname],
      },
}

module.exports = nextConfig
