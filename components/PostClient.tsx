"use client";

import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import Header from "./Header";
import Behaviors from "./Behaviors";

export default function PostClient(props: { query: string; variables: Record<string, unknown>; data: any }) {
  const { data } = useTina(props);
  const post = data.post;
  const date = post?.date
    ? new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <>
      <Header home={false} />
      <main className="page">
        <article className="post">
          <a className="post__back" href="/blog/">← All posts</a>
          {date && <p className="post__date" data-tina-field={tinaField(post, "date")}>{date}</p>}
          <h1 className="post__title" data-tina-field={tinaField(post, "title")}>{post?.title}</h1>
          {post?.cover && (
            <div className="post__cover" data-tina-field={tinaField(post, "cover")}>
              <img src={post.cover} alt={post.title || ""} />
            </div>
          )}
          <div className="prose" data-tina-field={tinaField(post, "body")}>
            <TinaMarkdown content={post?.body} />
          </div>
        </article>
      </main>
      <Behaviors page="inner" />
    </>
  );
}
