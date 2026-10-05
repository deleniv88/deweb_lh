import type { Metadata } from "next";
import { notFound } from "next/navigation";
import client from "../../../tina/__generated__/client";
import PostClient from "../../../components/PostClient";
import { isHidden, NOINDEX, JsonLd, parseSchema, defaultPostSchema } from "../../../lib/seo";

type Params = { params: Promise<{ slug: string }> };

/* статична збірка: лише статті, що існують на момент build */
export const dynamicParams = false;

async function getPost(slug: string) {
  try {
    return await client.queries.post({ relativePath: `${slug}.mdx` });
  } catch {
    return null;
  }
}

/* Усі статті збираються в статичні сторінки під час build */
export async function generateStaticParams() {
  const res = await client.queries.postConnection({ last: 500 });
  return (res.data.postConnection.edges || [])
    .map((e) => e?.node?._sys.filename)
    .filter(Boolean)
    .map((slug) => ({ slug: slug as string }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const res = await getPost(slug);
  if (!res) return {};
  const p = res.data.post;
  return {
    title: `${p.title} — Deweb studio`,
    description: p.excerpt || undefined,
    openGraph: p.cover ? { images: [p.cover] } : undefined,
    robots: (await isHidden({ post: slug })) ? NOINDEX : undefined,
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const res = await getPost(slug);
  if (!res) notFound();
  const p = res.data.post;
  const schema =
    parseSchema(p.seo?.schema) ||
    defaultPostSchema({ slug, title: p.title, description: p.excerpt, date: p.date, image: p.cover });
  return (
    <>
      <JsonLd data={schema} />
      <PostClient data={res.data} query={res.query} variables={res.variables} />
    </>
  );
}
