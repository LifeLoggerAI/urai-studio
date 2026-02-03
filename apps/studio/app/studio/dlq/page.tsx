
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StudioDLQItem } from "../../schemas";

export default function StudioDLQPage() {
  const [dlqItems, setDlqItems] = useState<StudioDLQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDlqItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dlq");
      if (!response.ok) {
        throw new Error(`Failed to fetch DLQ items: ${response.statusText}`);
      }
      const data = await response.json();
      const toDate = (ts: any) => ts && ts._seconds ? new Date(ts._seconds * 1000) : null;
      setDlqItems(data.dlqItems.map((item: any) => ({ 
        ...item, 
        createdAt: toDate(item.createdAt), 
        lastError: { ...item.lastError, at: toDate(item.lastError.at) }
      })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDlqItems();
  }, []);

  const handleDismiss = async (dlqId: string, jobId: string) => {
    if (!confirm("Are you sure you want to dismiss this item? This cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch("/api/dlq", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dlqId, jobId }),
      });
      if (!response.ok) {
        throw new Error("Failed to dismiss the item.");
      }
      alert("Item dismissed successfully.");
      fetchDlqItems(); // Refresh the list
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="relative mx-auto max-w-[980px] px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold">Dead Letter Queue</h1>
          <p className="mt-1 text-sm text-zinc-600">Jobs that have terminally failed and require manual review.</p>
        </div>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-zinc-300">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-6">Job ID</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Reason</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Failed At</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {loading ? (
                      <tr><td colSpan={4} className="text-center py-8 text-zinc-500">Loading DLQ items...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={4} className="text-center py-8 text-rose-600">Error: {error}</td></tr>
                    ) : dlqItems.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-zinc-500">The Dead Letter Queue is empty.</td></tr>
                    ) : (
                      dlqItems.map((item) => (
                        <tr key={item.dlqId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-zinc-700 sm:pl-6">{item.jobId}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-rose-700 max-w-sm truncate" title={item.lastError.message}>{item.reason}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">{item.lastError.at?.toLocaleString()}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-4">
                            <Link href={`/studio/jobs/${item.jobId}`} className="text-indigo-600 hover:text-indigo-900">Replay</Link>
                            <button onClick={() => handleDismiss(item.dlqId, item.jobId)} className="text-rose-600 hover:text-rose-900">Dismiss</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex items-center justify-between text-xs text-zinc-500">
          <div>URAI Studio • v1</div>
          <div className="flex gap-4">
            <Link className="hover:text-zinc-900" href="/studio">Home</Link>
            <Link className="hover:text-zinc-900" href="/studio/jobs">Jobs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
