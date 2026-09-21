import { useState } from "react";
import jsPDF from "jspdf";
import "./App.css";

export default function App() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    const payload = {
      project_id: "AV-ASSAM-0001",
      location: {
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      },
      land_area_acres: Number(formData.land_area_acres),
      current_crop: formData.current_crop,
      state: formData.state,
      max_investment_inr: Number(formData.max_investment_inr),
      daily_electricity_req_kwh: Number(formData.daily_req_kwh),
      irrigation_available: formData.irrigation_available === "true",
      preferred_operation: formData.preferred_operation,
    };

    // Yahan URL update kiya gaya hai
    // Replace the URL inside quotes below with your ACTUAL Render backend URL
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://agrinova-saas-2.onrender.com"; // <--- Bipin: yahan "xxxx" hata kar apna Render wala backend URL daalna hai bina slash (/) ke!

    try {
      const res = await fetch(`${BACKEND_URL}/api/assess-site`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: "Backend connection failed. Is FastAPI running and CORS configured?" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!response) return;

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105);
    doc.text("Agrinova Platform", 105, 20, null, null, "center");
    
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text("Agrivoltaics Site & Risk Assessment Report", 105, 28, null, null, "center");
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 35, 190, 35);
    
    let y = 45;
    doc.setTextColor(17, 24, 39);
    
    // Section 1
    doc.setFont(undefined, 'bold');
    doc.text("1. PROJECT & REGULATORY DETAILS", 20, y);
    doc.setFont(undefined, 'normal');
    y += 10;
    doc.text(`Project ID: ${response.project_id}`, 25, y); y += 8;
    doc.text(`State / DISCOM: ${response.discom_policy_data.state} (${response.discom_policy_data.discom_name})`, 25, y); y += 8;
    doc.text(`Feed-in Tariff: INR ${response.discom_policy_data.feed_in_tariff_inr_per_kwh} / kWh`, 25, y); y += 12;
    
    // Section 2
    doc.setFont(undefined, 'bold');
    doc.text("2. CROP & ENVIRONMENT (NASA POWER)", 20, y);
    doc.setFont(undefined, 'normal');
    y += 10;
    doc.text(`Crop: ${response.layer_3_crop_intelligence.detected_crop} (${response.layer_3_crop_intelligence.crop_type})`, 25, y); y += 8;
    doc.text(`Solar Irradiance: ${response.layer_1_environmental.annual_avg_irradiance_kwh_m2_day} kWh/m2/day`, 25, y); y += 8;
    doc.text(`Data Source: ${response.layer_1_environmental.source}`, 25, y); y += 12;
    
    // Section 3
    doc.setFont(undefined, 'bold');
    doc.text("3. SYSTEM RECOMMENDATION", 20, y);
    doc.setFont(undefined, 'normal');
    y += 10;
    doc.text(`Recommended Capacity: ${response.layer_4_optimization_engine.recommended_capacity_kwp} kWp`, 25, y); y += 8;
    doc.text(`Required Investment: INR ${response.layer_4_optimization_engine.required_capex_inr.toLocaleString('en-IN')}`, 25, y); y += 8;
    doc.text(`Land Utilized: ${response.layer_4_optimization_engine.land_utilized_acres} Acres`, 25, y); y += 12;

    // Section 4
    doc.setFont(undefined, 'bold');
    doc.text("4. FINANCIAL RETURNS", 20, y);
    doc.setFont(undefined, 'normal');
    y += 10;
    doc.text(`Estimated Yearly Savings: INR ${response.layer_5_financials.estimated_yearly_savings_inr.toLocaleString('en-IN')}`, 25, y); y += 8;
    doc.text(`Estimated Payback Period: ${response.layer_5_financials.estimated_payback_period_years} Years`, 25, y); y += 14;

    // Section 5: Challenges
    if (response.implementation_challenges && response.implementation_challenges.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text("5. OPERATIONAL CHALLENGES & RISKS", 20, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(17, 24, 39);
      y += 8;
      response.implementation_challenges.forEach((challenge) => {
        const splitText = doc.splitTextToSize(`- ${challenge}`, 170);
        doc.text(splitText, 25, y);
        y += (splitText.length * 6) + 4;
      });
    }

    doc.setDrawColor(229, 231, 235);
    doc.line(20, 280, 190, 280);
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text("Generated by Agrinova Decision Engine - Risk Assessed", 105, 288, null, null, "center");

    doc.save(`${response.project_id}_Assessment_Report.pdf`);
  };

  return (
    <div className="saas-container">
      <div className="saas-card">
        
        <div className="saas-header">
          <h1 className="saas-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Agrinova Platform
          </h1>
          <p className="saas-subtitle">Agrivoltaics Decision Engine • MVP</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            
            <div className="input-group">
              <label>Latitude (GPS)</label>
              <input type="number" step="any" name="latitude" className="saas-input" value={formData.latitude} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Longitude (GPS)</label>
              <input type="number" step="any" name="longitude" className="saas-input" value={formData.longitude} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Land Area (Acres)</label>
              <input type="number" step="0.01" name="land_area_acres" className="saas-input" value={formData.land_area_acres} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Current Crop</label>
              <input type="text" name="current_crop" className="saas-input" value={formData.current_crop} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>State (DISCOM)</label>
              <select name="state" className="saas-input" value={formData.state} onChange={handleChange}>
                <option value="Assam">Assam (APDCL)</option>
                <option value="Gujarat">Gujarat (DGVCL/UGVCL)</option>
                <option value="Maharashtra">Maharashtra (MSEDCL)</option>
                <option value="Rajasthan">Rajasthan (JVVNL)</option>
                <option value="Uttar Pradesh">Uttar Pradesh (UPPCL)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Max Budget (INR)</label>
              <input type="number" name="max_investment_inr" className="saas-input" value={formData.max_investment_inr} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Farm Daily Load (kWh)</label>
              <input type="number" name="daily_req_kwh" className="saas-input" value={formData.daily_req_kwh} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Irrigation Available?</label>
              <select name="irrigation_available" className="saas-input" value={formData.irrigation_available} onChange={handleChange}>
                <option value="true">Yes, available</option>
                <option value="false">No, rainfed</option>
              </select>
            </div>

            <div className="input-group">
              <label>Grid Preference</label>
              <select name="preferred_operation" className="saas-input" value={formData.preferred_operation} onChange={handleChange}>
                <option value="Grid-connected">Grid Connected</option>
                <option value="Off-grid">Off Grid (Battery)</option>
                <option value="Hybrid">Hybrid System</option>
              </select>
            </div>

            <div className="full-width">
              <button type="submit" disabled={loading} className="saas-button full-width">
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Executing Analysis...
                  </>
                ) : (
                  "Run Agrivoltaic Assessment"
                )}
              </button>
            </div>
            
          </div>
        </form>

        {response?.error && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #f87171' }}>
            <strong>Error:</strong> {response.error}
          </div>
        )}

        {response?.layer_4_optimization_engine && (
          <div className="response-card" style={{ marginTop: '24px', padding: '0', background: 'transparent', border: 'none' }}>
            
            {/* DISCOM Policy Banner */}
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>State / DISCOM</div>
                <div style={{ fontSize: '14px', color: '#78350f', fontWeight: '600', marginTop: '4px' }}>⚡ {response.discom_policy_data?.state} ({response.discom_policy_data?.discom_name})</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>Feed-in Tariff Rate</div>
                <div style={{ fontSize: '14px', color: '#d97706', fontWeight: '700', marginTop: '4px' }}>
                  ₹{response.discom_policy_data?.feed_in_tariff_inr_per_kwh} / kWh
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>Policy Type</div>
                <div style={{ fontSize: '14px', color: '#78350f', fontWeight: '600', marginTop: '4px' }}>{response.discom_policy_data?.policy_type}</div>
              </div>
            </div>

            {/* NASA API & Environment Data Banner */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700', textTransform: 'uppercase' }}>Data Source</div>
                <div style={{ fontSize: '14px', color: '#0c4a6e', fontWeight: '600', marginTop: '4px' }}>📡 {response.layer_1_environmental?.source}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700', textTransform: 'uppercase' }}>Solar Irradiance</div>
                <div style={{ fontSize: '14px', color: '#0ea5e9', fontWeight: '700', marginTop: '4px' }}>
                  ☀️ {response.layer_1_environmental?.annual_avg_irradiance_kwh_m2_day} <span style={{ fontSize: '12px', fontWeight: '500' }}>kWh/m²/day</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700', textTransform: 'uppercase' }}>Project ID</div>
                <div style={{ fontSize: '14px', color: '#0c4a6e', fontFamily: 'monospace', fontWeight: '600', marginTop: '4px' }}>{response.project_id}</div>
              </div>
            </div>

            {/* Implementation Challenges Card */}
            {response.implementation_challenges && response.implementation_challenges.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⚠️ Operational Risks & Implementation Challenges
                </div>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#92400e', fontSize: '13px', lineHeight: '1.6' }}>
                  {response.implementation_challenges.map((challenge, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{challenge}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              
              <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Recommended Plant</div>
                <div style={{ fontSize: '24px', color: '#111827', fontWeight: '700', marginTop: '4px' }}>
                  {response.layer_4_optimization_engine.recommended_capacity_kwp} <span style={{ fontSize: '14px' }}>kWp</span>
                </div>
                <div style={{ fontSize: '13px', color: '#059669', marginTop: '4px' }}>
                  Cost: ₹{response.layer_4_optimization_engine.required_capex_inr?.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Land Utilized</div>
                <div style={{ fontSize: '24px', color: '#111827', fontWeight: '700', marginTop: '4px' }}>
                  {response.layer_4_optimization_engine.land_utilized_acres} <span style={{ fontSize: '14px' }}>Acres</span>
                </div>
                <div style={{ fontSize: '13px', color: '#059669', marginTop: '4px' }}>
                  Free for Farming: {response.layer_4_optimization_engine.remaining_pure_agri_acres} Acres
                </div>
              </div>

              <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Yearly Savings</div>
                <div style={{ fontSize: '24px', color: '#111827', fontWeight: '700', marginTop: '4px' }}>
                  ₹{response.layer_5_financials?.estimated_yearly_savings_inr?.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '13px', color: '#059669', marginTop: '4px' }}>
                  Payback: {response.layer_5_financials?.estimated_payback_period_years} Years
                </div>
              </div>

            </div>

            <button 
              onClick={handleDownloadPDF} 
              style={{ marginTop: "24px", width: "100%", padding: "14px", backgroundColor: "#1f2937", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Download PDF Report (Complete Engine Audit)
            </button>

          </div>
        )}
        
      </div>
    </div>
  );
}