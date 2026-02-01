import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

async function getDocsContent(slug: string) {
  const filePath = path.join(process.cwd(), 'docs', `${slug}.md`);
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { content } = matter(fileContents);
    const html = await marked(content);
    return { html };
  } catch (error) {
    return { html: '<p>Document not found.</p>' };
  }
}

export default async function DocsPage({ params }: { params: { slug: string[] } }) {
  const slug = params.slug?.join('/') || 'index'; // Default to index.md if no slug
  const { html } = await getDocsContent(slug);

  return (
    <div className="prose">
      <a href="/docs/ARCHITECTURE">Architecture</a> | <a href="/docs/LOCKDOWN">Lockdown</a>
      <hr />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

// This function is needed for Next.js to know which dynamic routes to build at build time.
export async function generateStaticParams() {
  const docsDirectory = path.join(process.cwd(), 'docs');
  const filenames = fs.readdirSync(docsDirectory);

  return filenames.map((filename) => ({
    slug: [filename.replace(/\.md$/, '')],
  }));
}
