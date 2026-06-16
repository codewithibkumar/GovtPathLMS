/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output keeps the Docker image small for Coolify deploys.
  output: "standalone",
  reactStrictMode: true,
  images: {
    // Allow course thumbnails served from R2 / Cloudinary / common CDNs.
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.cloudflarestorage.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // mongoose pulls in optional native deps it never uses in our build.
  serverExternalPackages: ["mongoose", "bcryptjs"],
};

module.exports = nextConfig;
