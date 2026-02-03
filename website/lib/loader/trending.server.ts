import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { handleLoaderError } from "./error-handler";
import { GetTrendingComicSeries, type GetTrendingComicSeriesQuery, type GetTrendingComicSeriesQueryVariables, type ComicSeries, TrendingMetric, TrendingPeriod } from "@inkverse/shared-client/graphql/operations";
import { TRENDING_LIMIT_PER_PAGE, trendingPeriodStringToEnum } from "@inkverse/shared-client/dispatch/homefeed";

export type TrendingLoaderData = {
  comicSeries: ComicSeries[];
  metric: string;
  period: string;
  page: number;
  limitPerPage: number;
};

export async function loadTrending(request: Request, metric: TrendingMetric): Promise<TrendingLoaderData> {
  const client = getPublicApolloClient(request);
  const url = new URL(request.url);

  const periodParam = url.searchParams.get('period') || 'this-week';
  const period = (trendingPeriodStringToEnum[periodParam] as TrendingPeriod) || TrendingPeriod.WEEK;
  const page = Math.max(1, Math.min(8, parseInt(url.searchParams.get('page') || '1', 10) || 1));
  const limitPerPage = TRENDING_LIMIT_PER_PAGE;

  try {
    const result = await client.query<GetTrendingComicSeriesQuery, GetTrendingComicSeriesQueryVariables>({
      query: GetTrendingComicSeries,
      variables: { metric, period, page, limitPerPage },
    });

    const comicSeries = result?.data?.getTrendingComicSeries?.comicSeries?.filter(
      (s): s is ComicSeries => s !== null
    ) || [];

    return {
      comicSeries,
      metric,
      period: periodParam,
      page,
      limitPerPage,
    };
  } catch (error) {
    handleLoaderError(error, 'Trending Comics');
  }
}
