export function AuraField() {
  return (
    <div className="aura-field" aria-hidden="true">
      <div className="aura-orb aura-orb-primary" />
      <div className="aura-orb aura-orb-secondary" />
      <div className="aura-ring aura-ring-one" />
      <div className="aura-ring aura-ring-two" />
      <div className="constellation-line line-one" />
      <div className="constellation-line line-two" />
      <div className="constellation-line line-three" />
      {Array.from({ length: 14 }).map((_, index) => (
        <span key={index} className={`star-point star-${index + 1}`} />
      ))}
    </div>
  );
}
