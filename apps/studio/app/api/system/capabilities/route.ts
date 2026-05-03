import { NextResponse } from 'next/server';import { systemCapabilities } from '@/lib/studio/types';
export async function GET(){return NextResponse.json({capabilities:systemCapabilities});}
