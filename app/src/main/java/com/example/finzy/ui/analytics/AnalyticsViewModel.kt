package com.example.finzy.ui.analytics

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.example.finzy.FinzyApplication
import com.example.finzy.data.model.*
import com.example.finzy.data.repository.AnalyticsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class AnalyticsUiState(
    val isLoading: Boolean = false,
    val trends: List<AnalyticsTrend> = emptyList(),
    val categories: List<AnalyticsCategory> = emptyList(),
    val forecast: AnalyticsForecast? = null,
    val error: String? = null
)

class AnalyticsViewModel(private val repo: AnalyticsRepository) : ViewModel() {
    private val _state = MutableStateFlow(AnalyticsUiState())
    val state: StateFlow<AnalyticsUiState> = _state

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val trendsResult = repo.getTrends()
            val catsResult = repo.getCategories()
            val forecastResult = repo.getForecast()
            _state.value = _state.value.copy(
                isLoading = false,
                trends = trendsResult.getOrDefault(emptyList()),
                categories = catsResult.getOrDefault(emptyList()),
                forecast = forecastResult.getOrNull(),
                error = if (trendsResult.isFailure) trendsResult.exceptionOrNull()?.message else null
            )
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val app = this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as FinzyApplication
                AnalyticsViewModel(app.container.analyticsRepository)
            }
        }
    }
}
