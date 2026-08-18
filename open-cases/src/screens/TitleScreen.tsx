import { ArrowRight, Map, Shield, Users, FolderOpen } from 'lucide-react';

export default function TitleScreen({ 
  onNew, 
  onContinue, 
  hasSave 
}: { 
  onNew: () => void; 
  onContinue: () => void; 
  hasSave: boolean;
}) {
  return (
    <main className="title-screen">
      <div className="title-noise" />
      <div className="title-content">
        <div className="eyebrow">
          <Shield size={14} /> OPEN CASES
        </div>
        <h1>Детективная<br /><em>браузерная игра</em></h1>
        <p className="lead">Расследуйте преступления, связывайте улики и находите преступника в интерактивных сценариях.</p>
        
        <div className="title-meta">
          <span><Map size={16} /> Разные города</span>
          <span><Users size={16} /> 1–6 игроков</span>
          <span>90–120 мин</span>
        </div>
        
        <div className="title-actions">
          <button className="btn primary" onClick={onNew}>
            <FolderOpen size={18} /> Выбрать дело <ArrowRight size={18} />
          </button>
          {hasSave && (
            <button className="btn ghost" onClick={onContinue}>
              Продолжить последнее дело
            </button>
          )}
        </div>
        
        <p className="tiny">Система загрузки сценариев из JSON · добавьте свои дела</p>
      </div>
      
      <div className="title-card">
        <span>ПРИМЕР ДЕЛА</span>
        <strong>ТИШИНА НА МЭДИСОН</strong>
        <small>Доступно в архиве сценариев</small>
        <div className="redacted">CASE-001<br/>СИЭТЛ</div>
      </div>
    </main>
  );
}
