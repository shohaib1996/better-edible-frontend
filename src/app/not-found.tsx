export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold', margin: 0 }}>500</h1>
      <p style={{ fontSize: '1.25rem', color: '#666' }}>Page not found</p>
      <a href="/home" style={{ marginTop: '1rem', color: '#f97316', textDecoration: 'underline' }}>Go to Admin</a>
    </div>
  );
}
