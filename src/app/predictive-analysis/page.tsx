"use client";

export default function PredictiveAnalysisPage() {
  return (
    <>
     <h1 style={{margin: 0, padding: 10, textAlign: 'center'}}>Predictive Analysis</h1>
     <div style={{display: 'flex', justifyContent: 'center'}}>
        <iframe title="Predictions" width="1024" height="612" src="https://app.powerbi.com/view?r=eyJrIjoiYjMyY2M4MGMtZWZhNC00OGE5LTk3ZjMtZDYzYjUzMzA2NzgzIiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9" frameBorder="0" allowFullScreen={true} className="powerbi-iframe"/>
      </div>
    </>
  );
}
