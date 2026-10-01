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
      {
        name: "description",
        content:
          "Strategy, design, and marketing that closes the gap between how valuable brands are and how valuable they look.",
      },
      { property: "og:title", content: "Daniel Ogbeifun — Digital Marketer & Brand Strategist" },
      {
        property: "og:description",
        content:
          "Strategy, design, and marketing that closes the gap between how valuable brands are and how valuable they look.",
      },
      { property: "og:type", content: "website" },
      // Absolute, because WhatsApp, LinkedIn and email previews ignore relative image paths.
      // Change the domain here if the site moves to a custom domain.
      { property: "og:image", content: "https://brandglow-portfolio.lovable.app/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:url", content: "https://brandglow-portfolio.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Daniel Ogbeifun — Digital Marketer & Brand Strategist" },
      { name: "twitter:image", content: "https://brandglow-portfolio.lovable.app/og-image.jpg" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(portfolioQuery());
  return <PortfolioSections data={data} />;
}
