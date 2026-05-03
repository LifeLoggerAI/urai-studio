import { NextResponse } from 'next/server';
import { studioConfig } from '@/lib/studio/config';
import { firebaseDiagnostics } from '@/lib/studio/firebase';
import { studioIntegrations } from '@/lib/studio/integrations';
import { moduleStatuses, statusWarnings } from '@/lib/studio/status';
export async function GET(){return NextResponse.json({ok:true,service:'urai-studio',version:studioConfig.version,environment:studioConfig.environment,timestamp:new Date().toISOString(),uptime:process.uptime(),firebase:firebaseDiagnostics,integrations:studioIntegrations,modules:moduleStatuses(),warnings:statusWarnings()});}
