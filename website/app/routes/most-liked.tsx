import { useSearchParams, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { TrendingMetric } from "@inkverse/shared-client/graphql/operations";
import { loadTrending } from "@/lib/loader/trending.server";
import { getMetaTags } from "@/lib/seo";
import { inkverseWebsiteUrl } from "@inkverse/public/utils";
import { trendingMetricTitles } from "@inkverse/shared-client/dispatch/homefeed";
import { TrendingComicsPage } from "./most-discussed";

export const meta: MetaFunction = () => {
  return getMetaTags({
    title: "Most Liked Comics",
    description: "Discover the most liked webtoons and webcomics on Inkverse.",
    url: `${inkverseWebsiteUrl}/most-liked`,
  });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return await loadTrending(request, TrendingMetric.LIKED);
};

export default function MostLikedPage() {
  const [searchParams] = useSearchParams();
  const period = searchParams.get('period') || 'this-week';
  return <TrendingComicsPage key={period} title={trendingMetricTitles[TrendingMetric.LIKED]} basePath="/most-liked" />;
}
