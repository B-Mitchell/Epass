/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname],
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;
        return config;
    }
}

module.exports = nextConfig
