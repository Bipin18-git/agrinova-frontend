import { useState } from "react";
import jsPDF from "jspdf";
import "./App.css";

export default function App() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    initial_objective: "1. Agri allied processing infra use (Max 80% of connected load)",
    latitude: 26.4435,
    longitude: 91.4398,
    land_area_acres: 5.02,
    current_crop: "Paddy",
    state: "Assam",
    max_investment_inr: 500000,
    daily_req_kwh: 20,
    irrigation_available: "true",
    preferred_operation: "Grid-connected",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCSVUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      if (lines.length > 1) {
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const values = lines[1].split(",").map((v) => v.trim());

        const newData = { ...formData };
        headers.forEach((h, index) => {
          if (values[index] !== undefined && values[index] !== "") {
            const val = values[index];
            if (h.includes("objective")) newData.initial_objective = val;
            if (h.includes("lat")) newData.latitude = Number(val);
            if (h.includes("lon")) newData.longitude = Number(val);
            if (h.includes("area") || h.includes("land")) newData.land_area_acres = Number(val);
            if (h.includes("crop")) newData.current_crop = val;
            if (h.includes("state")) newData.state = val;
            if (h.includes("budget") || h.includes("investment")) newData.max_investment_inr = Number(val);
            if (h.includes("load") || h.includes("kwh")) newData.daily_req_kwh = Number(val);
          }
        });
        setFormData(newData);
        alert("CSV data successfully loaded into form! 🚀");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    const payload = {
      project_id: "AV-ASSAM-0001",
      initial_objective: formData.initial_objective,
      location: { latitude: Number(formData.latitude), longitude: Number(formData.longitude) },
      land_area_acres: Number(formData.land_area_acres),
      current_crop: formData.current_crop,
      state: formData.state,
      max_investment_inr: Number(formData.max_investment_inr),
      daily_electricity_req_kwh: Number(formData.daily_req_kwh),
      irrigation_available: formData.irrigation_available === "true",
      preferred_operation: formData.preferred_operation,
    };

    // Render Live Backend URL (No Localhost in Production)
    const BACKEND_URL = "https://agrinova-saas-2.onrender.com";

    try {
      const res = await fetch(`${BACKEND_URL}/api/assess-site`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: "Backend connection failed. Check Render server status." });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!response || !response.step_17_final_recommendation) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105);
    doc.text("AGRINOVA PLATFORM", 105, 18, null, null, "center");
    
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text("Step 17 — Final Agrivoltaics Recommendation Report", 105, 25, null, null, "center");
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 30, 190, 30);
    
    let y = 40;
    doc.setTextColor(17, 24, 39);
    doc.setFont(undefined, 'bold');
    doc.text(`Project ID: ${response.project_id}`, 20, y);
    y += 10;

    doc.setFillColor(5, 150, 105);
    doc.rect(20, y, 170, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("Metric", 25, y + 6);
    doc.text("Value", 115, y + 6);
    y += 8;

    doc.setFont(undefined, 'normal');
    doc.setTextColor(17, 24, 39);

    const metrics = response.step_17_final_recommendation;
    Object.entries(metrics).forEach(([key, val], idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(243, 244, 246);
        doc.rect(20, y, 170, 8, "F");
      }
      doc.text(key.replace(/_/g, ' ').toUpperCase(), 25, y + 6);
      
      const textLines = doc.splitTextToSize(String(val), 80);
      doc.text(textLines, 115, y + 6);
      y += 8 + ((textLines.length - 1) * 5); 
    });

    doc.setDrawColor(229, 231, 235);
    doc.line(20, 280, 190, 280);
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text("Generated automatically by Agrinova Decision Intelligence Engine", 105, 286, null, null, "center");

    doc.save(`${response.project_id}_Step17_Report.pdf`);
  };

  const getGraphData = () => {
    if (!response?.financial_projection) return [];
    const { initial_capex, yearly_savings } = response.financial_projection;
    const years = [];
    for (let yr = 0; yr <= 10; yr++) {
      years.push({ year: yr, investment: initial_capex, return: yr * yearly_savings });
    }
    return years;
  };

  const graphData = getGraphData();
  const maxVal = graphData.length > 0 ? Math.max(...graphData.map(d => Math.max(d.investment, d.return))) * 1.1 : 100000;

  return (
    <div className="saas-container">
      <div className="saas-card">
        
        <div className="saas-header" style={{ marginBottom: '24px' }}>
          <h1 className="saas-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', color: '#065f46' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Agrinova Platform
          </h1>
          <p className="saas-subtitle" style={{ color: '#4b5563', fontSize: '14px' }}>17-Step Agrivoltaics Decision Intelligence Engine • Enterprise Dashboard</p>
        </div>

        {/* DRAG & DROP CSV UPLOAD ZONE */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleCSVUpload(e.dataTransfer.files[0]);
          }}
          style={{ border: '2px dashed #059669', padding: '16px', borderRadius: '8px', textAlign: 'center', marginBottom: '24px', background: '#f0fdf4' }}
        >
          <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#065f46', fontWeight: '600' }}>
            📁 Drag & Drop CSV file here, or click to browse and auto-fill data
          </p>
          <input type="file" accept=".csv" onChange={(e) => { if (e.target.files?.[0]) handleCSVUpload(e.target.files[0]); }} style={{ fontSize: '13px', cursor: 'pointer' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            
            {/* COMPULSORY INITIAL OBJECTIVE SELECTOR */}
            <div className="input-group full-width" style={{ marginBottom: '10px' }}>
              <label style={{ fontWeight: '700', fontSize: '13px', color: '#374151' }}>Project Initial Objective *</label>
              <select name="initial_objective" className="saas-input" value={formData.initial_objective} onChange={handleChange} required style={{ border: '2px solid #059669', backgroundColor: '#f0fdf4', color: '#064e3b', fontWeight: '600' }}>
                <option value="1. Agri allied processing infra use (Max 80% of connected load)">1. Agri allied processing infra use (Max 80% of connected load)</option>
                <option value="2. Agriculture (<10kw)">2. Agriculture (&lt;10kw)</option>
                <option value="3. Dual income through Energy + agri (>500 kw)">3. Dual income through Energy + agri (&gt;500 kw)</option>
                <option value="4. Standalone BESS">4. Standalone BESS</option>
              </select>
            </div>

            <div className="input-group">
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>Latitude (GPS)</label>
              <input type="number" step="any" name="latitude" className="saas-input" value={formData.latitude} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>Longitude (GPS)</label>
              <input type="number" step="any" name="longitude" className="saas-input" value={formData.longitude} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>Land Area (Acres)</label>
              <input type="number" step="0.01" name="land_area_acres" className="saas-input" value={formData.land_area_acres} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>Current Crop</label>
              <input type="text" name="current_crop" className="saas-input" value={formData.current_crop} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>State (DISCOM)</label>
              <select name="state" className="saas-input" value={formData.state} onChange={handleChange}>
                <option value="Assam">Assam (APDCL)</option>
                <option value="Gujarat">Gujarat (DGVCL/UGVCL)</option>
                <option value="Maharashtra">Maharashtra (MSEDCL)</option>
                <option value="Rajasthan">Rajasthan (JVVNL)</option>
                <option value="Uttar Pradesh">Uttar Pradesh (UPPCL)</option>
              </select>
            </div>
            <div className="input-group">
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>Max Budget (INR)</label>
              <input type="number" name="max_investment_inr" className="saas-input" value={formData.max_investment_inr} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>Farm Daily Load (kWh)</label>
              <input type="number" name="daily_req_kwh" className="saas-input" value={formData.daily_req_kwh} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>Irrigation Available?</label>
              <select name="irrigation_available" className="saas-input" value={formData.irrigation_available} onChange={handleChange}>
                <option value="true">Yes, available</option>
                <option value="false">No, rainfed</option>
              </select>
            </div>
            <div className="input-group">
              <label style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>Grid Preference</label>
              <select name="preferred_operation" className="saas-input" value={formData.preferred_operation} onChange={handleChange}>
                <option value="Grid-connected">Grid Connected</option>
                <option value="Off-grid">Off Grid (Battery)</option>
                <option value="Hybrid">Hybrid System</option>
              </select>
            </div>

            <div className="full-width" style={{ marginTop: '10px' }}>
              <button type="submit" disabled={loading} className="saas-button full-width" style={{ padding: '14px', fontSize: '16px' }}>
                {loading ? <div className="spinner"></div> : "⚡ Run Full 17-Step Backend Intelligence Engine"}
              </button>
            </div>
          </div>
        </form>

        {response?.error && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #f87171' }}>
            <strong>Error:</strong> {response.error}
          </div>
        )}

        {response?.step_17_final_recommendation && (
          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* POLICY BANNER */}
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '18px', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>State / DISCOM Policy</div>
                <div style={{ fontSize: '15px', color: '#78350f', fontWeight: '600', marginTop: '4px' }}>⚡ {response.discom_policy_data?.state} ({response.discom_policy_data?.discom_name})</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>Feed-in Tariff</div>
                <div style={{ fontSize: '15px', color: '#d97706', fontWeight: '700', marginTop: '4px' }}>₹{response.discom_policy_data?.feed_in_tariff_inr_per_kwh} / kWh</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>Framework</div>
                <div style={{ fontSize: '15px', color: '#78350f', fontWeight: '600', marginTop: '4px' }}>{response.discom_policy_data?.policy_type}</div>
              </div>
            </div>

            {/* WEATHER DASHBOARD */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '18px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700', textTransform: 'uppercase' }}>Environmental Data Source</div>
                  <div style={{ fontSize: '15px', color: '#0c4a6e', fontWeight: '600', marginTop: '4px' }}>📡 {response.layer_1_environmental?.source}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700', textTransform: 'uppercase' }}>Annual Solar Irradiance</div>
                  <div style={{ fontSize: '15px', color: '#0ea5e9', fontWeight: '700', marginTop: '4px' }}>
                    ☀️ {response.layer_1_environmental?.annual_avg_irradiance_kwh_m2_year} <span style={{ fontSize: '12px', fontWeight: '500' }}>kWh/m²/year</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', borderTop: '1px solid #bae6fd', paddingTop: '14px' }}>
                <div style={{ background: 'white', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                  <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700' }}>TEMPERATURE</div>
                  <div style={{ fontSize: '16px', color: '#0c4a6e', fontWeight: '700', marginTop: '4px' }}>🌡️ {response.layer_1_environmental?.current_temperature_c}°C</div>
                </div>
                <div style={{ background: 'white', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                  <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700' }}>WIND SPEED</div>
                  <div style={{ fontSize: '16px', color: '#0c4a6e', fontWeight: '700', marginTop: '4px' }}>💨 {response.layer_1_environmental?.wind_speed_kmh} km/h</div>
                </div>
                <div style={{ background: 'white', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                  <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700' }}>HUMIDITY</div>
                  <div style={{ fontSize: '16px', color: '#0c4a6e', fontWeight: '700', marginTop: '4px' }}>💧 {response.layer_1_environmental?.relative_humidity_percent}%</div>
                </div>
                <div style={{ background: 'white', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                  <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700' }}>RAINFALL</div>
                  <div style={{ fontSize: '16px', color: '#0c4a6e', fontWeight: '700', marginTop: '4px' }}>🌧️ {response.layer_1_environmental?.precipitation_mm} mm</div>
                </div>
              </div>
            </div>

            {/* INVESTMENT VS RETURN GRAPH */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>📈 Investment vs. Cumulative Return (10-Year Projection)</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>Visualizing initial CAPEX vs. Cumulative Savings Over Time</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '600' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}>🔴 CAPEX (Investment)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}>🟢 Cumulative Returns</span>
                </div>
              </div>

              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg viewBox="0 0 800 280" style={{ width: '100%', height: '260px', overflow: 'visible' }}>
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                    <line key={i} x1="60" y1={20 + ratio * 200} x2="760" y2={20 + ratio * 200} stroke="#f3f4f6" strokeWidth="1" />
                  ))}

                  {graphData.length > 1 && (() => {
                    const getX = (index) => 60 + (index / 10) * 700;
                    const getY = (val) => 220 - (val / maxVal) * 200;

                    const invPoints = graphData.map((d, i) => `${getX(i)},${getY(d.investment)}`).join(" ");
                    const retPoints = graphData.map((d, i) => `${getX(i)},${getY(d.return)}`).join(" ");

                    return (
                      <>
                        <polyline fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="6" points={invPoints} />
                        <polyline fill="none" stroke="#059669" strokeWidth="3.5" points={retPoints} />

                        {graphData.map((d, i) => (
                          <g key={i}>
                            <circle cx={getX(i)} cy={getY(d.return)} r="5" fill="#059669" />
                            <text x={getX(i)} y="245" fontSize="11" fill="#4b5563" textAnchor="middle">Yr {d.year}</text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>
                *Payback period achieved when Green Line crosses Red Investment Line. Estimated Payback: <b>{response.financial_projection?.payback_years} Years</b>.
              </div>
            </div>

            {/* PIPELINE AUDIT TRAIL */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '14px' }}>
                ⚙️ Backend Pipeline Audit Trail (Steps 2 to 16 Complete Execution)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', fontSize: '13px' }}>
                {response.pipeline_status && Object.entries(response.pipeline_status).map(([k, v]) => (
                  <div key={k} style={{ background: 'white', padding: '12px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontWeight: '600' }}>{k}</span>
                    <span style={{ color: '#0f172a', fontWeight: '500', textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 17 FINAL RECOMMENDATION TABLE */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#059669', color: 'white', padding: '18px 24px', fontSize: '17px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>STEP 17 — Final Recommendation Report</span>
                <span style={{ fontSize: '13px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '4px', fontFamily: 'monospace' }}>{response.project_id}</span>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '14px 24px', color: '#374151', width: '45%' }}>Metric</th>
                    <th style={{ padding: '14px 24px', color: '#374151' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(response.step_17_final_recommendation).map(([key, value], idx) => (
                    <tr key={key} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '14px 24px', fontWeight: '600', color: '#4b5563', textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '14px 24px', color: '#111827', fontWeight: '500' }}>
                        {String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              onClick={handleDownloadPDF} 
              style={{ width: "100%", padding: "16px", backgroundColor: "#1f2937", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              📄 Download Step 17 Professional PDF Report
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
