import { promises as fs } from "fs";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";

export default async function DocPage({ params }: { params: { slug: string } }) {
  const docsDirectory = path.join(process.cwd(), "../docs");
  const filePath = path.join(docsDirectory, `${params.slug}.mdx`);
  const source = await fs.readFile(filePath, "utf8");

  const { content } = await compileMDX({
    source,
    options: { parseFrontmatter: true },
  });

  return <div>{content}</div>;
}
