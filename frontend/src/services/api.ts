const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiService = {
  async checkHealth() {
    const res = await fetch(`${API_URL.replace(/\/api$/, "")}/health`);
    return res.json();
  },

  async prepareAttestation(payload: any) {
    const res = await fetch(`${API_URL}/employer/attestation/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async uploadDocument(formData: FormData) {
    const res = await fetch(`${API_URL}/document/upload`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },
};
