import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await login(username, password);
    } catch (error) {
      setErrorMsg("Nieprawidłowy login lub hasło.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white flex flex-col justify-center px-5">
      <div className="relative z-10 w-full max-w-[360px] mx-auto">
        {/* Dekoracyjny nagłówek w stylu Twojego Dashboardu */}
        <div
          className="flex items-center gap-3 mb-6"
          style={{
            fontSize: "10.5px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--text-tertiary, #888)",
          }}
        >
          <span
            className="w-[18px] h-px"
            style={{ background: "var(--text-tertiary, #888)", opacity: 0.6 }}
          />
          <span>System Access</span>
          <span
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
            }}
          />
        </div>

        <h1 className="text-3xl font-semibold mb-8 tracking-tight">
          Zaloguj się
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Nazwa użytkownika"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all placeholder:text-white/30 text-sm"
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-400/90 pl-1">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 font-semibold text-[#0a0a0b] bg-white rounded-2xl hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Weryfikacja..." : "Zaloguj się"}
          </button>
        </form>
      </div>
    </div>
  );
}
