import { PageEditor } from "../../_components/PageEditor";

export default function CustomPageEditor({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  return <PageEditor slug={slug} />;
}
