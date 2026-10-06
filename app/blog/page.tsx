import type { Metadata } from "next";
import client from "../../tina/__generated__/client";
import Header from "../../components/Header";
import Behaviors from "../../components/Behaviors";
import { isHidden, NOINDEX, shareMeta } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Blog — Deweb studio";
  const description = "Notes on websites, conversion and design.";
  return {
    title,
    description,
    ...(await shareMeta({ path: "/blog/", title, description })),
    robots: (await isHidden({ page: "blog" })) ? NOINDEX : undefined,
  };
}

function formatDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPage() {
  const res = await client.queries.postConnection({ sort: "date", last: 100 });
  const posts = (res.data.postConnection.edges || [])
    .map((e) => e?.node)
    .filter(Boolean)
    .sort((a, b) => (b!.date || "").localeCompare(a!.date || ""));

  return (
    <>
      <Header home={false} />
      <main className="page">
        <div className="page__head">
          <h1 className="page__title"><em>Blog</em> &amp; notes</h1>
          <p className="page__lead">Practical notes on websites that bring clients.</p>
        </div>
        {posts.length === 0 ? (
          <p className="blog-empty">No posts yet.</p>
        ) : (
          <ul className="blog-grid">
            {posts.map((p) => (
              <li key={p!._sys.filename}>
                <a className="blog-card" href={`/blog/${p!._sys.filename}`}>
                  <div className="blog-card__media">{p!.cover && <img src={p!.cover} alt="" loading="lazy" decoding="async" />}</div>
                  <span className="blog-card__date">{formatDate(p!.date)}</span>
                  <h2 className="blog-card__title">{p!.title}</h2>
                  {p!.excerpt && <p className="blog-card__excerpt">{p!.excerpt}</p>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Behaviors page="inner" />
    </>
  );
}
