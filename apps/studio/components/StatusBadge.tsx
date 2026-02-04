
interface StatusBadgeProps {
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors = {
    QUEUED: "bg-gray-500",
    RUNNING: "bg-blue-500",
    SUCCEEDED: "bg-green-500",
    FAILED: "bg-red-500",
  };

  return <span className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded-full ${statusColors[status]}`}>{status}</span>;
}
