/**
 * Renders a JSON-LD <script>. `<` is escaped so CMS/content text can't break
 * out of the script tag. Use for per-page structured data (breadcrumbs,
 * Service, FAQ, …); the site-wide business graph lives in the root layout.
 */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
