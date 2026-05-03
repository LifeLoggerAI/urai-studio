import { NextResponse } from 'next/server';import { getAssetFactoryHealth } from '@/lib/integrations/assetFactory';
export async function GET(){return NextResponse.json(await getAssetFactoryHealth());}
