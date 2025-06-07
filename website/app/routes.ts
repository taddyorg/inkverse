import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("blog/:slug?", "routes/blog.tsx"),
    route("open-source/:slug?", "routes/open-source.tsx"),
    route("updates/:slug?", "routes/updates.tsx"),
    route("brand-kit/:slug?", "routes/brand-kit.tsx"),
    route("terms-of-service/:slug?", "routes/terms-of-service.tsx"),
    route("comics/:shortUrl", "routes/comicseries.tsx"),
    route("comics/:shortUrl/:episodeId", "routes/comicissue.tsx"),
    route("creators/:shortUrl", "routes/creator.tsx"),
    route("lists/:id", "routes/list.tsx"),
    route("tagged/:tag", "routes/tag.tsx"),
    route("search/:term/:types?", "routes/search.tsx"),
    route("api/settings", "routes/api.settings.ts"),
    route("download-app", "routes/download-app.tsx"),
    route("reset", "routes/reset.tsx"),
    route("logout", "routes/logout.tsx"),
    route("hosting-provider/:uuid", "routes/hosting-provider.tsx"),
    route("profile/setup", "routes/profile/setup.tsx"),
    route(":username", "routes/profile.tsx"),
] satisfies RouteConfig;
