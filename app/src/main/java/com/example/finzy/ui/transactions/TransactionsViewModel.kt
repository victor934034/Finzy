package com.example.finzy.ui.transactions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.finzy.FinzyApplication
import com.example.finzy.data.model.Transaction
import com.example.finzy.data.repository.TransactionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class TransactionsUiState(
    val isLoading: Boolean = false,
    val items: List<Transaction> = emptyList(),
    val error: String? = null,
    val filterTipo: String = "todos"
)

class TransactionsViewModel(private val repo: TransactionRepository) : ViewModel() {

    private val _state = MutableStateFlow(TransactionsUiState())
    val state: StateFlow<TransactionsUiState> = _state

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            repo.getAll().fold(
                onSuccess = { _state.value = _state.value.copy(isLoading = false, items = it.data, error = null) },
                onFailure = { _state.value = _state.value.copy(isLoading = false, error = it.message) }
            )
        }
    }

    fun setFilter(tipo: String) {
        _state.value = _state.value.copy(filterTipo = tipo)
    }

    fun create(tipo: String, valor: Double, categoria: String, descricao: String, data: String, onDone: () -> Unit) {
        viewModelScope.launch {
            repo.create(tipo, valor, categoria, descricao, data).onSuccess {
                load(); onDone()
            }.onFailure {
                _state.value = _state.value.copy(error = it.message)
            }
        }
    }

    fun update(id: String, tipo: String, valor: Double, categoria: String, descricao: String, data: String, onDone: () -> Unit) {
        viewModelScope.launch {
            repo.update(id, tipo, valor, categoria, descricao, data).onSuccess {
                load(); onDone()
            }.onFailure {
                _state.value = _state.value.copy(error = it.message)
            }
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
                TransactionsViewModel(app.container.transactionRepository)
            }
        }
    }
}
