"use client";
import { useEffect } from 'react';

const PowerBIReport = () => {
  const dashboardContainerId = "powerbi-report-container";
  const embedUrl = "https://app.powerbi.com/view?r=eyJrIjoiYzFmMjE0ZWEtYzg1Yi00YjU4LTlhYjAtYzhlMTk4N2ZiMWQ5IiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9";

  useEffect(() => {
    const reportContainer = document.getElementById(dashboardContainerId);

    if (reportContainer) {
      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.width = "3000";
      iframe.height = "900";
      iframe.style.border = "none";

      reportContainer.appendChild(iframe);
    }
  }, [embedUrl]);

  return (
    <div id={dashboardContainerId} style={{ height: "900px", width: "3000px" }}></div>
  );
};

export default PowerBIReport;
