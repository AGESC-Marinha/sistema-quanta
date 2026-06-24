import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bjeklbralayvulcuqiqe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [condominios, setCondominios] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCondominios() {
      try {
        const { data, error } = await supabase.from("condominios").select("nome");
        if (error) throw error;
        setCondominios(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCondominios();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Erro ao carregar dados</h2>
          <p style={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Condomínios</h1>
      <div style={styles.grid}>
        {condominios.map((condominio, index) => (
          <div key={index} style={styles.card}>
            <p style={styles.cardText}>{condominio.nome}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "28px",
    marginBottom: "20px",
    color: "#333",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "16px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e0e0e0",
    transition: "transform 0.2s",
  },
  cardText: {
    margin: 0,
    fontSize: "16px",
    color: "#555",
    fontWeight: 500,
  },
  errorCard: {
    backgroundColor: "#ffebee",
    border: "1px solid #f44336",
    borderRadius: "12px",
    padding: "20px",
    color: "#c62828",
  },
  errorTitle: {
    marginTop: 0,
    fontSize: "20px",
  },
  errorText: {
    marginBottom: 0,
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
    color: "#666",
  },
};
