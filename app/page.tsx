import type { Metadata } from "next";
import client from "../tina/__generated__/client";
import HomeClient from "../components/HomeClient";

/* Дані беруться з content/home/home.json (через Tina) під час збірки */
async function getHome() {
  return client.queries.home({ relativePath: "home.json" });
}

export async function generateMetadata(): Promise<Metadata> {
  const res = await getHome();
  const seo = res.data.home.seo;
  return {
    title: seo?.title || undefined,
    description: seo?.description || undefined,
  };
}

export default async function Page() {
  const res = await getHome();
  return <HomeClient data={res.data} query={res.query} variables={res.variables} />;
}
