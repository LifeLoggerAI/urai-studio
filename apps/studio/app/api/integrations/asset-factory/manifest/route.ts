import { NextResponse } from 'next/server';import { getAssetFactoryManifest } from '@/lib/integrations/assetFactory';
export async function GET(){return NextResponse.json(await getAssetFactoryManifest());}
