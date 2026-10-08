const Placeholder = ({ title }) => {
  return (
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748B' }}>
      <h2>{title} (Coming Soon)</h2>
    </div>
  );
};

export default Placeholder;
