package com.example.finzy.ui.analytics

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.finzy.data.model.AnalyticsTrend
import com.example.finzy.ui.components.FinzyTopBar
import com.example.finzy.ui.components.formatBrl
import com.example.finzy.ui.theme.FinzyDespesa
import com.example.finzy.ui.theme.FinzyGreen
import com.example.finzy.ui.theme.FinzyReceita

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnalyticsScreen(vm: AnalyticsViewModel = viewModel(factory = AnalyticsViewModel.Factory)) {
    val state by vm.state.collectAsState()
    val pullRefreshState = rememberPullToRefreshState()

    Scaffold(
        topBar = { FinzyTopBar(title = "Analytics") }
    ) { padding ->
        PullToRefreshBox(
            isRefreshing = state.isLoading,
            onRefresh = { vm.load() },
            state = pullRefreshState,
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (state.error != null && state.trends.isEmpty() && state.categories.isEmpty() && state.forecast == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            state.error ?: "Erro ao carregar analytics",
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 32.dp)
                        )
                        Button(
                            onClick = { vm.load() },
                            colors = ButtonDefaults.buttonColors(containerColor = FinzyGreen)
                        ) {
                            Text("Tentar novamente", color = Color.Black)
                        }
                    }
                }
                return@PullToRefreshBox
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Trends card
                if (state.trends.isNotEmpty()) {
                    item {
                        AnalyticsCard {
                            Text(
                                "Tendência 6 meses",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )
                            // Legend
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(16.dp),
                                modifier = Modifier.padding(bottom = 8.dp)
                            ) {
                                LegendItem(color = FinzyGreen, label = "Receitas")
                                LegendItem(color = Color(0xFFEF5350), label = "Despesas")
                            }
                            PairedBarChart(
                                trends = state.trends,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }

                // Categories card
                if (state.categories.isNotEmpty()) {
                    item {
                        AnalyticsCard {
                            Text(
                                "Despesas por categoria",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )
                            val topCats = state.categories.sortedByDescending { it.value }.take(5)
                            val maxVal = topCats.maxOf { it.value }.coerceAtLeast(1.0)
                            topCats.forEach { cat ->
                                Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                    Row(
                                        Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(cat.name, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                                        Text(formatBrl(cat.value), fontSize = 13.sp, color = FinzyDespesa, fontWeight = FontWeight.Medium)
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    LinearProgressIndicator(
                                        progress = { (cat.value / maxVal).toFloat().coerceIn(0f, 1f) },
                                        modifier = Modifier.fillMaxWidth().height(6.dp),
                                        color = FinzyDespesa,
                                        trackColor = FinzyDespesa.copy(alpha = 0.15f)
                                    )
                                }
                            }
                        }
                    }
                }

                // Forecast card
                state.forecast?.let { forecast ->
                    item {
                        AnalyticsCard {
                            Text(
                                "Previsão do mês",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )
                            ForecastRow(label = "Receitas (mês atual)", value = forecast.mesAtual.receitas, color = FinzyReceita)
                            ForecastRow(label = "Despesas (mês atual)", value = forecast.mesAtual.despesas, color = FinzyDespesa)
                            ForecastRow(label = "Despesas projetadas", value = forecast.mesAtual.despesasProjetadas, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = MaterialTheme.colorScheme.surfaceVariant)
                            ForecastRow(
                                label = "Saldo previsto",
                                value = forecast.saldoPrevisto,
                                color = if (forecast.saldoPrevisto >= 0) FinzyGreen else FinzyDespesa,
                                bold = true
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AnalyticsCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), content = content)
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(RoundedCornerShape(2.dp))
                .background(color)
        )
        Text(label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun ForecastRow(label: String, value: Double, color: Color, bold: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            label,
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Text(
            formatBrl(value),
            fontSize = 13.sp,
            color = color,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
fun PairedBarChart(trends: List<AnalyticsTrend>, modifier: Modifier = Modifier) {
    val maxVal = trends.maxOf { maxOf(it.receitas, it.despesas) }.coerceAtLeast(1.0)
    Row(
        modifier = modifier.height(100.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.Bottom
    ) {
        trends.forEach { trend ->
            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(2.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    Box(
                        Modifier
                            .weight(1f)
                            .fillMaxHeight((trend.receitas / maxVal).toFloat().coerceIn(0.02f, 1f))
                            .clip(RoundedCornerShape(topStart = 3.dp, topEnd = 3.dp))
                            .background(FinzyGreen)
                    )
                    Box(
                        Modifier
                            .weight(1f)
                            .fillMaxHeight((trend.despesas / maxVal).toFloat().coerceIn(0.02f, 1f))
                            .clip(RoundedCornerShape(topStart = 3.dp, topEnd = 3.dp))
                            .background(Color(0xFFEF5350))
                    )
                }
                Text(
                    trend.mes,
                    fontSize = 7.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Clip,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .padding(top = 2.dp)
                        .fillMaxWidth()
                )
            }
        }
    }
}
