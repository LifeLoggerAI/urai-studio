'use client';

import { useParams } from 'next/navigation';
import React from 'react';

const ItemPage = () => {
  const params = useParams();
  const { id } = params;

  // Placeholder data - replace with real data from Firestore
  const item = {
    id: id,
    title: 'My first video',
    description: 'A test video uploaded to the platform.',
    statusSummary: 'ready',
    createdAt: '2023-10-27',
  };

  const uploads = [
    { id: 'upload1', fileName: 'raw_video.mp4', status: 'validated', createdAt: '2023-10-27' }
  ];

  const versions = [
    {
      id: 'v1',
      recipeId: 'default',
      status: 'ready',
      createdAt: '2023-10-27',
      outputs: {
        thumb: '/outputs/placeholder_thumb.jpg',
        srt: '/outputs/placeholder_captions.srt',
        mp4: '/outputs/placeholder_video.mp4',
      }
    }
  ];

  const jobs = [
      { id: 'job1', type: 'transcode', status: 'succeeded', progressPct: 100 },
      { id: 'job2', type: 'captions', status: 'succeeded', progressPct: 100 },
      { id: 'job3', type: 'thumbnail', status: 'succeeded', progressPct: 100 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
      <p className="text-gray-500 mb-4">Item ID: {item.id}</p>
      <p className="mb-6">{item.description}</p>

      {/* Uploads Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Uploads</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {uploads.map((upload) => (
              <li key={upload.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{upload.fileName}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${upload.status === 'validated' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {upload.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Uploaded on {upload.createdAt}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Versions and Jobs Timeline */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Processing Timeline</h2>
        {versions.map((version) => (
          <div key={version.id} className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold">Version: {version.id}</h3>
            <p className="text-sm text-gray-500 mb-4">Created on {version.createdAt}</p>

            <h4 className="font-semibold mb-2">Jobs</h4>
            <ul className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <li key={job.id} className="py-4">
                  <div className="flex justify-between">
                    <p className="font-medium">{job.type}</p>
                    <p className={`font-semibold ${job.status === 'succeeded' ? 'text-green-600' : 'text-red-600'}`}>{job.status}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${job.progressPct}%` }}></div>
                  </div>
                </li>
              ))}
            </ul>

            <h4 className="font-semibold mt-6 mb-2">Outputs</h4>
            <div className="flex space-x-4">
              <a href={version.outputs.mp4} className="text-indigo-600 hover:text-indigo-900">Download Video</a>
              <a href={version.outputs.srt} className="text-indigo-600 hover:text-indigo-900">Download Captions</a>
              <a href={version.outputs.thumb} className="text-indigo-600 hover:text-indigo-900">Download Thumbnail</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemPage;
