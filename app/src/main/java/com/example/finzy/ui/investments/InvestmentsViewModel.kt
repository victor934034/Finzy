package com.example.finzy.ui.investments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.finzy.FinzyApplication
import com.example.finzy.data.model.Investment
import com.example.finzy.data.repository.InvestmentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class InvestmentsUiState(
    val isLoading: Boolean = false,
    val items: List<Investment> = emptyList(),
    val error: String? = null
)

class InvestmentsViewModel(private val repo: InvestmentRepository) : ViewModel() {

    private val _state = MutableStateFlow(InvestmentsUiState())
    val state: StateFlow<InvestmentsUiState> = _state

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            repo.getAll().fold(
                onSuccess = { _state.value = _state.value.copy(isLoading = false, items = it, error = null) },
                onFailure = { _state.value = _state.value.copy(isLoading = false, error = it.message) }
            )
        }
    }

    fun create(nome: String, tipo: String, valorInvestido: Double, valorAtual: Double?, dataInicio: String, onDone: () -> Unit) {
        viewModelScope.launch {
            repo.create(nome, tipo, valorInvestido, valorAtual, dataInicio).onSuccess { load(); onDone() }
                .onFailure { _state.value = _state.value.copy(error = it.message) }
        }
    }

    fun update(id: String, nome: String, tipo: String, valorInvestido: Double, valorAtual: Double?, dataInicio: String, onDone: () -> Unit) {
        viewModelScope.launch {
            repo.update(id, nome, tipo, valorInvestido, valorAtual, dataInicio).onSuccess { load(); onDone() }
                .onFailure { _state.value = _state.value.copy(error = it.message) }
        }
    }

    fun delete(id: String) {
        viewModelScope.launch {
            repo.delete(id).onSuccess { load() }
                .onFailure { _state.value = _state.value.copy(error = it.message) }
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val app = this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as FinzyApplication
                InvestmentsViewModel(app.container.investmentRepository)
            }
        }
    }
}
