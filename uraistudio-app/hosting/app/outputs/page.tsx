'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function OutputsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [outputs, setOutputs] = useState([]);

  useEffect(() => {
    if (projectId) {
      // TODO: Fetch outputs from the API
      fetch(`/api/projects/${projectId}/outputs`)
        .then(res => res.json())
        .then(data => setOutputs(data));
    }
  }, [projectId]);

  return (
    <div>
      <h1>Project Outputs</h1>
      <ul>
        {outputs.map(output => (
          <li key={output.url}>
            <a href={output.url} target="_blank" rel="noopener noreferrer">
              {output.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
