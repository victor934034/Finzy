package com.example.finzy.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.finzy.FinzyApplication
import com.example.finzy.data.model.ChatMessage
import com.example.finzy.data.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

private val GREETING = ChatMessage("assistant", "Olá! Sou o Finzy IA, seu assistente financeiro pessoal. Como posso ajudar você hoje?")

data class ChatUiState(
    val messages: List<ChatMessage> = listOf(GREETING),
    val isTyping: Boolean = false,
    val error: String? = null
)

class ChatViewModel(private val repo: ChatRepository) : ViewModel() {

    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state

    init {
        loadHistory()
    }

    private fun loadHistory() {
        viewModelScope.launch {
            repo.getHistory().onSuccess { history ->
                if (history.isNotEmpty()) {
                    _state.value = _state.value.copy(messages = listOf(GREETING) + history)
                }
            }
        }
    }

    fun sendMessage(text: String) {
        if (text.isBlank()) return
        val userMsg = ChatMessage("user", text.trim())
        _state.value = _state.value.copy(
            messages = _state.value.messages + userMsg,
            isTyping = true,
            error = null
        )

        viewModelScope.launch {
            repo.chat(text.trim()).fold(
                onSuccess = { response ->
                    _state.value = _state.value.copy(
                        messages = _state.value.messages + ChatMessage("assistant", response.response),
                        isTyping = false
                    )
                },
                onFailure = {
                    _state.value = _state.value.copy(
                        isTyping = false,
                        error = it.message ?: "Erro ao enviar mensagem"
                    )
                }
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
                ChatViewModel(app.container.chatRepository)
            }
        }
    }
}
