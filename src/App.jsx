import { useState, useRef, useEffect } from "react";
import "./App.css";


const API_URL = "http://localhost:8000";
const START_MESSAGE = "I'm ready, please start the interview.";

export default function App() {
  const [role, setRole] = useState("Python Backend Developer");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const [report, setReport] = useState(null);

  // Kotha message vachinappudu auto ga kindaki scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Backend ki full history pampi AI reply teesukuntundi
  async function askBackend(history) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_title: role, messages: history }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setMessages([...history, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function startInterview() {
    const history = [{ role: "user", content: START_MESSAGE }];
    setMessages(history);
    askBackend(history);
  }

  function sendAnswer() {
    if (!input.trim() || loading) return;
    const history = [...messages, { role: "user", content: input.trim() }];
    setMessages(history);
    setInput("");
    askBackend(history);
  }


  async function endInterview() {
  setLoading(true);
  setError("");
  try {
    const res = await fetch(`${API_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_title: role, messages }),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    setReport(await res.json());
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
}

function restart() {
  setMessages([]);
  setReport(null);
  setInput("");
}

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  }

  const started = messages.length > 0;


  return (
  <div className="app">
    <h1>AI Interviewer</h1>

    {report ? (
      <div className="report">
        <h2>Score: {report.overall_score}/10</h2>
        <p><b>Recommendation:</b> {report.recommendation}</p>

        <h3>Strengths</h3>
        <ul>{report.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>

        <h3>Weaknesses</h3>
        <ul>{report.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}</ul>

        <h3>Per question</h3>
        {report.per_question?.map((q, i) => (
          <div key={i} className="q-card">
            <b>{q.question}</b>
            <div>Score: {q.score}/10</div>
            <div>{q.comment}</div>
          </div>
        ))}

        <button onClick={restart}>New Interview</button>
      </div>
    ) : !started ? (
      <div className="setup">
        <label>Role</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} />
        <button onClick={startInterview}>Start Interview</button>
      </div>
    ) : (
      <>
        <div className="chat">
          {messages.slice(1).map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>{m.content}</div>
          ))}
          {loading && <div className="bubble assistant">Thinking...</div>}
          {error && <div className="error">{error}</div>}
          <div ref={bottomRef} />
        </div>

        <div className="input-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer... (Enter to send)"
            rows={2}
          />
          <button onClick={sendAnswer} disabled={loading}>Send</button>
          <button onClick={endInterview} disabled={loading} className="end">End</button>
        </div>
      </>
    )}
  </div>
);
  // return (
  //   <div className="app">
  //     <h1>AI Interviewer</h1>

  //     {!started ? (
  //       <div className="setup">
  //         <label>Role</label>
  //         <input value={role} onChange={(e) => setRole(e.target.value)} />
  //         <button onClick={startInterview}>Start Interview</button>
  //       </div>
  //     ) : (
  //       <>
  //         <div className="chat">
  //           {/* Index 0 = hidden trigger message, UI lo chupincham */}
  //           {messages.slice(1).map((m, i) => (
  //             <div key={i} className={`bubble ${m.role}`}>
  //               {m.content}
  //             </div>
  //           ))}
  //           {loading && <div className="bubble assistant">Typing...</div>}
  //           {error && <div className="error">{error}</div>}
  //           <div ref={bottomRef} />
  //         </div>

  //         <div className="input-row">
  //           <textarea
  //             value={input}
  //             onChange={(e) => setInput(e.target.value)}
  //             onKeyDown={handleKeyDown}
  //             placeholder="Type your answer... (Enter to send)"
  //             rows={2}
  //           />
  //           <button onClick={sendAnswer} disabled={loading}>
  //             Send
  //           </button>
  //         </div>
  //       </>
  //     )}
  //   </div>
  // );
}