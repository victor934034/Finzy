package com.example.finzy.ui.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.finzy.data.model.Transaction
import com.example.finzy.ui.components.*
import com.example.finzy.ui.theme.FinzyDespesa
import com.example.finzy.ui.theme.FinzyGreen
import com.example.finzy.ui.theme.FinzyReceita

@Composable
fun DashboardScreen(
    onNavigateToInvestments: () -> Unit,
    vm: DashboardViewModel = viewModel(factory = DashboardViewModel.Factory)
) {
    val state by vm.state.collectAsState()

    Scaffold(
        topBar = {
            FinzyTopBar(
                title = "Dashboard",
                notificacoes = state.notificacoes,
                onMarkRead = vm::markNotifRead,
                onMarkAllRead = vm::markAllNotifRead,
                onDeleteNotificacao = vm::deleteNotif
            )
        }
    ) { padding ->
        if (state.isLoading && state.summary == null) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = FinzyGreen)
            }
            return@Scaffold
        }

        val summary = state.summary
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text("Resumo do mês", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatCard("Receitas", summary?.receitas ?: 0.0, FinzyReceita, Modifier.weight(1f))
                    StatCard("Despesas", summary?.despesas ?: 0.0, FinzyDespesa, Modifier.weight(1f))
                }
            }
            item {
                StatCard("Saldo", summary?.saldo ?: 0.0, FinzyGreen, Modifier.fillMaxWidth())
            }
            if (summary != null && summary.investimentos.totalInvestido > 0) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(12.dp),
                        onClick = onNavigateToInvestments
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Investimentos", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(Modifier.height(4.dp))
                            Row(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(formatBrl(summary.investimentos.totalAtual), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = FinzyGreen)
                                    Text("Investido: ${formatBrl(summary.investimentos.totalInvestido)}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                val rent = summary.investimentos.rentabilidade
                                Text(
                                    "${if (rent >= 0) "+" else ""}${"%.2f".format(rent)}%",
                                    color = if (rent >= 0) FinzyReceita else FinzyDespesa,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            }
            if (!summary?.transacoesRecentes.isNullOrEmpty()) {
                item {
                    Text("Transações recentes", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
                items(summary!!.transacoesRecentes.take(5)) { t ->
                    TransactionRow(t)
                }
            }
        }
    }
}

@Composable
fun TransactionRow(t: Transaction) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(10.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(t.descricao, fontWeight = FontWeight.Medium, fontSize = 14.sp, maxLines = 1)
                Text(t.categoria, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.width(8.dp))
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    formatBrl(t.valor),
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = if (t.tipo == "receita") FinzyReceita else FinzyDespesa
                )
                TipoChip(t.tipo)
            }
        }
    }
}
