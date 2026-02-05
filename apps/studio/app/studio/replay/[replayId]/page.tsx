import ReplayClient from "./ReplayClient";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return [];
}

export default function ReplayPage() {
  return <ReplayClient />;
}
