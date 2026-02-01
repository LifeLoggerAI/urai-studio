import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";

export default async function Home() {
  const docsDirectory = path.join(process.cwd(), "../docs");
  const filenames = await fs.readdir(docsDirectory);
  const mdxFiles = filenames.filter((filename) => filename.endsWith(".mdx"));

  return (
    <div>
      <h1>Documentation</h1>
      <ul>
        {mdxFiles.map((filename) => (
          <li key={filename}>
            <Link href={`/${filename.replace(".mdx", "")}`}>
              {filename.replace(".mdx", "")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
