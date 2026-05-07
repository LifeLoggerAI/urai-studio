import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'URAI Studio cinematic AI systems for memory, media, and spatial intelligence';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background:
            'radial-gradient(circle at 20% 20%, #244170 0, #080b15 48%, #03050a 100%)',
          color: '#f3f7ff',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 28, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9dbdff' }}>
            URAI Studio
          </div>
          <div style={{ fontSize: 22, color: '#a7b8d8' }}>www.uraistudio.com</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ fontSize: 76, lineHeight: 0.95, letterSpacing: '-0.06em', maxWidth: 900 }}>
            Cinematic systems for memory, media, and spatial intelligence.
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.35, color: '#c6d5f4', maxWidth: 860 }}>
            Premium AI-native creative infrastructure for motion, cinema, visuals, spatial storytelling, and the URAI ecosystem.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 18, color: '#dbe7ff', fontSize: 22 }}>
          <span>Motion</span>
          <span>·</span>
          <span>Cinema</span>
          <span>·</span>
          <span>Spatial</span>
          <span>·</span>
          <span>Visuals</span>
        </div>
      </div>
    ),
    size,
  );
}
