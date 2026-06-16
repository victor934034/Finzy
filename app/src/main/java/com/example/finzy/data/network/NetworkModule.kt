package com.example.finzy.data.network

import com.example.finzy.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

private const val SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oeGRycmpkbnB4eGZnb2hncWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzgxNDksImV4cCI6MjA5NzA1NDE0OX0.al_--SGn98GOapsPV7ynpqR50i9OaQJ7EcFjqIHJNAk"

private val loggingInterceptor = HttpLoggingInterceptor().apply {
    level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
    else HttpLoggingInterceptor.Level.NONE
}

private val baseClient = OkHttpClient.Builder()
    .addInterceptor(loggingInterceptor)
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(60, TimeUnit.SECONDS)
    .build()

object NetworkModule {
    val supabaseAuthService: SupabaseAuthService = Retrofit.Builder()
        .baseUrl(BuildConfig.SUPABASE_URL + "/")
        .client(
            baseClient.newBuilder()
                .addInterceptor(Interceptor { chain ->
                    chain.proceed(
                        chain.request().newBuilder()
                            .header("apikey", SUPABASE_ANON_KEY)
                            .header("Content-Type", "application/json")
                            .build()
                    )
                })
                .build()
        )
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(SupabaseAuthService::class.java)

    fun createApiService(token: String): FinzyApiService {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(
                baseClient.newBuilder()
                    .addInterceptor(Interceptor { chain ->
                        chain.proceed(
                            chain.request().newBuilder()
                                .header("Authorization", "Bearer $token")
                                .build()
                        )
                    })
                    .build()
            )
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(FinzyApiService::class.java)
    }
}

object ApiClient {
    private var _service: FinzyApiService? = null

    var token: String? = null
        private set

    val service: FinzyApiService
        get() = _service ?: error("Not authenticated")

    val isAuthenticated: Boolean
        get() = _service != null

    fun setToken(newToken: String) {
        token = newToken
        _service = NetworkModule.createApiService(newToken)
    }

    fun clear() {
        token = null
        _service = null
    }
}
