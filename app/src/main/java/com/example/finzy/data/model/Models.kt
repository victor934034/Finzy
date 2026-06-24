package com.example.finzy.data.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(val email: String, val password: String)

data class SignUpRequest(
    val email: String,
    val password: String,
    val data: Map<String, String> = emptyMap()
)

data class SupabaseUser(
    val id: String,
    val email: String,
    @SerializedName("user_metadata") val userMetadata: Map<String, Any>? = null
)

data class SupabaseSession(
    @SerializedName("access_token") val accessToken: String?,
    @SerializedName("refresh_token") val refreshToken: String?,
    @SerializedName("expires_in") val expiresIn: Int? = null,
    val user: SupabaseUser
)

data class Transaction(
    val id: String = "",
    val tipo: String = "",
    val valor: Double = 0.0,
    val categoria: String = "",
    val descricao: String = "",
    val data: String = "",
    @SerializedName("created_at") val createdAt: String? = null
)

data class TransactionListResponse(
    val data: List<Transaction>,
    val count: Int? = null
)

data class CategoriaTotal(val categoria: String, val total: Double)

data class InvestimentosSummary(
    val totalInvestido: Double = 0.0,
    val totalAtual: Double = 0.0,
    val rentabilidade: Double = 0.0
)

data class DashboardSummary(
    val receitas: Double = 0.0,
    val despesas: Double = 0.0,
    val saldo: Double = 0.0,
    val topCategorias: List<CategoriaTotal> = emptyList(),
    val transacoesRecentes: List<Transaction> = emptyList(),
    val investimentos: InvestimentosSummary = InvestimentosSummary()
)

data class Investment(
    val id: String = "",
    val nome: String = "",
    val tipo: String = "",
    @SerializedName("valor_investido") val valorInvestido: Double = 0.0,
    @SerializedName("valor_atual") val valorAtual: Double? = null,
    @SerializedName("data_inicio") val dataInicio: String = "",
    @SerializedName("created_at") val createdAt: String? = null
)

data class GastoFixo(
    val id: String = "",
    val descricao: String = "",
    val valor: Double = 0.0,
    val categoria: String = "",
    @SerializedName("dia_vencimento") val diaVencimento: Int = 1,
    val frequencia: String = "mensal",
    val ativo: Boolean = true,
    @SerializedName("created_at") val createdAt: String? = null
)

data class Meta(
    val id: String = "",
    val titulo: String = "",
    val descricao: String? = null,
    val tipo: String = "outros",
    @SerializedName("valor_alvo") val valorAlvo: Double = 0.0,
    @SerializedName("valor_atual") val valorAtual: Double = 0.0,
    val prazo: String? = null,
    val concluida: Boolean = false,
    @SerializedName("created_at") val createdAt: String? = null
)

data class Notificacao(
    val id: String = "",
    val titulo: String = "",
    val mensagem: String = "",
    val tipo: String = "info",
    val lida: Boolean = false,
    @SerializedName("created_at") val createdAt: String = ""
)

data class NotificacoesResponse(
    val data: List<Notificacao> = emptyList(),
    @SerializedName("naoLidas") val naoLidas: Int = 0
)

data class ChatMessage(val role: String, val content: String)
data class ChatRequest(val message: String)
data class ChatHistoryResponse(val messages: List<ChatMessage> = emptyList())
data class ChatResponse(val response: String, val provider: String? = null)

data class DataResponse<T>(val data: T)
data class ListDataResponse<T>(val data: List<T>)
data class MessageResponse(val message: String? = null, val error: String? = null)
data class AddProgressRequest(val valor: Double)
