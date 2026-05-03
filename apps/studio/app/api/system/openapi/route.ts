import { NextResponse } from 'next/server';import spec from '@/system/urai-studio.openapi.json'; export async function GET(){return NextResponse.json(spec);}
