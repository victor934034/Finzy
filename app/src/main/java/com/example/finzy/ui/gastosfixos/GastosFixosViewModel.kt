package com.example.finzy.ui.gastosfixos

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.finzy.FinzyApplication
import com.example.finzy.data.model.GastoFixo
import com.example.finzy.data.repository.GastoFixoRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class GastosFixosUiState(
    val isLoading: Boolean = false,
    val items: List<GastoFixo> = emptyList(),
    val error: String? = null
)

class GastosFixosViewModel(private val repo: GastoFixoRepository) : ViewModel() {

    private val _state = MutableStateFlow(GastosFixosUiState())
    val state: StateFlow<GastosFixosUiState> = _state

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

    fun create(descricao: String, valor: Double, categoria: String, dia: Int, freq: String, onDone: () -> Unit) {
        viewModelScope.launch {
            repo.create(descricao, valor, categoria, dia, freq).onSuccess { load(); onDone() }
                .onFailure { _state.value = _state.value.copy(error = it.message) }
        }
    }

    fun update(id: String, descricao: String, valor: Double, categoria: String, dia: Int, freq: String, ativo: Boolean, onDone: () -> Unit) {
        viewModelScope.launch {
            repo.update(id, descricao, valor, categoria, dia, freq, ativo).onSuccess { load(); onDone() }
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
                GastosFixosViewModel(app.container.gastoFixoRepository)
            }
        }
    }
}
