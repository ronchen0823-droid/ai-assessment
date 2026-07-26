// app/page.tsx
export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .home-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          background: #f7f8fc;
          position: relative;
          overflow: hidden;
        }
        .home-page::before {
          content: '';
          position: fixed;
          top: -30%;
          right: -20%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }
        .home-page::after {
          content: '';
          position: fixed;
          bottom: -20%;
          left: -15%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }
        .home-container {
          max-width: 440px;
          width: 100%;
          position: relative;
          z-index: 1;
        }
        .home-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 52px;
        }
        .home-brand-bar {
          width: 18px;
          height: 2px;
          background: #6366f1;
          border-radius: 2px;
        }
        .home-brand-text {
          font-size: 11px;
          font-weight: 500;
          color: #6366f1;
          letter-spacing: 0.18em;
          font-family: 'Noto Sans SC', sans-serif;
        }
        .home-hero {
          margin-bottom: 44px;
        }
        .home-eyebrow {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 300;
          letter-spacing: 0.06em;
          margin-bottom: 14px;
          font-family: 'Noto Sans SC', sans-serif;
          display: block;
        }
        .home-title {
          font-family: 'Noto Serif SC', serif;
          font-size: clamp(30px, 8vw, 38px);
          font-weight: 700;
          line-height: 1.18;
          color: #0f172a;
          margin-bottom: 14px;
          letter-spacing: -0.02em;
        }
        .home-title-accent {
          color: #6366f1;
        }
        .home-subtitle {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.7;
          font-weight: 300;
          font-family: 'Noto Sans SC', sans-serif;
        }
        .home-section-label {
          font-size: 10.5px;
          color: #94a3b8;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 12px;
          font-weight: 500;
          font-family: 'Noto Sans SC', sans-serif;
        }
        .home-grades {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 36px;
        }
        .home-grade-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 17px 20px;
          border-radius: 14px;
          border: 1.5px solid;
          text-decoration: none;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
          position: relative;
          overflow: hidden;
        }
        .home-grade-link:hover {
          transform: translateX(3px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .home-grade-link-primary { background: rgba(16,185,129,0.05); border-color: rgba(16,185,129,0.2); }
        .home-grade-link-primary:hover { border-color: rgba(16,185,129,0.45); }
        .home-grade-link-middle { background: rgba(59,130,246,0.05); border-color: rgba(59,130,246,0.2); }
        .home-grade-link-middle:hover { border-color: rgba(59,130,246,0.45); }
        .home-grade-link-senior { background: rgba(139,92,246,0.05); border-color: rgba(139,92,246,0.2); }
        .home-grade-link-senior:hover { border-color: rgba(139,92,246,0.45); }
        .home-grade-name {
          font-size: 16px;
          font-weight: 600;
          color: #1a1f2e;
          font-family: 'Noto Serif SC', serif;
          margin-right: 10px;
        }
        .home-grade-badge {
          font-size: 10.5px;
          font-weight: 500;
          padding: 2px 9px;
          border-radius: 20px;
        }
        .home-grade-badge-primary { background: rgba(16,185,129,0.12); color: #059669; }
        .home-grade-badge-middle { background: rgba(59,130,246,0.12); color: #2563eb; }
        .home-grade-badge-senior { background: rgba(139,92,246,0.12); color: #7c3aed; }
        .home-grade-tag {
          font-size: 11.5px;
          color: #94a3b8;
          margin-top: 3px;
          font-weight: 300;
          font-family: 'Noto Sans SC', sans-serif;
        }
        .home-grade-arrow {
          font-size: 18px;
          color: #cbd5e1;
          transition: color 0.18s, transform 0.18s;
          line-height: 1;
        }
        .home-grade-link:hover .home-grade-arrow {
          color: #94a3b8;
          transform: translateX(2px);
        }
        .home-footer {
          display: flex;
          align-items: center;
          gap: 0;
          padding-top: 20px;
          border-top: 1px solid #e8ecf2;
        }
        .home-footer-item {
          font-size: 11.5px;
          color: #94a3b8;
          font-weight: 300;
          font-family: 'Noto Sans SC', sans-serif;
          flex: 1;
          text-align: center;
        }
        .home-footer-item:not(:last-child) {
          border-right: 1px solid #e8ecf2;
        }
      `}</style>

      <main className="home-page">
        <div className="home-container">

          <div className="home-brand">
            <div className="home-brand-bar"></div>
            <span className="home-brand-text">AI 思维课程</span>
          </div>

          <div className="home-hero">
            <span className="home-eyebrow">免费思维状态测评</span>
            <h1 className="home-title">
              孩子的 AI 思维<br />
              <span className="home-title-accent">现在什么水平？</span>
            </h1>
            <p className="home-subtitle">
              家长与孩子各完成一份问卷，约 10 分钟<br />
              AI 实时生成个性化分析报告
            </p>
          </div>

          <p className="home-section-label">选择学段</p>

          <div className="home-grades">
            {[
              { id: 'primary', label: '小学', sub: '4—6年级', tag: '习惯形成期' },
              { id: 'middle', label: '初中', sub: '7—9年级', tag: '思维关键期' },
              { id: 'senior', label: '高中', sub: '10—12年级', tag: '升学冲刺期' },
            ].map((g) => (
              <a key={g.id} href={`/survey/${g.id}`} className={`home-grade-link home-grade-link-${g.id}`}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <span className="home-grade-name">{g.label}</span>
                    <span className={`home-grade-badge home-grade-badge-${g.id}`}>{g.sub}</span>
                  </div>
                  <div className="home-grade-tag">{g.tag}</div>
                </div>
                <span className="home-grade-arrow">›</span>
              </a>
            ))}
          </div>

          <div className="home-footer">
            <span className="home-footer-item">家长问卷 10 题</span>
            <span className="home-footer-item">学生问卷 10 题</span>
            <span className="home-footer-item">报告可分享</span>
          </div>

        </div>
      </main>
    </>
  )
}
