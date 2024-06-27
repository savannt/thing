/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
		// Note: we provide webpack above so you should not `require` it
		// Perform customizations to webpack config
		config.module.exprContextCritical = false;
	

		
		// Important: return the modified config
		return config;
	},
}

export default nextConfig;
