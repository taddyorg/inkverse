import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { handleLoaderError } from "./error-handler";
import { HomeScreen, GetTrendingComicSeries, type HomeScreenQuery, type HomeScreenQueryVariables, type GetTrendingComicSeriesQuery, type GetTrendingComicSeriesQueryVariables, type ComicSeries, TrendingMetric, TrendingPeriod } from "@inkverse/shared-client/graphql/operations";
import { parseLoaderHomeScreen, type HomeScreenLoaderData } from "@inkverse/shared-client/dispatch/homefeed";

export type HomeLoaderData = HomeScreenLoaderData & {
  trendingComicSeries: ComicSeries[] | null;
};

export async function loadHomeScreen({ params, request, context }: LoaderFunctionArgs): Promise<HomeLoaderData> {
  const client = getPublicApolloClient(request);

  try {
    const [homeScreenResult, trendingResult] = await Promise.all([
      client.query<HomeScreenQuery, HomeScreenQueryVariables>({
        query: HomeScreen,
      }),
      client.query<GetTrendingComicSeriesQuery, GetTrendingComicSeriesQueryVariables>({
        query: GetTrendingComicSeries,
        variables: { metric: TrendingMetric.LIKED, period: TrendingPeriod.WEEK, limitPerPage: 6 },
      }),
    ]);

    const data = parseLoaderHomeScreen(homeScreenResult.data);

    if (!data.featuredComicSeries) {
      throw new Response("Not Found", { status: 404 });
    }

    const trendingComicSeries = trendingResult?.data?.getTrendingComicSeries?.comicSeries?.filter(
      (s): s is ComicSeries => s !== null
    ) || null;

    return {
      ...data,
      trendingComicSeries,
    };
  } catch (error) {
    handleLoaderError(error, 'Home Screen');
  }
}
