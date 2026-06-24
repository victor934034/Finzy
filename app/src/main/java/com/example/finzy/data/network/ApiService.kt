package com.example.finzy.data.network

import com.example.finzy.data.model.*
import retrofit2.http.*

interface FinzyApiService {
    @GET("dashboard/summary")
    suspend fun getDashboardSummary(): DashboardSummary

    @GET("transactions")
    suspend fun getTransactions(@Query("periodo") periodo: String? = null): TransactionListResponse

    @POST("transactions")
    suspend fun createTransaction(@Body body: Map<String, Any>): DataResponse<Transaction>

    @PUT("transactions/{id}")
    suspend fun updateTransaction(@Path("id") id: String, @Body body: Map<String, Any>): DataResponse<Transaction>

    @DELETE("transactions/{id}")
    suspend fun deleteTransaction(@Path("id") id: String): MessageResponse

    @GET("investments")
    suspend fun getInvestments(): ListDataResponse<Investment>

    @POST("investments")
    suspend fun createInvestment(@Body body: Map<String, Any>): DataResponse<Investment>

    @PUT("investments/{id}")
    suspend fun updateInvestment(@Path("id") id: String, @Body body: Map<String, Any>): DataResponse<Investment>

    @DELETE("investments/{id}")
    suspend fun deleteInvestment(@Path("id") id: String): MessageResponse

    @GET("gastos-fixos")
    suspend fun getGastosFixos(): ListDataResponse<GastoFixo>

    @POST("gastos-fixos")
    suspend fun createGastoFixo(@Body body: Map<String, Any>): DataResponse<GastoFixo>

    @PUT("gastos-fixos/{id}")
    suspend fun updateGastoFixo(@Path("id") id: String, @Body body: Map<String, Any>): DataResponse<GastoFixo>

    @DELETE("gastos-fixos/{id}")
    suspend fun deleteGastoFixo(@Path("id") id: String): MessageResponse

    @GET("metas")
    suspend fun getMetas(): ListDataResponse<Meta>

    @POST("metas")
    suspend fun createMeta(@Body body: Map<String, Any>): DataResponse<Meta>

    @PUT("metas/{id}")
    suspend fun updateMeta(@Path("id") id: String, @Body body: Map<String, Any>): DataResponse<Meta>

    @DELETE("metas/{id}")
    suspend fun deleteMeta(@Path("id") id: String): MessageResponse

    @POST("metas/{id}/progress")
    suspend fun addMetaProgress(@Path("id") id: String, @Body body: AddProgressRequest): DataResponse<Meta>

    @GET("notificacoes")
    suspend fun getNotificacoes(): NotificacoesResponse

    @PATCH("notificacoes/{id}/read")
    suspend fun markNotificacaoRead(@Path("id") id: String, @Body body: Map<String, Any> = emptyMap()): MessageResponse

    @PATCH("notificacoes/read-all")
    suspend fun markAllNotificacoesRead(@Body body: Map<String, Any> = emptyMap()): MessageResponse

    @DELETE("notificacoes/{id}")
    suspend fun deleteNotificacao(@Path("id") id: String): MessageResponse

    @GET("ai/chat/history")
    suspend fun getChatHistory(): ChatHistoryResponse

    @POST("ai/chat")
    suspend fun chat(@Body body: ChatRequest): ChatResponse
}

interface SupabaseAuthService {
    @POST("auth/v1/token")
    suspend fun login(
        @Query("grant_type") grantType: String = "password",
        @Body body: LoginRequest
    ): SupabaseSession

    @POST("auth/v1/signup")
    suspend fun signup(@Body body: SignUpRequest): SupabaseSession
}
