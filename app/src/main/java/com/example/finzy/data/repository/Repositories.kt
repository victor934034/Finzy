package com.example.finzy.data.repository

import com.example.finzy.data.model.*
import com.example.finzy.data.network.ApiClient
import com.example.finzy.data.network.NetworkModule
import com.example.finzy.data.preferences.UserPreferences

class AuthRepository(
    private val prefs: UserPreferences
) {
    private val authService = NetworkModule.supabaseAuthService

    suspend fun login(email: String, password: String): Result<SupabaseSession> = runCatching {
        val session = authService.login(grantType = "password", body = LoginRequest(email, password))
        requireNotNull(session.accessToken) { "Token não recebido. Verifique suas credenciais." }
        val nome = session.user.userMetadata?.get("nome")?.toString() ?: ""
        prefs.saveSession(
            accessToken = session.accessToken,
            refreshToken = session.refreshToken ?: "",
            userId = session.user.id,
            email = session.user.email,
            nome = nome
        )
        ApiClient.setToken(session.accessToken)
        session
    }

    suspend fun signup(email: String, password: String, nome: String): Result<SupabaseSession> = runCatching {
        val session = authService.signup(
            SignUpRequest(email, password, mapOf("nome" to nome))
        )
        requireNotNull(session.accessToken) { "Confirmação de email necessária. Verifique sua caixa de entrada." }
        prefs.saveSession(
            accessToken = session.accessToken,
            refreshToken = session.refreshToken ?: "",
            userId = session.user.id,
            email = session.user.email,
            nome = nome
        )
        ApiClient.setToken(session.accessToken)
        session
    }

    suspend fun logout() {
        prefs.clearSession()
        ApiClient.clear()
    }
}

class DashboardRepository {
    suspend fun getSummary(): Result<DashboardSummary> = runCatching {
        ApiClient.service.getDashboardSummary()
    }
}

class TransactionRepository {
    suspend fun getAll(periodo: String? = null): Result<TransactionListResponse> = runCatching {
        ApiClient.service.getTransactions(periodo)
    }

    suspend fun create(tipo: String, valor: Double, categoria: String, descricao: String, data: String): Result<Transaction> = runCatching {
        ApiClient.service.createTransaction(
            mapOf("tipo" to tipo, "valor" to valor, "categoria" to categoria, "descricao" to descricao, "data" to data)
        ).data
    }

    suspend fun update(id: String, tipo: String, valor: Double, categoria: String, descricao: String, data: String): Result<Transaction> = runCatching {
        ApiClient.service.updateTransaction(
            id, mapOf("tipo" to tipo, "valor" to valor, "categoria" to categoria, "descricao" to descricao, "data" to data)
        ).data
    }

    suspend fun delete(id: String): Result<Unit> = runCatching {
        ApiClient.service.deleteTransaction(id)
        Unit
    }
}

class InvestmentRepository {
    suspend fun getAll(): Result<List<Investment>> = runCatching {
        ApiClient.service.getInvestments().data
    }

    suspend fun create(nome: String, tipo: String, valorInvestido: Double, valorAtual: Double?, dataInicio: String): Result<Investment> = runCatching {
        val body = mutableMapOf<String, Any>("nome" to nome, "tipo" to tipo, "valor_investido" to valorInvestido, "data_inicio" to dataInicio)
        valorAtual?.let { body["valor_atual"] = it }
        ApiClient.service.createInvestment(body).data
    }

    suspend fun update(id: String, nome: String, tipo: String, valorInvestido: Double, valorAtual: Double?, dataInicio: String): Result<Investment> = runCatching {
        val body = mutableMapOf<String, Any>("nome" to nome, "tipo" to tipo, "valor_investido" to valorInvestido, "data_inicio" to dataInicio)
        valorAtual?.let { body["valor_atual"] = it }
        ApiClient.service.updateInvestment(id, body).data
    }

    suspend fun delete(id: String): Result<Unit> = runCatching {
        ApiClient.service.deleteInvestment(id)
        Unit
    }
}

class GastoFixoRepository {
    suspend fun getAll(): Result<List<GastoFixo>> = runCatching {
        ApiClient.service.getGastosFixos().data
    }

    suspend fun create(descricao: String, valor: Double, categoria: String, diaVencimento: Int, frequencia: String): Result<GastoFixo> = runCatching {
        ApiClient.service.createGastoFixo(
            mapOf("descricao" to descricao, "valor" to valor, "categoria" to categoria, "dia_vencimento" to diaVencimento, "frequencia" to frequencia)
        ).data
    }

    suspend fun update(id: String, descricao: String, valor: Double, categoria: String, diaVencimento: Int, frequencia: String, ativo: Boolean): Result<GastoFixo> = runCatching {
        ApiClient.service.updateGastoFixo(
            id, mapOf("descricao" to descricao, "valor" to valor, "categoria" to categoria, "dia_vencimento" to diaVencimento, "frequencia" to frequencia, "ativo" to ativo)
        ).data
    }

    suspend fun delete(id: String): Result<Unit> = runCatching {
        ApiClient.service.deleteGastoFixo(id)
        Unit
    }
}

class MetaRepository {
    suspend fun getAll(): Result<List<Meta>> = runCatching {
        ApiClient.service.getMetas().data
    }

    suspend fun create(titulo: String, tipo: String, valorAlvo: Double, prazo: String?, descricao: String?): Result<Meta> = runCatching {
        val body = mutableMapOf<String, Any>("titulo" to titulo, "tipo" to tipo, "valor_alvo" to valorAlvo)
        prazo?.let { body["prazo"] = it }
        descricao?.let { body["descricao"] = it }
        ApiClient.service.createMeta(body).data
    }

    suspend fun addProgress(id: String, valor: Double): Result<Meta> = runCatching {
        ApiClient.service.addMetaProgress(id, AddProgressRequest(valor)).data
    }

    suspend fun delete(id: String): Result<Unit> = runCatching {
        ApiClient.service.deleteMeta(id)
        Unit
    }
}

class NotificacaoRepository {
    suspend fun getAll(): Result<NotificacoesResponse> = runCatching {
        ApiClient.service.getNotificacoes()
    }

    suspend fun markRead(id: String): Result<Unit> = runCatching {
        ApiClient.service.markNotificacaoRead(id, emptyMap())
        Unit
    }

    suspend fun markAllRead(): Result<Unit> = runCatching {
        ApiClient.service.markAllNotificacoesRead(emptyMap())
        Unit
    }

    suspend fun delete(id: String): Result<Unit> = runCatching {
        ApiClient.service.deleteNotificacao(id)
        Unit
    }
}

class ChatRepository {
    suspend fun chat(messages: List<ChatMessage>): Result<ChatResponse> = runCatching {
        ApiClient.service.chat(ChatRequest(messages))
    }
}
