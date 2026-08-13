interface MetaTags {
	title: string | null | undefined;
	description: string | null | undefined;
	url: string | null | undefined;
	imageURL?: string | null | undefined;
	type?: 'website' | 'article';
	publishedTime?: string;
	modifiedTime?: string;
	authorName?: string;
	tags?: string[];
}

export const getMetaTags = (metaTags: MetaTags) => {
	const {
		title,
		description,
		url,
		imageURL = 'https://ink0.inkverse.co/general/inkverse-brandmark-white.png',
		type = 'website',
		publishedTime,
		modifiedTime,
		authorName,
		tags,
	} = metaTags;

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
		{ property: 'og:type', content: type },
		{ property: 'og:url', content: url },
		{ property: 'og:image', content: imageURL },
		{ property: 'og:description', content: description },
		{ property: 'og:site_name', content: 'Inkverse Webtoons & Webcomics' },

		...(type === 'article' && publishedTime ? [{ property: 'article:published_time', content: publishedTime }] : []),
		...(type === 'article' && modifiedTime ? [{ property: 'article:modified_time', content: modifiedTime }] : []),
		...(type === 'article' && authorName ? [{ property: 'article:author', content: authorName }] : []),
		...(type === 'article' && tags ? tags.map((tag) => ({ property: 'article:tag', content: tag })) : []),

		{ tagName: 'link', rel: 'canonical', href: url },
		{ tagName: 'link', rel: 'image_src', href: imageURL },
	];
};
