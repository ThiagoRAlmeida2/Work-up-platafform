import axios from "axios";

const baseURL = "https://project-api-1-bw7k.onrender.com";
async function testarConexao() {
  console.log("Testando conexão com a API...");

  try {
    const response = await axios.get(baseURL, { timeout: 10000 });
    console.log("Conexão com sucesso!");
    console.log("Status:", response.status); // caso de erro na resposta 403 é porque esta online
    console.log("Dados:", response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.error("Tempo limite atingido (servidor pode estar dormindo ou offline).");
    } else if (error.response) {
      console.error("Erro na resposta da API:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("Nenhuma resposta recebida. Verifique se o backend está online.");
    } else {
      console.error("Erro desconhecido:", error.message);
    }
  }
}

testarConexao();
