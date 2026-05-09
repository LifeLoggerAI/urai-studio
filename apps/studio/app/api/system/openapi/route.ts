import { NextResponse } from 'next/server';

import spec from '@/system/urai-studio.openapi.json';

export const dynamic = 'force-dynamic';

type OpenApiDocument = {
  openapi?: string;
  info?: {
    title?: string;
    version?: string;
  };
  paths?: Record<string, unknown>;
  [key: string]: unknown;
};

export async function GET() {
  const body = spec as OpenApiDocument;

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
