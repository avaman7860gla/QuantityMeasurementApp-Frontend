import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Ruler, Droplets, Thermometer, ArrowRightLeft, Clock, Scale, Plus, Minus, Divide, Calculator } from 'lucide-react';

const MEASUREMENTS = {
  length: {
    id: 'length',
    name: 'Length',
    icon: Ruler,
    color: 'var(--primary)',
    bg: 'rgba(139, 92, 246, 0.1)',
    units: ['Millimeter', 'Centimeter', 'Meter', 'Kilometer', 'Inch', 'Foot', 'Yard', 'Mile']
  },
  weight: {
    id: 'weight',
    name: 'Weight',
    icon: Scale,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    units: ['Kilogram', 'Gram', 'Pound']
  },
  volume: {
    id: 'volume',
    name: 'Volume',
    icon: Droplets,
    color: 'var(--accent)',
    bg: 'rgba(59, 130, 246, 0.1)',
    units: ['Milliliter', 'Liter', 'Gallon']
  },
  temperature: {
    id: 'temperature',
    name: 'Temperature',
    icon: Thermometer,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    units: ['Celsius', 'Fahrenheit', 'Kelvin']
  }
};

export default function Home() {
  const [activeType, setActiveType] = useState('length');
  const [mode, setMode] = useState('convert'); // 'convert' | 'compare'

  const [inputValue, setInputValue] = useState(1);
  const [outputValue, setOutputValue] = useState(0);

  const [compareValue1, setCompareValue1] = useState(1);
  const [compareValue2, setCompareValue2] = useState(1);
  const [compareResult, setCompareResult] = useState('=');

  const [arithValue1, setArithValue1] = useState(1);
  const [arithValue2, setArithValue2] = useState(1);
  const [arithOp, setArithOp] = useState('+');
  const [arithResult, setArithResult] = useState(0);
  const [arithResultUnit, setArithResultUnit] = useState(MEASUREMENTS.length.units[0]);

  const [inputUnit, setInputUnit] = useState(MEASUREMENTS.length.units[2]); // Meter
  const [outputUnit, setOutputUnit] = useState(MEASUREMENTS.length.units[1]); // Centimeter

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // When type changes, reset units
  const handleTypeChange = (typeId) => {
    setActiveType(typeId);
    setInputUnit(MEASUREMENTS[typeId].units[0]);
    setOutputUnit(MEASUREMENTS[typeId].units[1] || MEASUREMENTS[typeId].units[0]);
    setArithResultUnit(MEASUREMENTS[typeId].units[0]);
    setInputValue(1);
    setOutputValue(0);
    setError('');
  };

  const handleSwap = () => {
    const temp = inputUnit;
    setInputUnit(outputUnit);
    setOutputUnit(temp);
    setInputValue(outputValue);
  };

  const convert = useCallback(async () => {
    if (inputValue === '' || isNaN(inputValue)) {
      setOutputValue('');
      return;
    }

    const restrictedTypes = ['length', 'weight', 'volume'];
    if (restrictedTypes.includes(activeType) && parseFloat(inputValue) < 0) {
      setError(`${MEASUREMENTS[activeType].name} cannot be negative`);
      setOutputValue('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/api/quantity/convert', {
        value: parseFloat(inputValue),
        fromUnit: inputUnit.toUpperCase(),
        toUnit: outputUnit.toUpperCase()
      });

      setOutputValue(Number(data.toFixed(6)));

      setHistory(prev => [
        {
          id: Date.now(),
          mode: 'convert',
          type: activeType,
          fromVal: parseFloat(inputValue),
          fromUnit: inputUnit,
          toVal: Number(data.toFixed(6)),
          toUnit: outputUnit,
          date: new Date().toLocaleTimeString()
        },
        ...prev
      ].slice(0, 8));

    }
    catch (err) {
      console.error(err);
      setError("Conversion failed");
    }
    finally {
      setLoading(false);
    }
  }, [inputValue, inputUnit, outputUnit, activeType]);

  const runCompare = useCallback(async () => {
    if (compareValue1 === '' || compareValue2 === '' || isNaN(compareValue1) || isNaN(compareValue2)) {
      setCompareResult('?');
      return;
    }

    const restrictedTypes = ['length', 'weight', 'volume'];
    if (restrictedTypes.includes(activeType) && (parseFloat(compareValue1) < 0 || parseFloat(compareValue2) < 0)) {
      setError(`${MEASUREMENTS[activeType].name} values cannot be negative`);
      setCompareResult('?');
      return;
    }

    setError('');

    try {
      let baseUnit = "";
      if (activeType === "length") baseUnit = "METER";
      else if (activeType === "weight") baseUnit = "KILOGRAM";
      else if (activeType === "volume") baseUnit = "LITER";
      else if (activeType === "temperature") baseUnit = "CELSIUS";

      const { data: v1 } = await api.post('/api/quantity/convert', {
        value: parseFloat(compareValue1),
        fromUnit: inputUnit.toUpperCase(),
        toUnit: baseUnit
      });

      const { data: v2 } = await api.post('/api/quantity/convert', {
        value: parseFloat(compareValue2),
        fromUnit: outputUnit.toUpperCase(),
        toUnit: baseUnit
      });

      if (Math.abs(v1 - v2) < 0.0001) setCompareResult('=');
      else if (v1 > v2) setCompareResult('>');
      else setCompareResult('<');

      const resStr = Math.abs(v1 - v2) < 0.0001 ? '=' : (v1 > v2 ? '>' : '<');

      setHistory(prev => [
        {
          id: Date.now(),
          mode: 'compare',
          type: activeType,
          val1: parseFloat(compareValue1),
          unit1: inputUnit,
          val2: parseFloat(compareValue2),
          unit2: outputUnit,
          result: resStr,
          date: new Date().toLocaleTimeString()
        },
        ...prev
      ].slice(0, 8));

    } catch (err) {
      console.error(err);
      setCompareResult('?');
    }
  }, [compareValue1, compareValue2, inputUnit, outputUnit, activeType]);

  const runArithmetic = useCallback(async () => {
    if (arithValue1 === '' || arithValue2 === '' || isNaN(arithValue1) || isNaN(arithValue2)) {
      setArithResult('?');
      return;
    }

    const restrictedTypes = ['length', 'weight', 'volume'];
    if (restrictedTypes.includes(activeType) && (parseFloat(arithValue1) < 0 || parseFloat(arithValue2) < 0)) {
      setError(`${MEASUREMENTS[activeType].name} values cannot be negative`);
      setArithResult('?');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: v2InUnit1 } = await api.post('/api/quantity/convert', {
        value: parseFloat(arithValue2),
        fromUnit: outputUnit.toUpperCase(),
        toUnit: inputUnit.toUpperCase()
      });

      let res = 0;
      const v1 = parseFloat(arithValue1);

      if (arithOp === '+') res = v1 + v2InUnit1;
      else if (arithOp === '-') res = v1 - v2InUnit1;
      else if (arithOp === '/') {
        if (v2InUnit1 === 0) {
          setError("Cannot divide by zero");
          setArithResult('?');
          return;
        }
        res = v1 / v2InUnit1;
      }

      let finalResult = 0;
      if (arithOp === '/') {
        finalResult = res;
      } else {
        // Convert res (which is in inputUnit) to arithResultUnit
        const { data: vFinal } = await api.post('/api/quantity/convert', {
          value: res,
          fromUnit: inputUnit.toUpperCase(),
          toUnit: arithResultUnit.toUpperCase()
        });
        finalResult = vFinal;
      }

      setArithResult(Number(finalResult.toFixed(6)));

      setHistory(prev => [
        {
          id: Date.now(),
          mode: 'arithmetic',
          type: activeType,
          val1: parseFloat(arithValue1),
          unit1: inputUnit,
          val2: parseFloat(arithValue2),
          unit2: outputUnit,
          op: arithOp,
          result: Number(finalResult.toFixed(6)),
          resultUnit: arithOp === '/' ? '' : arithResultUnit,
          date: new Date().toLocaleTimeString()
        },
        ...prev
      ].slice(0, 8));

    } catch (err) {
      console.error(err);
      setError("Arithmetic operation failed");
      setArithResult('?');
    } finally {
      setLoading(false);
    }
  }, [arithValue1, arithValue2, arithOp, inputUnit, outputUnit, activeType, arithResultUnit]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (mode === 'convert') convert();
      else if (mode === 'compare') runCompare();
      else if (mode === 'arithmetic') runArithmetic();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, inputUnit, outputUnit, activeType, convert, mode, runCompare, runArithmetic, compareValue1, compareValue2, arithValue1, arithValue2, arithOp, arithResultUnit]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: 1,
      padding: '40px 20px'
    }}>
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '920px',
          padding: '40px'
        }}
      >
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px' }}>
            Quantity Conversion
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Select a measurement type and enter values to instantly convert
          </p>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            title="Toggle recent conversions history"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: showHistory ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showHistory ? 'var(--accent)' : 'var(--panel-border)'}`,
              color: showHistory ? 'var(--text)' : 'var(--text-muted)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              if (!showHistory) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text)'; }
            }}
            onMouseOut={(e) => {
              if (!showHistory) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-muted)'; }
            }}
          >
            <Clock size={16} />
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>

        {/* Measurement Type Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          {Object.values(MEASUREMENTS).map((type) => {
            const Icon = type.icon;
            const isActive = activeType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                style={{
                  background: isActive ? type.bg : 'var(--input-bg)',
                  border: `1px solid ${isActive ? type.color : 'var(--panel-border)'}`,
                  padding: '20px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  transform: isActive ? 'translateY(-4px)' : 'none',
                  boxShadow: isActive ? `0 8px 24px -8px ${type.color}` : 'none'
                }}
              >
                <Icon size={32} color={isActive ? type.color : 'var(--text-muted)'} />
                <span style={{
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: isActive ? '600' : '400',
                  fontSize: '1.1rem'
                }}>
                  {type.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
            <button onClick={() => setMode('convert')} style={{ padding: '10px 32px', borderRadius: '12px', border: 'none', background: mode === 'convert' ? MEASUREMENTS[activeType].bg : 'transparent', color: mode === 'convert' ? 'var(--text)' : 'var(--text-muted)', fontWeight: mode === 'convert' ? '600' : '500', cursor: 'pointer', transition: 'all 0.3s' }}>Convert</button>
            <button onClick={() => setMode('compare')} style={{ padding: '10px 32px', borderRadius: '12px', border: 'none', background: mode === 'compare' ? MEASUREMENTS[activeType].bg : 'transparent', color: mode === 'compare' ? 'var(--text)' : 'var(--text-muted)', fontWeight: mode === 'compare' ? '600' : '500', cursor: 'pointer', transition: 'all 0.3s' }}>Compare</button>
            <button onClick={() => setMode('arithmetic')} style={{ padding: '10px 32px', borderRadius: '12px', border: 'none', background: mode === 'arithmetic' ? MEASUREMENTS[activeType].bg : 'transparent', color: mode === 'arithmetic' ? 'var(--text)' : 'var(--text-muted)', fontWeight: mode === 'arithmetic' ? '600' : '500', cursor: 'pointer', transition: 'all 0.3s' }}>Arithmetic</button>
          </div>
        </div>

        {/* Action Form */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '32px',
          borderRadius: '24px',
          border: '1px solid var(--panel-border)',
          position: 'relative'
        }}>
          {loading && (
            <div style={{ position: 'absolute', top: 16, right: 16 }}>
              <div className="loader" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: MEASUREMENTS[activeType].color }}></div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>

            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
                {mode === 'convert' ? 'From' : (mode === 'compare' ? 'Value 1' : 'Quantity 1')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" className="input-field"
                  value={mode === 'convert' ? inputValue : (mode === 'compare' ? compareValue1 : arithValue1)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (mode === 'convert') setInputValue(val);
                    else if (mode === 'compare') setCompareValue1(val);
                    else setArithValue1(val);
                  }}
                  min={['length', 'weight', 'volume'].includes(activeType) ? "0" : undefined}
                  style={{ fontSize: '2rem', padding: '20px', fontWeight: '600', height: '80px' }}
                />
              </div>
              <select className="input-field select-field" value={inputUnit} onChange={(e) => setInputUnit(e.target.value)} style={{ fontSize: '1.1rem', padding: '16px' }}>
                {MEASUREMENTS[activeType].units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {mode === 'convert' && (
              <button
                onClick={handleSwap}
                style={{ background: MEASUREMENTS[activeType].bg, border: `1px solid ${MEASUREMENTS[activeType].color}`, width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', marginTop: '16px', flexShrink: 0 }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(180deg)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
              >
                <ArrowRightLeft color={MEASUREMENTS[activeType].color} size={24} />
              </button>
            )}

            {mode === 'compare' && (
              <div style={{ background: MEASUREMENTS[activeType].bg, color: MEASUREMENTS[activeType].color, width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', marginTop: '16px', border: `1px solid ${MEASUREMENTS[activeType].color}`, flexShrink: 0 }}>
                {compareResult}
              </div>
            )}

            {mode === 'arithmetic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                <select
                  className="input-field"
                  value={arithOp}
                  onChange={(e) => setArithOp(e.target.value)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    padding: 0,
                    appearance: 'none',
                    background: MEASUREMENTS[activeType].bg,
                    border: `1px solid ${MEASUREMENTS[activeType].color}`,
                    color: MEASUREMENTS[activeType].color,
                    cursor: 'pointer'
                  }}
                >
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="/">/</option>
                </select>
              </div>
            )}

            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
                {mode === 'convert' ? 'To' : (mode === 'compare' ? 'Value 2' : 'Quantity 2')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={(mode === 'convert' || mode === 'arithmetic') ? 'text' : 'number'}
                  className="input-field"
                  value={mode === 'convert' ? outputValue : (mode === 'compare' ? compareValue2 : arithValue2)}
                  readOnly={mode === 'convert'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (mode === 'compare') setCompareValue2(val);
                    else if (mode === 'arithmetic') setArithValue2(val);
                  }}
                  min={(mode === 'compare' || mode === 'arithmetic') && ['length', 'weight', 'volume'].includes(activeType) ? "0" : undefined}
                  style={{
                    fontSize: '2rem',
                    padding: '20px',
                    fontWeight: '600',
                    height: '80px',
                    background: mode === 'convert' ? 'rgba(255, 255, 255, 0.05)' : 'var(--input-bg)',
                    color: mode === 'convert' ? MEASUREMENTS[activeType].color : 'var(--text)'
                  }}
                />
              </div>
              <select className="input-field select-field" value={outputUnit} onChange={(e) => setOutputUnit(e.target.value)} style={{ fontSize: '1.1rem', padding: '16px' }}>
                {MEASUREMENTS[activeType].units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {mode === 'arithmetic' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '32px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px dashed var(--panel-border)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '1rem', fontWeight: '500' }}>Result</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: MEASUREMENTS[activeType].color }}>
                    {arithResult}
                  </div>
                  {arithOp !== '/' && (
                    <select
                      className="input-field select-field"
                      value={arithResultUnit}
                      onChange={(e) => setArithResultUnit(e.target.value)}
                      style={{
                        fontSize: '1.2rem',
                        padding: '12px 24px',
                        height: 'auto',
                        width: 'auto',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--panel-border)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {MEASUREMENTS[activeType].units.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )}

          </div>

          {error && (
            <div style={{ color: 'var(--error)', marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

        </div>

        {showHistory && history.length === 0 && (
          <div style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }} className="animate-fade-in">
            No recent conversions yet. Start converting to see them here!
          </div>
        )}

        {showHistory && history.length > 0 && (
          <div style={{ marginTop: '40px' }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Clock size={20} color="var(--text-muted)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-muted)' }}>Recent Conversions</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map(item => (
                <div key={item.id} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--panel-border)',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: MEASUREMENTS[item.type].bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {React.createElement(MEASUREMENTS[item.type].icon, { size: 20, color: MEASUREMENTS[item.type].color })}
                    </div>
                    {item.mode === 'convert' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{item.fromVal}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.fromUnit}</span>
                        <ArrowRightLeft size={14} color="var(--text-muted)" style={{ margin: '0 4px' }} />
                        <span style={{ fontSize: '1.1rem', fontWeight: '600', color: MEASUREMENTS[item.type].color }}>{item.toVal}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.toUnit}</span>
                      </div>
                    ) : item.mode === 'compare' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{item.val1}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.unit1}</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: '800', color: MEASUREMENTS[item.type].color, margin: '0 8px' }}>{item.result}</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{item.val2}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.unit2}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{item.val1}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.unit1}</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 4px' }}>{item.op}</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{item.val2}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.unit2}</span>
                        <span style={{ margin: '0 4px' }}>=</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '600', color: MEASUREMENTS[item.type].color }}>{item.result}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.resultUnit}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>
                      {item.mode}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
