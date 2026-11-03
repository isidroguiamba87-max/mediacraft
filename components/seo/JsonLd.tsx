/**
 * Renders one JSON-LD `<script>` tag. `JSON.stringify` alone isn't safe to
 * embed in a `<script>` this way — if any string value (an event title
 * pulled from Pulse, say) ever contained `</script>`, it would close the
 * tag early and the rest could render as HTML. Escaping `<` to `<`
 * is the standard fix: invisible to JSON parsers, impossible to break out
 * of the tag with.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
