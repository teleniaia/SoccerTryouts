import { useState, useEffect } from 'react';

function App() {
  // --- STATE MANAGEMENT ---
  const [isLoading, setIsLoading] = useState(true); 
  const [view, setView] = useState('roster'); // 'roster', 'evaluation', or 'report'
  const [players, setPlayers] = useState([]); 
  const [historicalData, setHistoricalData] = useState({}); 
  
  const [newPlayerNum, setNewPlayerNum] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState('Unknown'); 
  
  const [activePlayer, setActivePlayer] = useState(null); 
  const [expandedCategory, setExpandedCategory] = useState('Technical'); 

  const defaultEvaluation = {
    firstTouch: 0, passing: 0, dribbling: 0, shooting: 0, defending: 0, heading: 0,
    vision: 0, decisionMaking: 0, offBall: 0, positioning: 0, transition: 0,
    speed: 0, agility: 0, strength: 0, stamina: 0,
    workEthic: 0, coachability: 0, resilience: 0, communication: 0, confidence: 0,
    notes: ''
  };

  const [evaluation, setEvaluation] = useState(defaultEvaluation);

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbyRhpGE43AIDOJKBioSSmmy3OWTAywpK_MAp1NfUphY2h1T7xNIurFPrhvsig5MP-0kug/exec');
        const data = await response.json();
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const loadedPlayers = [];
        const loadedHistory = {};
        
        data.forEach(row => {
          const rowDate = new Date(row.Timestamp);
          if (rowDate >= sevenDaysAgo) {
             const pNum = row.Number.toString();
             
             if (!loadedPlayers.find(p => p.number === pNum)) {
               loadedPlayers.push({
                 number: pNum,
                 name: row.Name || '',
                 claimedPosition: row.ClaimedPos || 'Unknown'
               });
             }
             
             loadedHistory[pNum] = {
                firstTouch: parseInt(row.firstTouch) || 0, passing: parseInt(row.passing) || 0, dribbling: parseInt(row.dribbling) || 0, shooting: parseInt(row.shooting) || 0, defending: parseInt(row.defending) || 0, heading: parseInt(row.heading) || 0,
                vision: parseInt(row.vision) || 0, decisionMaking: parseInt(row.decisionMaking) || 0, offBall: parseInt(row.offBall) || 0, positioning: parseInt(row.positioning) || 0, transition: parseInt(row.transition) || 0,
                speed: parseInt(row.speed) || 0, agility: parseInt(row.agility) || 0, strength: parseInt(row.strength) || 0, stamina: parseInt(row.stamina) || 0,
                workEthic: parseInt(row.workEthic) || 0, coachability: parseInt(row.coachability) || 0, resilience: parseInt(row.resilience) || 0, communication: parseInt(row.communication) || 0, confidence: parseInt(row.confidence) || 0,
                notes: row.Notes || ''
             };
          }
        });
        
        setPlayers(loadedPlayers);
        setHistoricalData(loadedHistory);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setIsLoading(false); 
      }
    };
    
    fetchSheetData();
  }, []);

  // --- ROSTER FUNCTIONS ---
  const addPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerNum) return;
    setPlayers([...players, { number: newPlayerNum, name: newPlayerName, claimedPosition: newPlayerPos }]);
    setNewPlayerNum(''); 
    setNewPlayerName('');
    setNewPlayerPos('Unknown'); 
  };

  const startEvaluation = (player) => {
    setActivePlayer(player);
    if (historicalData[player.number]) {
      setEvaluation(historicalData[player.number]);
    } else {
      setEvaluation(defaultEvaluation); 
    }
    setExpandedCategory('Technical'); 
    setView('evaluation'); 
  };

  // --- EVALUATION FUNCTIONS ---
  const handleScoreChange = (e) => {
    const { name, value } = e.target;
    setEvaluation({ ...evaluation, [name]: parseInt(value) || value });
  };

  const getAverage = (skillsArray, evalObj = evaluation) => {
    const scoredSkills = skillsArray.map(skill => evalObj[skill]).filter(score => score > 0);
    if (scoredSkills.length === 0) return "N/A";
    const sum = scoredSkills.reduce((total, score) => total + score, 0);
    return (sum / scoredSkills.length).toFixed(1);
  };

  const getNumericAverage = (skillsArray, evalObj = evaluation) => {
    const scoredSkills = skillsArray.map(skill => evalObj[skill]).filter(score => score > 0);
    if (scoredSkills.length === 0) return 0;
    return scoredSkills.reduce((total, score) => total + score, 0) / scoredSkills.length;
  };

  // --- THE POSITION ALGORITHM ---
  const calculateRecommendedPosition = (evalObj) => {
    const defScore = getNumericAverage(['defending', 'positioning', 'strength', 'heading', 'resilience'], evalObj);
    const midScore = getNumericAverage(['passing', 'vision', 'decisionMaking', 'stamina', 'firstTouch'], evalObj);
    const fwdScore = getNumericAverage(['shooting', 'dribbling', 'speed', 'offBall', 'confidence'], evalObj);

    if (defScore === 0 && midScore === 0 && fwdScore === 0) return "Need More Data";
    if (defScore > midScore && defScore > fwdScore) return "Defender";
    if (midScore > defScore && midScore > fwdScore) return "Midfielder";
    if (fwdScore > defScore && fwdScore > midScore) return "Forward";
    return "Versatile / Utility"; 
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    
    const finalData = { 
      player: activePlayer, 
      recommendedPosition: calculateRecommendedPosition(evaluation),
      scores: evaluation, 
      averages: { 
        techAvg: getAverage(['firstTouch', 'passing', 'dribbling', 'shooting', 'defending', 'heading']), 
        tactAvg: getAverage(['vision', 'decisionMaking', 'offBall', 'positioning', 'transition']), 
        physAvg: getAverage(['speed', 'agility', 'strength', 'stamina']), 
        mentAvg: getAverage(['workEthic', 'coachability', 'resilience', 'communication', 'confidence']) 
      } 
    };

    try {
      await fetch('https://script.google.com/macros/s/AKfycbyRhpGE43AIDOJKBioSSmmy3OWTAywpK_MAp1NfUphY2h1T7xNIurFPrhvsig5MP-0kug/exec', {
        method: 'POST',
        body: JSON.stringify(finalData),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' } 
      });
      
      setHistoricalData(prev => ({ ...prev, [activePlayer.number]: evaluation }));
      alert(`Saved evaluation for #${activePlayer.number}!`);
    } catch (error) {
      alert("There was an error saving the data. Please try again.");
      console.error(error);
    }
    
    setView('roster'); 
  };

  // --- REPORT GENERATOR ---
  const generateReport = () => {
    const reportData = { "Forward": [], "Midfielder": [], "Defender": [], "Versatile / Utility": [] };
    
    players.forEach(p => {
      const evalData = historicalData[p.number];
      if (evalData && Object.values(evalData).some(val => typeof val === 'number' && val > 0)) {
        const recommendedPos = calculateRecommendedPosition(evalData);
        
        let sortScore = 0;
        if (recommendedPos === 'Defender') sortScore = getNumericAverage(['defending', 'positioning', 'strength', 'heading', 'resilience'], evalData);
        else if (recommendedPos === 'Midfielder') sortScore = getNumericAverage(['passing', 'vision', 'decisionMaking', 'stamina', 'firstTouch'], evalData);
        else if (recommendedPos === 'Forward') sortScore = getNumericAverage(['shooting', 'dribbling', 'speed', 'offBall', 'confidence'], evalData);
        else {
          const allSkills = ['firstTouch', 'passing', 'dribbling', 'shooting', 'defending', 'heading', 'vision', 'decisionMaking', 'offBall', 'positioning', 'transition', 'speed', 'agility', 'strength', 'stamina', 'workEthic', 'coachability', 'resilience', 'communication', 'confidence'];
          sortScore = getNumericAverage(allSkills, evalData);
        }

        if (reportData[recommendedPos]) {
          reportData[recommendedPos].push({ 
            ...p, 
            score: sortScore.toFixed(2),
            notes: evalData.notes // PULLING NOTES HERE
          });
        }
      }
    });

    Object.keys(reportData).forEach(key => {
      reportData[key].sort((a, b) => b.score - a.score);
    });

    return reportData;
  };

  // --- HELPER COMPONENTS ---
  const SkillSlider = ({ label, name }) => {
    const isScored = evaluation[name] > 0;
    return (
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '14px' }}>{label}</label>
          <span style={{ fontWeight: 'bold', color: isScored ? '#007BFF' : '#999' }}>
            {isScored ? evaluation[name] : 'Not Scored'}
          </span>
        </div>
        <input type="range" name={name} min="0" max="5" value={evaluation[name]} onChange={handleScoreChange} style={{ width: '100%' }} />
      </div>
    );
  };

  const CategorySection = ({ title, avg, children }) => {
    const isOpen = expandedCategory === title;
    return (
      <div style={{ marginBottom: '10px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
        <div onClick={() => setExpandedCategory(isOpen ? null : title)} style={{ padding: '15px', backgroundColor: isOpen ? '#e9ecef' : '#f8f9fa', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontWeight: 'bold' }}>
          <span>{title} (Avg: {avg})</span>
          <span>{isOpen ? '▼' : '▶'}</span>
        </div>
        {isOpen && <div style={{ padding: '15px', backgroundColor: 'white' }}>{children}</div>}
      </div>
    );
  };

  // --- WHAT ACTUALLY SHOWS ON SCREEN ---
  if (isLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}><h2>Loading Tryout Data from Database...</h2></div>;
  }

  return (
    <div style={{ padding: '10px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* SCREEN 1: THE ROSTER */}
      {view === 'roster' && (
        <div>
          <h2 style={{ textAlign: 'center' }}>Player Roster</h2>
          
          <form onSubmit={addPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', backgroundColor: '#f1f1f1', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="number" placeholder="No." value={newPlayerNum} onChange={e => setNewPlayerNum(e.target.value)} required style={{ width: '80px', padding: '10px', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Name (Optional)" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} style={{ flex: 1, padding: '10px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Claimed Pos:</label>
              <select value={newPlayerPos} onChange={e => setNewPlayerPos(e.target.value)} style={{ flex: 1, padding: '10px' }}>
                <option value="Unknown">Unknown / Any</option>
                <option value="Forward">Forward</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Defender">Defender</option>
                <option value="Goalkeeper">Goalkeeper</option>
              </select>
              <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Kid</button>
            </div>
          </form>

          {players.length === 0 ? <p style={{ textAlign: 'center', color: '#666' }}>No players loaded. Add a player above to begin.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {players.map((p, index) => {
                const hasData = historicalData[p.number] && Object.values(historicalData[p.number]).some(val => typeof val === 'number' && val > 0);
                return (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', alignItems: 'center', backgroundColor: '#f9f9f9' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>#{p.number} {p.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Pos: {p.claimedPosition}</div>
                      {hasData && <div style={{ fontSize: '12px', color: '#28a745', fontWeight: 'bold' }}>✓ Scored previously</div>}
                    </div>
                    <button onClick={() => startEvaluation(p)} style={{ padding: '10px 20px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      {hasData ? 'Update' : 'Evaluate'}
                    </button>
                  </div>
                )
              })}
              
              <button onClick={() => setView('report')} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
                View Final Tryout Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* SCREEN 2: THE EVALUATION FORM */}
      {view === 'evaluation' && activePlayer && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <button onClick={() => setView('roster')} style={{ padding: '8px 12px', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
            <h2 style={{ margin: 0 }}>#{activePlayer.number} {activePlayer.name}</h2>
            <div style={{ width: '60px' }}></div>
          </div>

          <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #90caf9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span><strong>Claimed Position:</strong></span>
              <span>{activePlayer.claimedPosition}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>Data Fit Recommendation:</strong></span>
              <span style={{ fontWeight: 'bold', color: '#1565c0' }}>{calculateRecommendedPosition(evaluation)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmitEvaluation}>
            <CategorySection title="Technical" avg={getAverage(['firstTouch', 'passing', 'dribbling', 'shooting', 'defending', 'heading'])}>
              <SkillSlider label="First Touch / Receiving" name="firstTouch" />
              <SkillSlider label="Passing" name="passing" />
              <SkillSlider label="Dribbling / Ball Mastery" name="dribbling" />
              <SkillSlider label="Shooting / Finishing" name="shooting" />
              <SkillSlider label="Defending / Tackling" name="defending" />
              <SkillSlider label="Heading" name="heading" />
            </CategorySection>

            <CategorySection title="Tactical" avg={getAverage(['vision', 'decisionMaking', 'offBall', 'positioning', 'transition'])}>
              <SkillSlider label="Vision / Awareness" name="vision" />
              <SkillSlider label="Decision Making" name="decisionMaking" />
              <SkillSlider label="Off-the-Ball Movement" name="offBall" />
              <SkillSlider label="Positioning & Shape" name="positioning" />
              <SkillSlider label="Transition" name="transition" />
            </CategorySection>

            <CategorySection title="Physical" avg={getAverage(['speed', 'agility', 'strength', 'stamina'])}>
              <SkillSlider label="Speed / Acceleration" name="speed" />
              <SkillSlider label="Agility / Balance" name="agility" />
              <SkillSlider label="Strength" name="strength" />
              <SkillSlider label="Stamina / Endurance" name="stamina" />
            </CategorySection>

            <CategorySection title="Mental" avg={getAverage(['workEthic', 'coachability', 'resilience', 'communication', 'confidence'])}>
              <SkillSlider label="Work Ethic / Hustle" name="workEthic" />
              <SkillSlider label="Coachability" name="coachability" />
              <SkillSlider label="Resilience" name="resilience" />
              <SkillSlider label="Communication" name="communication" />
              <SkillSlider label="Confidence" name="confidence" />
            </CategorySection>

            <div style={{ marginTop: '15px' }}>
              <label><strong>Coach's Notes:</strong></label>
              <textarea name="notes" value={evaluation.notes} onChange={handleScoreChange} rows="3" style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" style={{ width: '100%', padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
              Submit & Return to Roster
            </button>
          </form>
        </div>
      )}

      {/* SCREEN 3: THE FINAL REPORT */}
      {view === 'report' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={() => setView('roster')} style={{ padding: '8px 12px', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
            <h2 style={{ margin: 0 }}>Final Tryout Report</h2>
            <div style={{ width: '60px' }}></div>
          </div>

          <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>Players are categorized by their algorithm-recommended position and sorted by their score fit for that role.</p>

          {['Forward', 'Midfielder', 'Defender', 'Versatile / Utility'].map(position => {
            const group = generateReport()[position];
            if (!group || group.length === 0) return null;

            return (
              <div key={position} style={{ marginBottom: '25px' }}>
                <h3 style={{ borderBottom: '2px solid #007BFF', paddingBottom: '5px', color: '#007BFF' }}>Top {position}s</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', padding: '12px', backgroundColor: idx === 0 ? '#fff3cd' : '#f9f9f9', border: '1px solid #ddd', borderRadius: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>#{p.number}</strong> {p.name} {p.claimedPosition !== 'Unknown' ? `(Claimed: ${p.claimedPosition})` : ''}</span>
                        <span style={{ fontWeight: 'bold' }}>Score: {p.score}</span>
                      </div>
                      
                      {/* NEW: DISPLAYING THE COACH'S NOTES */}
                      {p.notes && (
                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#555', fontStyle: 'italic', borderTop: '1px solid #eaeaea', paddingTop: '5px' }}>
                          <strong>Notes: </strong> {p.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;