import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PortfolioSections } from "@/components/portfolio-sections";
import { getPortfolio } from "@/lib/portfolio.functions";

const portfolioQuery = () =>
  queryOptions({ queryKey: ["portfolio"], queryFn: () => getPortfolio() });

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(portfolioQuery()),
  head: () => ({
    meta: [
      { title: "Daniel Ogbeifun — Digital Marketer & Brand Strategist" },
      { name: "description", content: "Strategy, design, and marketing that closes the gap between how valuable brands are and how valuable they look." },
      { property: "og:title", content: "Daniel Ogbeifun — Digital Marketer & Brand Strategist" },
      { property: "og:description", content: "Strategy, design, and marketing that closes the gap between how valuable brands are and how valuable they look." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(portfolioQuery());
  return <PortfolioSections data={data} />;
}
