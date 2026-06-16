import React from 'react';

const LibraryPage = () => {
  // Placeholder data - replace with real data from Firestore
  const contentItems = [
    { id: '1', title: 'My first video', statusSummary: 'ready', createdAt: '2023-10-27' },
    { id: '2', title: 'Another video', statusSummary: 'processing', createdAt: '2023-10-26' },
    { id: '3', title: 'My latest masterpiece', statusSummary: 'failed', createdAt: '2023-10-25' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Content Library</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contentItems.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.statusSummary === 'ready' ? 'bg-green-100 text-green-800' :
                      item.statusSummary === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.statusSummary}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.createdAt}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href={`/app/item/${item.id}`} className="text-indigo-600 hover:text-indigo-900">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LibraryPage;
