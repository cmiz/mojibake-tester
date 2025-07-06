// app/page.tsx
import GarblerUI from '@/components/GarblerUI'; // Client Componentをインポート

export default function Home() {
  return (
      <div className="container">
        <h1>日本語の文字化けを再現するツール</h1>
        <div className="environments">by Next.js</div>

        {/* Client Component を配置 */}
        <GarblerUI />
      </div>
  );
}