import { Helmet } from "react-helmet-async";

interface SeoProps {
    title: string;
    description: string;
    image?: string;
}

export const Seo = ({ title, description, image }: SeoProps) => (
    <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={window.location.href} />
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {image && <meta property="og:image" content={image} />}
        <meta property="og:url" content={window.location.href} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}
        {/* Structured data */}
        <script type="application/ld+json">{`
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "url": "${window.location.origin}",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "${window.location.origin}/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    `}</script>
    </Helmet>
);
