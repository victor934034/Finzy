package com.example.finzy.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.finzy.FinzyApplication
import com.example.finzy.data.model.*
import com.example.finzy.data.preferences.UserPreferences
import com.example.finzy.data.repository.DashboardRepository
import com.example.finzy.data.repository.NotificacaoRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val isLoading: Boolean = false,
    val summary: DashboardSummary? = null,
    val error: String? = null,
    val notificacoes: List<Notificacao> = emptyList(),
    val naoLidas: Int = 0,
    val userName: String = ""
)

class DashboardViewModel(
    private val dashRepo: DashboardRepository,
    private val notifRepo: NotificacaoRepository,
    private val prefs: UserPreferences
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val summaryResult = dashRepo.getSummary()
            val notifResult = notifRepo.getAll()
            val nome = prefs.getUserNome() ?: ""
            _state.value = _state.value.copy(
                isLoading = false,
                summary = summaryResult.getOrNull(),
                error = summaryResult.exceptionOrNull()?.message,
                notificacoes = notifResult.getOrNull()?.data ?: emptyList(),
                naoLidas = notifResult.getOrNull()?.naoLidas ?: 0,
                userName = nome
            )
        }
    }

    fun markNotifRead(id: String) {
        viewModelScope.launch {
            notifRepo.markRead(id)
            _state.value = _state.value.copy(
                notificacoes = _state.value.notificacoes.map {
                    if (it.id == id) it.copy(lida = true) else it
                },
                naoLidas = maxOf(0, _state.value.naoLidas - 1)
            )
        }
    }

    fun markAllNotifRead() {
        viewModelScope.launch {
            notifRepo.markAllRead()
            _state.value = _state.value.copy(
                notificacoes = _state.value.notificacoes.map { it.copy(lida = true) },
                naoLidas = 0
            )
        }
    }

    fun deleteNotif(id: String) {
        viewModelScope.launch {
            notifRepo.delete(id)
            val updated = _state.value.notificacoes.filter { it.id != id }
            _state.value = _state.value.copy(
                notificacoes = updated,
                naoLidas = updated.count { !it.lida }
            )
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val app = this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as FinzyApplication
                DashboardViewModel(app.container.dashboardRepository, app.container.notificacaoRepository, app.container.userPreferences)
            }
        }
    }
}
