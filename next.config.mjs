// next.config.mjs
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ["cdn.discordapp.com"], // Add this line to allow Discord images
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcrypt"],
  },
};

export default config;