import { getFirebaseAdmin } from '../../../server/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    getFirebaseAdmin();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
