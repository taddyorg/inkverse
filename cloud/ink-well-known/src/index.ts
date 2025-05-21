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
			if (pathSegments[0] !== '.well-known') {
				return new Response('Not found', { status: 404 });
			}
			
			const type = pathSegments[1];
			const setOfWellKnownTypes = new Set(['security.txt', 'apple-app-site-association', 'assetlinks.json']);
			
			if (!setOfWellKnownTypes.has(type)) {
				return new Response('Not found', { status: 404 });
			}
				
			if (type === 'security.txt') {
				return new Response(securityTxt, {
					headers: {
						'Content-Type': 'text/plain',
					},
				});
			}

			if (type === 'apple-app-site-association') {
				return new Response(appleAppSiteAssociation, {
					headers: {
						'Content-Type': 'application/json',
					},
				});
			}

			if (type === 'assetlinks.json') {
				return new Response(assetLinks, {
					headers: {
						'Content-Type': 'application/json',
					},
				});
			}

			return new Response('Not found', { status: 404 });
		} catch (error) {
			console.error('Error handling request:', error);
			return new Response('Could not load XML', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;

const securityTxt = `
Content-Type: text/plain

Contact: danny@inkverse.co

Policy: https://inkverse.co/terms-of-service/privacy-policy

Expires: ${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()}
`

const appleAppSiteAssociationJSON = {
	"applinks": {
		"apps": [],
		"details": [
			{
				"appID": "4AF4P2U4ZF.art.bamcomics.taddy",
				"paths": ["*"]
			}
		]
	},
	"webcredentials": {
		"apps": [ "4AF4P2U4ZF.art.bamcomics.taddy" ]
	},
}

const appleAppSiteAssociation = JSON.stringify(appleAppSiteAssociationJSON)


const assetLinksJSON = [
	{
		"relation": ["delegate_permission/common.handle_all_urls"],
		"target": {
			"namespace": "android_app",
			"package_name": "com.bamtoons",
			"sha256_cert_fingerprints":
				[
					"05:81:98:F2:01:88:46:12:80:EB:86:7F:05:CC:D7:C9:4B:6D:4A:3A:15:AA:0B:9B:6E:18:8C:5C:5D:32:D4:2B",
					"41:E4:3F:4D:70:13:2E:7A:CE:B3:94:B8:7B:33:A7:CB:62:BE:08:51:F5:4E:D7:3F:15:AF:BA:85:40:5E:C5:74"
				]
		}
	}
]

const assetLinks = JSON.stringify(assetLinksJSON)