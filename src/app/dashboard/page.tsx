"use client";

export default function DashboardPage() {
  return (
    <>
      <h1 style={{margin: 0, padding: 10, textAlign: 'center'}}>Dashboard</h1>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <iframe title="Dashboard" width="1024" height="612" src="https://app.powerbi.com/view?r=eyJrIjoiYzFmMjE0ZWEtYzg1Yi00YjU4LTlhYjAtYzhlMTk4N2ZiMWQ5IiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9" frameBorder="0" allowFullScreen={true} className="powerbi-iframe"/>
      </div>
    </>
  );
}
