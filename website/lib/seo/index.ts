interface MetaTags {
	title: string | null | undefined;
	description: string | null | undefined;
	url: string | null | undefined;
	imageURL?: string | null | undefined;
}

export const getMetaTags = (metaTags: MetaTags) => {
	const { title, description, url, imageURL = 'https://ink0.inkverse.co/general/inkverse-brandmark-white.png' } = metaTags;

	const improvedTitle = `${title} - Inkverse Webtoons & Webcomics`;

	return [
		{ title: improvedTitle },
		{ name: "description", content: description },

		{ name: 'twitter:card', content: 'summary_large_image' },
		{ name: 'twitter:title', content: improvedTitle },
		{ name: 'twitter:description', content: description },
		{ name: 'twitter:image', content: imageURL },
		{ name: 'twitter:image:src', content: imageURL },

		{ property: 'og:title', content: improvedTitle },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:url', content: url },
		{ property: 'og:image', content: imageURL },
		{ property: 'og:description', content: description },
		{ property: 'og:site_name', content: 'Inkverse Webtoons & Webcomics' },
	];
};
