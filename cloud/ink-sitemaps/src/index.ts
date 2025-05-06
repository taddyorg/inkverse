/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			const url = new URL(request.url);
			const pathSegments = url.pathname.split('/').filter(Boolean);
			
			// Check if the request is for a sitemap
			if (pathSegments[0] === 'sitemap' && pathSegments.length > 1) {
				const type = pathSegments[1];
				
				// Fetch the sitemap from the source
				const response = await fetch(`https://ink0.inkverse.co/sitemap/${type}`);
				
				if (!response.ok) {
					throw new Error(`Failed to fetch sitemap: ${response.status}`);
				}
				
				const xmlContent = await response.text();
				
				// Return the XML content with appropriate headers
				return new Response(xmlContent, {
					headers: {
						'Content-Type': 'application/xml',
						'Cache-Control': 'public, max-age=86400',
					},
					status: 200,
				});
			}
			
			// Handle non-sitemap requests
			return new Response('Not found', { status: 404 });
		} catch (error) {
			console.error('Error handling request:', error);
			return new Response('Could not load XML', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
