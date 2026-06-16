package com.example.finzy.ui.metas

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.finzy.FinzyApplication
import com.example.finzy.data.model.Meta
import com.example.finzy.data.repository.MetaRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class MetasUiState(
    val isLoading: Boolean = false,
    val items: List<Meta> = emptyList(),
    val error: String? = null
)

class MetasViewModel(private val repo: MetaRepository) : ViewModel() {

    private val _state = MutableStateFlow(MetasUiState())
    val state: StateFlow<MetasUiState> = _state

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

    fun create(titulo: String, tipo: String, valorAlvo: Double, prazo: String?, descricao: String?, onDone: () -> Unit) {
        viewModelScope.launch {
            repo.create(titulo, tipo, valorAlvo, prazo, descricao).onSuccess { load(); onDone() }
                .onFailure { _state.value = _state.value.copy(error = it.message) }
        }
    }

    fun addProgress(id: String, valor: Double, onDone: () -> Unit) {
        viewModelScope.launch {
            repo.addProgress(id, valor).onSuccess { load(); onDone() }
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
                MetasViewModel(app.container.metaRepository)
            }
        }
    }
}
