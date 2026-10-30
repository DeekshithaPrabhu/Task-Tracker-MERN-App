import { STATUS, PRIORITY } from '@/utils';

export default function Breakdown({ title, data, keys }) {
  const max = Math.max(1, ...keys.map((k) => data[k] || 0));
  return (
    <section className="panel">
      <h2>{title}</h2>
      {keys.map((k) => (
        <div className="bar-row" key={k}>
          <span>{STATUS[k] || PRIORITY[k]}</span>
          <div className="bar"><i className={`b-${k}`} style={{ width: `${((data[k] || 0) / max) * 100}%` }} /></div>
          <b>{data[k] || 0}</b>
        </div>
      ))}
    </section>
  );
}
