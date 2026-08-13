import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useParams } from "react-router";
import { getBlogPostMeta } from "@/lib/meta/blog-post";
import { getStructuredPost } from "../data/blog";

import { RankedListPostPage } from "../components/blog/RankedListPostPage";

// All blog posts are statically bundled with the route — no Notion fetch.
export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!getStructuredPost(params.slug)) {
    throw new Response("Not Found", { status: 404 });
  }
  return null;
};

export const meta: MetaFunction = ({ params }) => {
  const post = getStructuredPost(params.slug);
  return post ? getBlogPostMeta(post) : [];
};

export default function BlogPost() {
  const { slug } = useParams();

  const post = getStructuredPost(slug);
  if (!post) {
    return <div>Could not find post</div>;
  }

  return <RankedListPostPage post={post} />;
}
