/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境日志优化
  poweredByHeader: false,

  // Vercel Serverless 部署需要将 Prisma 引擎标记为外部包
  // 否则打包阶段会报错或运行时找不到原生模块
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
}

module.exports = nextConfig
