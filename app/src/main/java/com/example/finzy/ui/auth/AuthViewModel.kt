package com.example.finzy.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.finzy.FinzyApplication
import com.example.finzy.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class AuthState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false
)

class AuthViewModel(private val repo: AuthRepository) : ViewModel() {

    private val _state = MutableStateFlow(AuthState())
    val state: StateFlow<AuthState> = _state

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _state.value = _state.value.copy(error = "Preencha todos os campos")
            return
        }
        viewModelScope.launch {
            _state.value = AuthState(isLoading = true)
            repo.login(email.trim(), password).fold(
                onSuccess = { _state.value = AuthState(isSuccess = true) },
                onFailure = { _state.value = AuthState(error = it.message ?: "Erro ao fazer login") }
            )
        }
    }

    fun signup(nome: String, email: String, password: String) {
        if (nome.isBlank() || email.isBlank() || password.isBlank()) {
            _state.value = _state.value.copy(error = "Preencha todos os campos")
            return
        }
        if (password.length < 6) {
            _state.value = _state.value.copy(error = "Senha deve ter pelo menos 6 caracteres")
            return
        }
        viewModelScope.launch {
            _state.value = AuthState(isLoading = true)
            repo.signup(email.trim(), password, nome.trim()).fold(
                onSuccess = { _state.value = AuthState(isSuccess = true) },
                onFailure = { _state.value = AuthState(error = it.message ?: "Erro ao criar conta") }
            )
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    companion object {
        val Factory: ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val app = this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as FinzyApplication
                AuthViewModel(app.container.authRepository)
            }
        }
    }
}
