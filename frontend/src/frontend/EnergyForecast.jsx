"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "./NavBar";
import { apiUrl, FORECAST_API_URL, LSTM_CITY_API_URL, ML_ECOGRID_API_URL } from "../config";

// ── API URLs ──────────────────────────────────────────────────────────────────
const LSTM_CITY_URL  = LSTM_CITY_API_URL;
const XGBOOST_URL    = FORECAST_API_URL;
const ECOGRID_URL    = ML_ECOGRID_API_URL;

// ── Design tokens (matching index.html) ──────────────────────────────────────
const C = {
  bg:"#060810", bg2:"#0c0f1a", bg3:"#111525",
  border:"#1e2440", border2:"#2a3155",
  text:"#e8eaf6", text2:"#8892b0", text3:"#4a5568",
  green:"#00e5a0", red:"#ff4d6d", yellow:"#ffd166",
  blue:"#4d9fff", purple:"#a78bfa",
  solar:"#ffd166", wind:"#4d9fff", hydro:"#00e5a0", thermal:"#ff6b6b",
};

const ZONES   = ["Northern","Southern","Eastern","Western","NorthEastern"];
const CITIES  = ["London","New York","Tokyo","Paris","Berlin","Sydney","Mumbai","Dubai","Singapore","Chicago"];
const ZONE_DOT= {Northern:C.green,Southern:C.blue,Eastern:C.yellow,Western:C.red,NorthEastern:C.purple};

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const fmt  = (n,d=2) => (n==null?"—":Number(n).toFixed(d));
const fmtT = ts => ts?ts.slice(11,16):"—";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes pulse2{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:3px;height:3px}
  ::-webkit-scrollbar-track{background:#060810}
  ::-webkit-scrollbar-thumb{background:#2a3155;border-radius:2px}
`;

// ── Reusable primitives ───────────────────────────────────────────────────────
const Skel = ({h=32,w="100%"}) => (
  <div style={{height:h,width:w,borderRadius:3,
    background:`linear-gradient(90deg,${C.bg3} 25%,${C.border} 50%,${C.bg3} 75%)`,
    backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/>
);

const Card = ({title,badge,children,style={}}) => (
  <div style={{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:6,padding:14,...style}}>
    {(title||badge)&&(
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:600,color:C.text2,letterSpacing:"1.5px",textTransform:"uppercase"}}>{title}</span>
        {badge}
      </div>
    )}
    {children}
  </div>
);

const Badge = ({children,color=C.green,bg="rgba(0,229,160,.12)",border="rgba(0,229,160,.2)"}) => (
  <span style={{fontSize:9,padding:"2px 6px",borderRadius:2,letterSpacing:".5px",textTransform:"uppercase",background:bg,color,border:`1px solid ${border}`}}>{children}</span>
);

const Kpi = ({label,value,unit,color=C.text}) => (
  <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:4,padding:"10px 8px",textAlign:"center"}}>
    <p style={{fontSize:9,color:C.text3,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{label}</p>
    <p style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,color,lineHeight:1}}>{value??"—"}</p>
    <p style={{fontSize:9,color:C.text2,marginTop:2}}>{unit}</p>
  </div>
);

const Bars = ({data=[],vkey="value",colorFn=()=>C.green,maxV,height="100%"}) => {
  const max = maxV??Math.max(...data.map(d=>d[vkey]??0),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:2,height,width:"100%"}}>
      {data.map((d,i)=>(
        <motion.div key={i}
          initial={{height:0}} animate={{height:`${Math.max(2,(d[vkey]/max)*100)}%`}}
          transition={{delay:i*0.015,duration:.35}}
          style={{flex:1,borderRadius:"2px 2px 0 0",background:colorFn(d,i),opacity:.85}}
          title={`${fmtT(d.timestamp??d.datetime??"")} ${fmt(d[vkey])}`}/>
      ))}
    </div>
  );
};

const Spinner = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" style={{animation:"spin 1s linear infinite",flexShrink:0}}>
    <circle cx="12" cy="12" r="10" fill="none" stroke={C.text3} strokeWidth="3" strokeDasharray="30" strokeLinecap="round"/>
  </svg>
);

const RunBtn = ({onClick,loading,disabled,label="▶ Run"}) => (
  <motion.button onClick={onClick} disabled={loading||disabled}
    whileHover={{scale:1.02}} whileTap={{scale:.98}}
    style={{padding:"9px 20px",background:loading||disabled?"#1e2440":`linear-gradient(135deg, ${C.green}, #00b4d8)`,
      color:loading||disabled?C.text3:"#060810",border:"none",borderRadius:4,
      fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,letterSpacing:1,
      textTransform:"uppercase",cursor:loading||disabled?"not-allowed":"pointer",
      display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap",boxShadow:loading||disabled?"none":`0 4px 12px ${C.green}40`}}>
    {loading?<><Spinner/>Computing…</>:label}
  </motion.button>
);

const ErrBox = ({msg}) => msg?(
  <div style={{background:"rgba(255,77,109,.1)",border:"1px solid rgba(255,77,109,.3)",borderRadius:6,padding:"10px 14px",color:C.red,fontSize:12,marginBottom:12}}>
    ⚠ {msg}
  </div>
):null;

// ════════════════════════════════════════════════════════════════
// TAB 1 — Zone LSTM  (ML_ecogrid, port 8000)
// ════════════════════════════════════════════════════════════════
const ZoneLSTM = () => {
  const [zone,setZone]   = useState("Northern");
  const [hours,setHours] = useState(72);
  const [data,setData]   = useState(null);
  const [zones,setZones] = useState(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState(null);
  const [tradeTab,setTradeTab] = useState("buy");
  const [showTable,setShowTable] = useState(false);

  const run = useCallback(async(z=zone,h=hours)=>{
    setLoading(true); setError(null);
    try{
      const r = await fetch(`${ECOGRID_URL}/forecast`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({zone_name:z,forecast_hours:h})});
      if(!r.ok) throw new Error((await r.json()).detail||`HTTP ${r.status}`);
      setData(await r.json());
    }catch(e){setError(e.message);}
    finally{setLoading(false);}
  },[zone,hours]);

  useEffect(()=>{
    run("Northern",72);
    fetch(`${ECOGRID_URL}/zones/summary`).then(r=>r.json()).then(d=>setZones(d.zones)).catch(()=>{});
  },[]);

  const fc = data?.forecast??[];
  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
  const avgS = avg(fc.map(r=>r.total_supply_gw));
  const avgD = avg(fc.map(r=>r.demand_gw));
  const avgP = avg(fc.map(r=>r.price_inr_kwh));
  const mix  = data?.renewable_mix;
  const renPct = mix?mix.solar+mix.wind+mix.hydro:null;
  const vol  = data?.volatility_index??0;
  const ci   = data?.carbon_intensity??0;
  const gaugeColor = vol<5?C.green:vol<12?C.yellow:C.red;

  return (
    <div style={{display:"grid",gridTemplateColumns:"280px 1fr 260px",gap:0,minHeight:"calc(100vh - 140px)"}}>

      {/* LEFT */}
      <div style={{background:C.bg2,borderRight:`1px solid ${C.border}`,padding:14,display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
        <Card title="Select Zone" badge={<Badge>India Grid</Badge>}>
          {ZONES.map(z=>(
            <button key={z} onClick={()=>{setZone(z);run(z,hours);}}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",
                padding:"7px 10px",marginBottom:5,border:`1px solid ${zone===z?ZONE_DOT[z]:C.border}`,
                borderRadius:4,background:zone===z?`${ZONE_DOT[z]}12`:C.bg3,cursor:"pointer",transition:"all .15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:ZONE_DOT[z]}}/>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:12,color:zone===z?ZONE_DOT[z]:C.text}}>{z}</span>
              </div>
              {zones&&(()=>{const zd=zones.find(d=>d.zone===z);if(!zd||zd.error)return null;return(
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:C.yellow}}>₹{fmt(zd.price,2)}</div>
                  <div style={{fontSize:9,padding:"1px 4px",borderRadius:2,textTransform:"uppercase",
                    background:zd.status==="surplus"?"rgba(0,229,160,.1)":"rgba(255,77,109,.1)",
                    color:zd.status==="surplus"?C.green:C.red}}>{zd.status}</div>
                </div>
              );})()}
            </button>
          ))}
        </Card>

        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {[24,48,72].map(h=>(
            <button key={h} onClick={()=>{setHours(h);run(zone,h);}}
              style={{flex:1,padding:"5px 0",border:`1px solid ${hours===h?C.green:C.border}`,
                background:hours===h?C.green:C.bg3,color:hours===h?"#060810":C.text2,
                borderRadius:3,fontSize:10,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
              {h}H
            </button>
          ))}
          <RunBtn onClick={()=>run(zone,hours)} loading={loading}/>
        </div>

        <Card title="Peak Alerts" badge={<Badge color={C.red} bg="rgba(255,77,109,.12)" border="rgba(255,77,109,.2)">{data?.alerts?.length??0}</Badge>}>
          {loading?<><Skel h={56}/><Skel h={56} w="100%" /></>:
          (data?.alerts??[]).length===0?<p style={{fontSize:11,color:C.text3}}>No alerts.</p>:
          <div style={{maxHeight:200,overflowY:"auto"}}>
            {(data.alerts||[]).map((a,i)=>{
              const sc={high:{bg:"rgba(255,77,109,.08)",bc:C.red,tc:C.red},medium:{bg:"rgba(255,209,102,.08)",bc:C.yellow,tc:C.yellow},low:{bg:"rgba(0,229,160,.08)",bc:C.green,tc:C.green}}[a.severity]??{bg:"rgba(0,229,160,.08)",bc:C.green,tc:C.green};
              return(<div key={i} style={{padding:"9px 11px",borderRadius:4,borderLeft:`3px solid ${sc.bc}`,background:sc.bg,marginBottom:6}}>
                <p style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,color:sc.tc,marginBottom:3}}>{(a.type||"").replace(/_/g," ")} · {a.severity}</p>
                <p style={{fontSize:11,color:C.text,lineHeight:1.4}}>{a.message}</p>
                <p style={{fontSize:9,color:C.text3,marginTop:3}}>{a.time}</p>
              </div>);
            })}
          </div>}
        </Card>

        <Card title="Model Accuracy" badge={<Badge color={C.blue} bg="rgba(77,159,255,.12)" border="rgba(77,159,255,.2)">LSTM</Badge>}>
          {!data?.model_metrics?<><Skel h={40}/><Skel h={40}/><Skel h={40}/></>:
          Object.entries(data.model_metrics).map(([k,v])=>(
            <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:4,marginBottom:5}}>
              <span style={{fontSize:9,color:C.text2}}>{k.replace(/_/g," ")}</span>
              <div style={{display:"flex",gap:10}}>
                {["MAE","RMSE","MAPE"].filter(m=>v[m]!=null).map(m=>(
                  <div key={m} style={{textAlign:"center"}}>
                    <span style={{fontSize:7,color:C.text3,display:"block",textTransform:"uppercase"}}>{m}</span>
                    <span style={{fontSize:11,color:C.green}}>{fmt(v[m],2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* CENTER */}
      <div style={{padding:14,display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
        <ErrBox msg={error}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
          <Kpi label="Avg Supply"  value={avgS!==null?fmt(avgS,1):null} unit="GW"         color={C.green}/>
          <Kpi label="Avg Demand"  value={avgD!==null?fmt(avgD,1):null} unit="GW"         color={C.red}/>
          <Kpi label="Avg Price"   value={avgP!==null?fmt(avgP,2):null} unit="₹/kWh"      color={C.yellow}/>
          <Kpi label="Volatility"  value={data?fmt(vol,1):null}         unit="Index"       color={gaugeColor}/>
          <Kpi label="Carbon"      value={data?fmt(ci,0):null}          unit="gCO₂/kWh"   color={C.purple}/>
          <Kpi label="Renewable"   value={renPct!==null?fmt(renPct,1):null} unit="% Share" color={C.blue}/>
        </div>

        <Card title="Supply vs Demand" badge={<span style={{fontSize:10,display:"flex",gap:12}}><span style={{color:C.green}}>━ Supply</span><span style={{color:C.red}}>━ Demand</span></span>}>
          {loading?<Skel h={64}/>:<>
            <Bars data={fc.slice(0,48)} vkey="total_supply_gw" colorFn={()=>C.green}/>
            <div style={{marginTop:4}}><Bars data={fc.slice(0,48)} vkey="demand_gw" colorFn={()=>C.red}/></div>
          </>}
        </Card>

        <Card title="Price Forecast ₹/kWh">
          {loading?<Skel h={52}/>:<Bars data={fc.slice(0,48)} vkey="price_inr_kwh" colorFn={d=>d.price_inr_kwh>(avgP??0)*1.05?C.red:C.yellow}/>}
        </Card>

        <Card title="Generation Breakdown" badge={
          <div style={{display:"flex",gap:10}}>
            {[["Solar",C.solar],["Wind",C.wind],["Hydro",C.hydro],["Thermal",C.thermal]].map(([l,c])=>(
              <span key={l} style={{fontSize:9,color:c}}>━ {l}</span>
            ))}
          </div>}>
          {loading?<Skel h={80}/>:
          [["solar_gw","Solar",C.solar],["wind_gw","Wind",C.wind],["hydro_gw","Hydro",C.hydro],["thermal_gw","Thermal",C.thermal]].map(([k,lab,col])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <span style={{fontSize:9,color:C.text3,width:46,flexShrink:0}}>{lab}</span>
              <div style={{flex:1,height:14}}><Bars data={fc.slice(0,48)} vkey={k} colorFn={()=>col}/></div>
            </div>
          ))}
        </Card>

        <Card title="Hourly Table" badge={
          <button onClick={()=>setShowTable(t=>!t)}
            style={{fontSize:9,color:C.text2,background:"transparent",border:`1px solid ${C.border}`,borderRadius:3,padding:"2px 8px",cursor:"pointer"}}>
            {showTable?"▲ Collapse":"▼ Expand"}
          </button>}>
          {loading?<Skel h={40}/>:showTable?(
            <div style={{maxHeight:280,overflowY:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{background:C.bg2}}>
                  {["Time","Supply","Demand","Price","±","Solar","Wind"].map(h=>(
                    <th key={h} style={{padding:"5px 8px",fontSize:9,color:C.text3,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,textAlign:"right"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {fc.slice(0,48).map((r,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid rgba(30,36,64,.4)`,background:i%2?"rgba(255,255,255,.01)":"transparent"}}>
                      <td style={{padding:"5px 8px",color:C.text2,textAlign:"right",fontFamily:"'JetBrains Mono',monospace"}}>{fmtT(r.timestamp)}</td>
                      <td style={{padding:"5px 8px",color:C.green,textAlign:"right"}}>{fmt(r.total_supply_gw)}</td>
                      <td style={{padding:"5px 8px",color:C.red,textAlign:"right"}}>{fmt(r.demand_gw)}</td>
                      <td style={{padding:"5px 8px",color:C.yellow,textAlign:"right"}}>₹{fmt(r.price_inr_kwh,3)}</td>
                      <td style={{padding:"5px 8px",textAlign:"right",color:r.surplus_deficit>=0?C.green:C.red,fontWeight:500}}>
                        {r.surplus_deficit>=0?"+":""}{fmt(r.surplus_deficit)}
                      </td>
                      <td style={{padding:"5px 8px",color:C.solar,textAlign:"right"}}>{fmt(r.solar_gw)}</td>
                      <td style={{padding:"5px 8px",color:C.wind,textAlign:"right"}}>{fmt(r.wind_gw)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ):<p style={{fontSize:11,color:C.text3}}>{fc.length} hourly rows — click Expand.</p>}
        </Card>

        {/* Zone Comparison */}
        {zones&&(
          <Card title="Zone Comparison" badge={<Badge color={C.purple} bg="rgba(124,58,237,.12)" border="rgba(124,58,237,.2)">Arbitrage</Badge>}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>
                {["Zone","Price ₹","Demand GW","Supply GW","±","Status"].map((h,i)=>(
                  <th key={h} style={{padding:"5px 8px",fontSize:9,color:C.text3,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,textAlign:i===0?"left":"right"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {zones.filter(z=>!z.error).map((z,i)=>(
                  <tr key={z.zone} style={{borderBottom:`1px solid rgba(30,36,64,.5)`,background:z.zone===zone?`${ZONE_DOT[z.zone]}08`:"transparent"}}>
                    <td style={{padding:"7px 8px",color:ZONE_DOT[z.zone]??C.text,fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:11}}>{z.zone}</td>
                    <td style={{padding:"7px 8px",color:C.yellow,textAlign:"right"}}>₹{fmt(z.price,2)}</td>
                    <td style={{padding:"7px 8px",color:C.red,textAlign:"right"}}>{fmt(z.demand_gw)}</td>
                    <td style={{padding:"7px 8px",color:C.green,textAlign:"right"}}>{fmt(z.supply_gw)}</td>
                    <td style={{padding:"7px 8px",textAlign:"right",color:z.surplus_deficit>=0?C.green:C.red,fontWeight:500}}>
                      {z.surplus_deficit>=0?"+":""}{fmt(z.surplus_deficit)}
                    </td>
                    <td style={{padding:"7px 8px",textAlign:"right"}}>
                      <span style={{fontSize:9,padding:"1px 5px",borderRadius:2,textTransform:"uppercase",
                        background:z.status==="surplus"?"rgba(0,229,160,.1)":"rgba(255,77,109,.1)",
                        color:z.status==="surplus"?C.green:C.red}}>{z.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* RIGHT */}
      <div style={{background:C.bg2,borderLeft:`1px solid ${C.border}`,padding:14,display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
        <Card title="Weather Now" badge={<Badge color={C.blue} bg="rgba(77,159,255,.12)" border="rgba(77,159,255,.2)">{zone}</Badge>}>
          {loading||!data?.weather_now?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{[...Array(6)].map((_,i)=><Skel key={i} h={52}/>)}</div>:
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[["Temp",`${fmt(data.weather_now.temperature,1)}°C`],["Wind",`${fmt(data.weather_now.windspeed,1)} m/s`],
              ["Clouds",`${fmt(data.weather_now.cloudcover,0)}%`],["Irrad.",`${fmt(data.weather_now.irradiance,0)} W/m²`],
              ["Humidity",`${fmt(data.weather_now.humidity,0)}%`],["Precip.",`${fmt(data.weather_now.precipitation,2)} mm`]
            ].map(([l,v])=>(
              <div key={l} style={{padding:8,background:C.bg,border:`1px solid ${C.border}`,borderRadius:4}}>
                <p style={{fontSize:9,color:C.text3,textTransform:"uppercase",letterSpacing:1}}>{l}</p>
                <p style={{fontSize:14,fontWeight:500,marginTop:3}}>{v}</p>
              </div>
            ))}
          </div>}
        </Card>

        <Card title="Renewable Mix">
          {!mix?<Skel h={110}/>:(()=>{
            const items=[["solar","Solar",C.solar],["wind","Wind",C.wind],["hydro","Hydro",C.hydro],["thermal","Thermal",C.thermal]];
            return(<>
              <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",gap:1,marginBottom:10}}>
                {items.map(([k,,c])=>(
                  <motion.div key={k} initial={{width:0}} animate={{width:`${mix[k]??0}%`}} transition={{duration:.8}}
                    style={{background:c,minWidth:mix[k]>0?2:0}}/>
                ))}
              </div>
              {items.map(([k,l,c])=>(
                <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{width:8,height:8,borderRadius:2,background:c,flexShrink:0}}/>
                  <span style={{fontSize:11,color:C.text2,flex:1}}>{l}</span>
                  <span style={{fontSize:12,fontWeight:500,color:c}}>{fmt(mix[k],1)}%</span>
                </div>
              ))}
            </>);
          })()}
        </Card>

        <Card title="Volatility Index">
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,color:gaugeColor,lineHeight:1}}>{fmt(vol,1)}</div>
            <p style={{fontSize:10,color:C.text2,textTransform:"uppercase",letterSpacing:1,margin:"6px 0"}}>
              {vol<5?"Low":vol<12?"Moderate":"High Volatility"}
            </p>
            <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
              <motion.div initial={{width:0}} animate={{width:`${Math.min(100,vol*5)}%`}} transition={{duration:1}}
                style={{height:"100%",background:"linear-gradient(90deg,#00e5a0,#ffd166,#ff4d6d)"}}/>
            </div>
          </div>
        </Card>

        <Card title="Carbon Intensity" badge={<Badge>gCO₂/kWh</Badge>}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,color:ci<200?C.green:ci<500?C.yellow:C.red}}>{fmt(ci,0)}</div>
            <div>
              <p style={{fontSize:10,color:C.text2}}>{ci<200?"🌿 Clean grid":ci<500?"⚠ Moderate":"🔴 High emissions"}</p>
              <p style={{fontSize:9,color:C.text3,marginTop:4}}>Renew: {renPct!==null?fmt(renPct,1):"—"}%</p>
            </div>
          </div>
        </Card>

        <Card title="Trade Signals">
          <div style={{display:"flex",gap:4,marginBottom:10}}>
            {["buy","sell"].map(t=>(
              <button key={t} onClick={()=>setTradeTab(t)}
                style={{flex:1,padding:"4px 0",border:`1px solid ${tradeTab===t?C.border2:C.border}`,
                  background:tradeTab===t?C.bg3:"transparent",color:tradeTab===t?C.text:C.text2,
                  fontFamily:"'JetBrains Mono',monospace",fontSize:10,cursor:"pointer",borderRadius:3,textTransform:"uppercase"}}>
                {t}
              </button>
            ))}
          </div>
          {loading?<Skel h={100}/>:(tradeTab==="buy"?data?.buy_windows:data?.sell_windows??[])?.slice(0,8).map((w,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",borderRadius:3,marginBottom:4,
              background:tradeTab==="buy"?"rgba(0,229,160,.06)":"rgba(255,77,109,.06)",
              border:`1px solid ${tradeTab==="buy"?"rgba(0,229,160,.15)":"rgba(255,77,109,.15)"}`}}>
              <div>
                <p style={{fontSize:9,color:tradeTab==="buy"?C.green:C.red,textTransform:"uppercase"}}>{tradeTab}</p>
                <p style={{fontSize:10,color:C.text2}}>{fmtT(w.time)}</p>
              </div>
              <p style={{fontSize:13,fontWeight:500,color:tradeTab==="buy"?C.green:C.red}}>₹{fmt(w.price,3)}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// TAB 2 — City Weather LSTM  (ML/app.py, port 5000)
// ════════════════════════════════════════════════════════════════
const CityLSTM = () => {
  const [city,setCity]   = useState("Mumbai");
  const [data,setData]   = useState(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState(null);
  const [showHourly,setShowHourly] = useState(false);
  const [locLoading,setLocLoading] = useState(false);

  const run = async(c,lat=null,lon=null)=>{
    setLoading(true); setError(null);
    try{
      const payload={city:c};
      if(lat!==null) {payload.lat=lat;payload.lon=lon;}
      const r = await fetch(`${LSTM_CITY_URL}/predict`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!r.ok) throw new Error((await r.json()).error||`HTTP ${r.status}`);
      setData(await r.json());
    }catch(e){setError(e.message);}
    finally{setLoading(false);}
  };

  const detectLocation = ()=>{
    if(!navigator.geolocation){setError("Geolocation not supported");return;}
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({coords:{latitude:lat,longitude:lon}})=>{setCity("My Location");run("My Location",lat,lon);setLocLoading(false);},
      ()=>{setError("Location denied");setLocLoading(false);}
    );
  };

  const cur = data?.hourly?.[0];
  const dailyBar = (data?.daily??[]).slice(0,7).map(d=>({...d,value:d.produced}));
  const demandBar= (data?.daily??[]).slice(0,7).map(d=>({...d,value:d.demand}));

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:20}}>
      {/* Header pill */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",background:C.bg3,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:20}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:C.blue,animation:"pulse2 2s infinite"}}/>
        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:C.blue}}>LSTM City Weather Model</span>
        <span style={{fontSize:10,color:C.text3,marginLeft:"auto"}}>Port 5000 · OpenWeatherMap · Keras</span>
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <input value={city} onChange={e=>setCity(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&run(city)}
          list="cities-list" placeholder="Enter city…"
          style={{flex:1,minWidth:200,padding:"9px 12px",background:C.bg3,border:`1px solid ${C.border2}`,
            borderRadius:6,color:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none"}}/>
        <datalist id="cities-list">{CITIES.map(c=><option key={c} value={c}/>)}</datalist>
        <button onClick={detectLocation} disabled={locLoading}
          style={{padding:"9px 14px",background:C.bg3,border:`1px solid ${C.border2}`,borderRadius:6,color:C.text2,cursor:"pointer",fontSize:13}}>
          {locLoading?"…":"📍"}
        </button>
        <RunBtn onClick={()=>run(city)} loading={loading} label="▶ Predict"/>
      </div>
      <ErrBox msg={error}/>

      {data?.city&&<p style={{fontSize:11,color:C.text3,marginBottom:12}}>📌 {data.city.name}, {data.city.country} ({fmt(data.city.lat,2)}, {fmt(data.city.lon,2)})</p>}

      {/* KPI row */}
      {cur&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          <Kpi label="Producing Now" value={fmt(cur.produced,1)} unit="kWh"  color={C.green}/>
          <Kpi label="Demand Now"    value={fmt(cur.demand,1)}   unit="kWh"  color={C.red}/>
          <Kpi label="Surplus"       value={fmt(cur.surplus,1)}  unit="kWh"  color={cur.surplus>=0?C.green:C.red}/>
          <Kpi label="Price"         value={`$${fmt(cur.price,3)}`} unit={`Humidity ${cur.humidity}%`} color={C.yellow}/>
        </div>
      )}

      {/* Charts */}
      {!loading&&data&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:14,marginBottom:14}}>
          <Card title="7-Day Production" badge={<Badge>kWh</Badge>}>
            <div style={{width:"100%", overflowX:"auto"}}>
              <div style={{minWidth:250}}>
                <Bars data={dailyBar} vkey="value" colorFn={()=>C.green}/>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  {dailyBar.map((d,i)=><span key={i} style={{fontSize:9,color:C.text3,flex:1,textAlign:"center"}}>{new Date(d.date).toLocaleDateString("en",{weekday:"short"})}</span>)}
                </div>
              </div>
            </div>
          </Card>
          <Card title="7-Day Demand" badge={<Badge color={C.red} bg="rgba(255,77,109,.12)" border="rgba(255,77,109,.2)">kWh</Badge>}>
            <div style={{width:"100%", overflowX:"auto"}}>
              <div style={{minWidth:250}}>
                <Bars data={demandBar} vkey="value" colorFn={()=>C.red}/>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  {demandBar.map((d,i)=><span key={i} style={{fontSize:9,color:C.text3,flex:1,textAlign:"center"}}>{new Date(d.date).toLocaleDateString("en",{weekday:"short"})}</span>)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Daily table */}
      {data?.daily&&(
        <Card title="Daily Forecast" style={{marginBottom:14}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{background:C.bg2}}>
                {["Date","Demand","Produced","Surplus","Price","Temp"].map(h=>(
                  <th key={h} style={{padding:"6px 10px",fontSize:9,color:C.text3,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,textAlign:h==="Date"?"left":"right"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {data.daily.map((d,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid rgba(30,36,64,.4)`,background:i%2?"rgba(255,255,255,.01)":"transparent"}}>
                    <td style={{padding:"8px 10px",color:C.text2}}>{new Date(d.date).toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"})}</td>
                    <td style={{padding:"8px 10px",textAlign:"right"}}>{d.demand} kWh</td>
                    <td style={{padding:"8px 10px",textAlign:"right",color:C.green}}>{d.produced} kWh</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontWeight:500,color:d.surplus>=0?C.green:C.red}}>{d.surplus>=0?"+":""}{d.surplus} kWh</td>
                    <td style={{padding:"8px 10px",textAlign:"right",color:C.yellow}}>${d.price}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",color:C.text2}}>{d.temp}°C</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Hourly accordion */}
      {data?.hourly&&(
        <Card title="">
          <button onClick={()=>setShowHourly(h=>!h)}
            style={{width:"100%",display:"flex",justifyContent:"space-between",background:"transparent",border:"none",color:C.text,cursor:"pointer",padding:"2px 0",fontSize:12,fontFamily:"'Syne',sans-serif",fontWeight:600}}>
            <span>⏱ Hourly Breakdown ({data.hourly.length} rows)</span>
            <span style={{color:C.text2}}>{showHourly?"▲":"▼"}</span>
          </button>
          <AnimatePresence>
            {showHourly&&(
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
                <div style={{maxHeight:260,overflowY:"auto",marginTop:10}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead><tr style={{background:C.bg2,position:"sticky",top:0}}>
                      {["Time","Demand","Produced","Price","Humidity"].map(h=>(
                        <th key={h} style={{padding:"5px 8px",fontSize:9,color:C.text3,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,textAlign:h==="Time"?"left":"right"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {data.hourly.map((h,i)=>(
                        <tr key={i} style={{background:i%2?"rgba(255,255,255,.01)":"transparent"}}>
                          <td style={{padding:"5px 8px",color:C.text2,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{h.date} {String(h.hour).padStart(2,"0")}:00</td>
                          <td style={{padding:"5px 8px",textAlign:"right"}}>{fmt(h.demand,1)}</td>
                          <td style={{padding:"5px 8px",textAlign:"right",color:C.green}}>{fmt(h.produced,1)}</td>
                          <td style={{padding:"5px 8px",textAlign:"right",color:C.yellow}}>${fmt(h.price,4)}</td>
                          <td style={{padding:"5px 8px",textAlign:"right",color:C.blue}}>{h.humidity}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// TAB 3 — XGBoost Demand  (pythonfiles, port 5001)
// ════════════════════════════════════════════════════════════════
const XGBoostDemand = () => {
  const [days,setDays]       = useState(7);
  const [startDate,setStart] = useState("");
  const [data,setData]       = useState(null);
  const [loading,setLoading] = useState(false);
  const [error,setError]     = useState(null);
  const [showRows,setShowRows]= useState(false);

  const run = async()=>{
    setLoading(true); setError(null);
    try{
      const r = await fetch(`${XGBOOST_URL}/api/forecast`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({days,startDate:startDate||null})});
      const json = await r.json();
      if(!json.success) throw new Error(json.error||"Forecast failed");
      setData(json.forecast);
    }catch(e){setError(e.message);}
    finally{setLoading(false);}
  };

  const fc     = data?.forecast??[];
  const peaks  = data?.peak_demand??[];
  const maxMW  = fc.length?Math.max(...fc.map(r=>r.prediction)):1;
  const avgMW  = fc.length?fc.reduce((s,r)=>s+r.prediction,0)/fc.length:null;
  const peakMW = fc.length?Math.max(...fc.map(r=>r.prediction)):null;

  // Group by day for mini bar chart
  const byDay = {};
  fc.forEach(r=>{const d=r.datetime.slice(0,10);byDay[d]=(byDay[d]??[]).concat(r.prediction);});
  const dayBars = Object.entries(byDay).map(([d,vs])=>({date:d,value:vs.reduce((a,b)=>a+b,0)/vs.length}));

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",background:C.bg3,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:20}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:C.yellow,animation:"pulse2 2s infinite"}}/>
        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:C.yellow}}>XGBoost Energy Demand Model</span>
        <span style={{fontSize:10,color:C.text3,marginLeft:"auto"}}>Port 5001 · XGBoost · Time-series features</span>
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div>
          <p style={{fontSize:9,color:C.text3,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Forecast Days (1–30)</p>
          <input type="number" value={days} min={1} max={30} onChange={e=>setDays(Number(e.target.value)||7)}
            style={{width:120,padding:"9px 12px",background:C.bg3,border:`1px solid ${C.border2}`,
              borderRadius:6,color:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none"}}/>
        </div>
        <div>
          <p style={{fontSize:9,color:C.text3,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Start Date (optional)</p>
          <input type="date" value={startDate} onChange={e=>setStart(e.target.value)}
            style={{padding:"9px 12px",background:C.bg3,border:`1px solid ${C.border2}`,
              borderRadius:6,color:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none"}}/>
        </div>
        <RunBtn onClick={run} loading={loading} label="▶ Generate Forecast"/>
      </div>
      <ErrBox msg={error}/>

      {/* KPIs */}
      {data&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        <Kpi label="Avg Demand" value={avgMW!==null?fmt(avgMW,1):null} unit="MW" color={C.yellow}/>
        <Kpi label="Peak Demand" value={peakMW!==null?fmt(peakMW,1):null} unit="MW" color={C.red}/>
        <Kpi label="Hours Forecast" value={fc.length} unit={`${days} days`} color={C.blue}/>
      </div>}

      {/* Plot from backend */}
      {data?.plot&&(
        <Card title="Demand Forecast Plot" badge={<Badge color={C.yellow} bg="rgba(255,209,102,.12)" border="rgba(255,209,102,.2)">XGBoost</Badge>} style={{marginBottom:14}}>
          <img src={`data:image/png;base64,${data.plot}`} alt="Demand Forecast"
            style={{width:"100%",borderRadius:6,filter:"invert(1) hue-rotate(180deg)"}}/>
        </Card>
      )}

      {/* Daily avg bar chart */}
      {dayBars.length>0&&(
        <Card title="Daily Average Demand (MW)" style={{marginBottom:14}}>
          <div style={{width:"100%", overflowX:"auto"}}>
            <div style={{minWidth:300}}>
              <Bars data={dayBars} vkey="value" colorFn={(_,i)=>`hsl(${45+i*8},90%,60%)`} maxV={maxMW}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                {dayBars.map((d,i)=><span key={i} style={{fontSize:9,color:C.text3,flex:1,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {new Date(d.date).toLocaleDateString("en",{weekday:"short"})}
                </span>)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Peak alerts */}
      {peaks.length>0&&(
        <Card title="Peak Demand Alerts" badge={<Badge color={C.yellow} bg="rgba(255,209,102,.12)" border="rgba(255,209,102,.2)">{peaks.length}</Badge>} style={{marginBottom:14}}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {peaks.map((p,i)=>(
              <div key={i} style={{padding:"9px 12px",borderRadius:4,borderLeft:`3px solid ${C.yellow}`,background:"rgba(255,209,102,.06)"}}>
                <p style={{fontSize:11,color:C.yellow}}>⚡ {p.message}</p>
                <p style={{fontSize:9,color:C.text3,marginTop:3}}>{p.datetime}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hourly table */}
      {fc.length>0&&(
        <Card title="">
          <button onClick={()=>setShowRows(r=>!r)}
            style={{width:"100%",display:"flex",justifyContent:"space-between",background:"transparent",border:"none",color:C.text,cursor:"pointer",padding:"2px 0",fontSize:12,fontFamily:"'Syne',sans-serif",fontWeight:600}}>
            <span>📊 Hourly Data ({fc.length} rows)</span>
            <span style={{color:C.text2}}>{showRows?"▲":"▼"}</span>
          </button>
          <AnimatePresence>
            {showRows&&(
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
                <div style={{maxHeight:300,overflowY:"auto",marginTop:10}}>
                  <div style={{width:"100%", overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead><tr style={{background:C.bg2,position:"sticky",top:0}}>
                        {["Datetime","Demand (MW)"].map(h=>(
                          <th key={h} style={{padding:"5px 12px",fontSize:9,color:C.text3,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,textAlign:h==="Datetime"?"left":"right"}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {fc.map((r,i)=>(
                          <tr key={i} style={{background:i%2?"rgba(255,255,255,.01)":"transparent"}}>
                            <td style={{padding:"5px 12px",color:C.text2,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{r.datetime}</td>
                            <td style={{padding:"5px 12px",textAlign:"right",color:C.yellow,fontWeight:500}}>{fmt(r.prediction,2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}
    </div>
  );
};

const SiteForecast = () => {
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hours, setHours] = useState(24);

  const run = useCallback(async (nextHours = hours) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [summaryRes, forecastRes] = await Promise.all([
        fetch(apiUrl("/dashboard/site-summary"), { headers }),
        fetch(apiUrl(`/dashboard/site-forecast?hours=${nextHours}`), { headers })
      ]);

      const summaryJson = await summaryRes.json();
      const forecastJson = await forecastRes.json();

      if (!summaryRes.ok || !summaryJson.success) throw new Error(summaryJson.message || "Could not load site summary");
      if (!forecastRes.ok || !forecastJson.success) throw new Error(forecastJson.message || "Could not load site forecast");

      setSummary(summaryJson);
      setData(forecastJson);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    run(24);
  }, []);

  const rows = data?.forecast ?? [];
  const demandBars = rows.map((row) => ({ ...row, value: row.demand_kwh }));
  const priceBars = rows.map((row) => ({ ...row, value: row.price_tokens_per_kwh }));
  const current = summary?.current;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, animation: "pulse2 2s infinite" }} />
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: C.green }}>Telemetry Site Forecast</span>
        <span style={{ fontSize: 10, color: C.text3, marginLeft: "auto" }}>Backend-derived operational forecast</span>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {[12, 24, 48].map((value) => (
          <button key={value} onClick={() => { setHours(value); run(value); }}
            style={{ padding: "8px 14px", border: `1px solid ${hours === value ? C.green : C.border}`, background: hours === value ? `${C.green}18` : C.bg3, color: hours === value ? C.green : C.text2, borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
            {value}H
          </button>
        ))}
        <RunBtn onClick={() => run(hours)} loading={loading} label="Refresh" />
      </div>

      <ErrBox msg={error} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
        <Kpi label="Power Now" value={current ? fmt(current.power_w, 3) : null} unit="W" color={C.green} />
        <Kpi label="Load Now" value={current ? fmt(current.instant_load_kw, 4) : null} unit="kW" color={C.blue} />
        <Kpi label="Energy Today" value={summary ? fmt(summary.totals?.total_energy_today_kwh, 4) : null} unit="kWh" color={C.yellow} />
        <Kpi label="Live Price" value={summary ? fmt(summary.pricing?.final_rate_per_kwh, 3) : null} unit="tok/kWh" color={C.purple} />
        <Kpi label="Device" value={summary?.deviceStatus || null} unit={summary ? `${Math.round((summary.freshnessMs || 0) / 1000)}s freshness` : ""} color={summary?.deviceStatus === "online" ? C.green : C.red} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card title="Demand Forecast" badge={<Badge>kWh</Badge>}>
          {loading ? <Skel h={90} /> : <Bars data={demandBars} vkey="value" colorFn={() => C.blue} />}
        </Card>
        <Card title="Tariff Forecast" badge={<Badge color={C.yellow} bg="rgba(255,209,102,.12)" border="rgba(255,209,102,.2)">tokens</Badge>}>
          {loading ? <Skel h={90} /> : <Bars data={priceBars} vkey="value" colorFn={() => C.yellow} />}
        </Card>
      </div>

      <Card title="Hourly Operational Forecast">
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: C.bg2, position: "sticky", top: 0 }}>
                {["Time", "Demand", "Supply", "Balance", "Price", "Confidence"].map((label) => (
                  <th key={label} style={{ padding: "6px 10px", fontSize: 9, color: C.text3, textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, textAlign: label === "Time" ? "left" : "right" }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} style={{ borderBottom: `1px solid rgba(30,36,64,.4)`, background: index % 2 ? "rgba(255,255,255,.01)" : "transparent" }}>
                  <td style={{ padding: "6px 10px", color: C.text2 }}>{new Date(row.timestamp).toLocaleString()}</td>
                  <td style={{ padding: "6px 10px", color: C.blue, textAlign: "right" }}>{fmt(row.demand_kwh, 4)}</td>
                  <td style={{ padding: "6px 10px", color: C.green, textAlign: "right" }}>{fmt(row.supply_kwh, 4)}</td>
                  <td style={{ padding: "6px 10px", color: row.balance_kwh >= 0 ? C.green : C.red, textAlign: "right" }}>{fmt(row.balance_kwh, 4)}</td>
                  <td style={{ padding: "6px 10px", color: C.yellow, textAlign: "right" }}>{fmt(row.price_tokens_per_kwh, 3)}</td>
                  <td style={{ padding: "6px 10px", color: C.text2, textAlign: "right" }}>{row.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ════════════════════════════════════════════════════════════════
const TABS = [
  { id:"site",   label:"Site Forecast",    sub:"Backend telemetry",       color:C.green,  dot:C.green  },
  { id:"zone",   label:"Zone LSTM",        sub:"ML_ecogrid · Port 8000", color:C.green,  dot:C.green  },
  { id:"city",   label:"City Weather LSTM",sub:"ML · Port 5000",         color:C.blue,   dot:C.blue   },
  { id:"xgb",    label:"XGBoost Demand",   sub:"Pythonfiles · Port 5001",color:C.yellow, dot:C.yellow },
];

const EnergyForecast = () => {
  const [tab,setTab] = useState("site");
  return (
    <>
      <style>{css}</style>
      <NavBar/>
      <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:13,paddingTop:52}}>

        {/* ── Top strip ── */}
        <div style={{background:"rgba(6,8,16,.96)",borderBottom:`1px solid ${C.border}`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,backdropFilter:"blur(20px)"}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,color:C.green}}>
            EcoGrid <span style={{color:C.text2,fontWeight:400}}>/ AI Energy Intelligence</span>
          </span>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:C.green}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse2 2s infinite"}}/>
            LIVE
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{borderBottom:`1px solid ${C.border}`,padding:"0 20px",display:"flex",gap:0,background:C.bg2}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:"12px 24px",border:"none",borderBottom:`2px solid ${tab===t.id?t.color:"transparent"}`,
                background:"transparent",color:tab===t.id?t.color:C.text2,
                fontFamily:"'JetBrains Mono',monospace",fontSize:11,cursor:"pointer",
                transition:"all .2s",display:"flex",flexDirection:"column",gap:2,alignItems:"flex-start"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:t.dot,opacity:tab===t.id?1:.4}}/>
                <span style={{fontWeight:500}}>{t.label}</span>
              </div>
              <span style={{fontSize:9,color:C.text3,paddingLeft:13}}>{t.sub}</span>
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.2}}>
            {tab==="site" && <SiteForecast/>}
            {tab==="zone" && <ZoneLSTM/>}
            {tab==="city" && <CityLSTM/>}
            {tab==="xgb"  && <XGBoostDemand/>}
          </motion.div>
        </AnimatePresence>

        {/* ── Footer ── */}
        <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 24px",display:"flex",justifyContent:"space-between",fontSize:10,color:C.text3}}>
          <span style={{color:C.text2}}>EcoGrid · AI Energy Intelligence</span>
          <span>Zone LSTM (8000) · City LSTM (5000) · XGBoost (5001) · © {new Date().getFullYear()}</span>
        </div>
      </div>
    </>
  );
};

export default EnergyForecast;
