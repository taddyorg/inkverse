import { type LoaderFunctionArgs } from "react-router";
import { getPublicApolloClient } from "@/lib/apollo/client.server";
import { handleLoaderError } from "./error-handler";
import { HomeScreen, type HomeScreenQuery, type HomeScreenQueryVariables } from "@inkverse/shared-client/graphql/operations";
import { type ApolloQueryResult } from "@apollo/client";
import { parseLoaderHomeScreen, type HomeScreenLoaderData } from "@inkverse/shared-client/dispatch/homefeed";

export async function loadHomeScreen({ params, request, context }: LoaderFunctionArgs): Promise<HomeScreenLoaderData> {
  const client = getPublicApolloClient(request);

  try {
    const homeScreenResult: ApolloQueryResult<HomeScreenQuery> = await client.query<HomeScreenQuery, HomeScreenQueryVariables>({
      query: HomeScreen,
    });

    const data = parseLoaderHomeScreen(homeScreenResult.data);

    if (!data.featuredComicSeries) {
      throw new Response("Not Found", { status: 404 });
    }

    return data;
  } catch (error) {
    handleLoaderError(error, 'Home Screen');
  }
}