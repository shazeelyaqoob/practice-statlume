import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { areaPath, linePath } from '@/components/landing/chartPath';

export const alt = 'Statlume: know what sold today. Store analytics that reads like a report.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const NOW = [42, 46, 44, 52, 50, 58, 55, 63, 60, 68, 66, 74, 71, 80];
const BEFORE = [38, 41, 40, 44, 43, 47, 46, 49, 48, 52, 51, 54, 53, 57];
const SCALE = { width: 440, height: 170, min: 30, max: 84 };

/** Share image for links to Statlume, drawn at build time in the brand style. */
export default async function OpengraphImage() {
  const fonts = join(process.cwd(), 'src/fonts/og');
  const [regular, extrabold] = await Promise.all([
    readFile(join(fonts, 'archivo-latin-400-normal.woff')),
    readFile(join(fonts, 'archivo-latin-800-normal.woff')),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#F4F6F3',
        color: '#15191C',
        fontFamily: 'Archivo',
        padding: 64,
        gap: 56,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="52" height="52" viewBox="0 0 48 48">
            <rect x="6" y="29" width="7.5" height="13" rx="1.6" fill="#15191C" />
            <rect x="16.5" y="22" width="7.5" height="20" rx="1.6" fill="#15191C" />
            <rect x="27" y="14.5" width="7.5" height="27.5" rx="1.6" fill="#15191C" />
            <circle cx="39.5" cy="9" r="4.6" fill="#F26B1D" />
          </svg>
          <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.6 }}>statlume</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span style={{ fontSize: 84, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>
            Know what sold today.
          </span>
          <span style={{ fontSize: 30, color: '#5E686D', lineHeight: 1.3 }}>
            Revenue, products, customers and orders, next to the period before.
          </span>
        </div>
        <span style={{ fontSize: 22, color: '#5E686D' }}>Demo store with fictional data</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 480,
          background: '#FFFFFF',
          border: '2px solid #15191C',
          borderRadius: 14,
          padding: 20,
          gap: 16,
          alignSelf: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 2, background: '#15191C1A', borderRadius: 8 }}>
          {[
            ['Net revenue', '$48,210', '+12.4%'],
            ['Orders', '1,284', '+8.1%'],
          ].map(([label, value, change]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                background: '#F4F6F3',
                padding: 16,
                gap: 4,
              }}
            >
              <span style={{ fontSize: 20, color: '#5E686D' }}>{label}</span>
              <span style={{ fontSize: 40 }}>{value}</span>
              <span style={{ fontSize: 20, color: '#127C7A' }}>{change}</span>
            </div>
          ))}
        </div>
        <svg width="440" height="170" viewBox="0 0 440 170">
          <path d={areaPath(NOW, SCALE)} fill="#127C7A1F" />
          <path
            d={linePath(BEFORE, SCALE)}
            fill="none"
            stroke="#E5B92B"
            strokeWidth="3"
            strokeDasharray="8 6"
          />
          <path d={linePath(NOW, SCALE)} fill="none" stroke="#127C7A" strokeWidth="4" />
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: '#F26B1D' }} />
          <span style={{ color: '#C2410C' }}>Bath is down 12.6%</span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Archivo', data: regular, weight: 400, style: 'normal' },
        { name: 'Archivo', data: extrabold, weight: 800, style: 'normal' },
      ],
    },
  );
}
