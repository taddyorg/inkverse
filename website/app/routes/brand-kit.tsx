import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { loadDocumentation } from "@/lib/loader/documentation.server";
import { getDocumentMeta } from "@/lib/meta/documentation";

import { NotionWrapper } from "../components/ui/NotionWrapper";

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  return await loadDocumentation({ params, request, context }, "/brand-kit");
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) { return []; }
  else if (!data.documentation) { return []; }
  return getDocumentMeta(data.documentation);
};

export default function() {
  const data = useLoaderData<typeof loader>();
  if (!data || !data.documentation || !data.documentation.text) {
    return <div>Could not find post</div>;
  }

  return (
    <NotionWrapper blockText={data.documentation.text}/>
  );
}