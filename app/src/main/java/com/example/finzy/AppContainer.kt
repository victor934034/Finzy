package com.example.finzy

import android.content.Context
import com.example.finzy.data.preferences.UserPreferences
import com.example.finzy.data.repository.*

class AppContainer(context: Context) {
    val userPreferences = UserPreferences(context)
    val authRepository = AuthRepository(userPreferences)
    val dashboardRepository = DashboardRepository()
    val transactionRepository = TransactionRepository()
    val investmentRepository = InvestmentRepository()
    val gastoFixoRepository = GastoFixoRepository()
    val metaRepository = MetaRepository()
    val notificacaoRepository = NotificacaoRepository()
    val chatRepository = ChatRepository()
    val analyticsRepository = AnalyticsRepository()
}
