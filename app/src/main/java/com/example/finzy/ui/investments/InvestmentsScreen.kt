package com.example.finzy.ui.investments

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.finzy.data.model.Investment
import com.example.finzy.ui.components.DropdownField
import com.example.finzy.ui.components.FinzyTopBar
import com.example.finzy.ui.components.formatBrl
import com.example.finzy.ui.theme.FinzyDespesa
import com.example.finzy.ui.theme.FinzyGreen
import com.example.finzy.ui.theme.FinzyReceita
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

val TIPOS_INVESTIMENTO = listOf("Ações","Renda Fixa","FIIs","Criptomoedas","Poupança","Tesouro Direto","ETF","Outros")

private fun todayStr() = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvestmentsScreen(vm: InvestmentsViewModel = viewModel(factory = InvestmentsViewModel.Factory)) {
    val state by vm.state.collectAsState()
    var showDialog by remember { mutableStateOf(false) }
    var editTarget by remember { mutableStateOf<Investment?>(null) }
    val pullRefreshState = rememberPullToRefreshState()

    val totalInvestido = state.items.sumOf { it.valorInvestido }
    val totalAtual = state.items.sumOf { it.valorAtual ?: it.valorInvestido }
    val rentabilidade = if (totalInvestido > 0) ((totalAtual - totalInvestido) / totalInvestido) * 100 else 0.0

    Scaffold(
        topBar = { FinzyTopBar(title = "Investimentos") },
        floatingActionButton = {
            FloatingActionButton(onClick = { editTarget = null; showDialog = true }, containerColor = FinzyGreen) {
                Icon(Icons.Filled.Add, contentDescription = "Adicionar", tint = MaterialTheme.colorScheme.background)
            }
        }
    ) { padding ->
        PullToRefreshBox(
            isRefreshing = state.isLoading,
            onRefresh = { vm.load() },
            state = pullRefreshState,
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (state.items.isEmpty() && !state.isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        "Nenhum investimento cadastrado",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 14.sp
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Carteira Total", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(formatBrl(totalAtual), fontSize = 24.sp, fontWeight = FontWeight.Bold, color = FinzyGreen)
                                Spacer(Modifier.height(8.dp))
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Column {
                                        Text("Investido", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text(formatBrl(totalInvestido), fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("Rentabilidade", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text(
                                            "${if (rentabilidade >= 0) "+" else ""}${"%.2f".format(rentabilidade)}%",
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (rentabilidade >= 0) FinzyReceita else FinzyDespesa
                                        )
                                    }
                                }
                            }
                        }
                    }
                    items(state.items) { inv ->
                        InvestmentItem(
                            inv = inv,
                            onEdit = { editTarget = inv; showDialog = true },
                            onDelete = { vm.delete(inv.id) }
                        )
                    }
                }
            }
        }
    }

    if (showDialog) {
        InvestmentDialog(
            initial = editTarget,
            onDismiss = { showDialog = false },
            onSave = { nome, tipo, valorInv, valorAt, data ->
                if (editTarget != null) {
                    vm.update(editTarget!!.id, nome, tipo, valorInv, valorAt, data) { showDialog = false }
                } else {
                    vm.create(nome, tipo, valorInv, valorAt, data) { showDialog = false }
                }
            }
        )
    }
}

@Composable
fun InvestmentItem(inv: Investment, onEdit: () -> Unit, onDelete: () -> Unit) {
    val atual = inv.valorAtual ?: inv.valorInvestido
    val rent = if (inv.valorInvestido > 0) ((atual - inv.valorInvestido) / inv.valorInvestido) * 100 else 0.0

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(12.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(inv.nome, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, maxLines = 1)
                Text(inv.tipo, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Desde: ${inv.dataInicio}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(formatBrl(atual), fontWeight = FontWeight.Bold, fontSize = 14.sp, color = FinzyGreen)
                Text(
                    "${if (rent >= 0) "+" else ""}${"%.1f".format(rent)}%",
                    fontSize = 11.sp,
                    color = if (rent >= 0) FinzyReceita else FinzyDespesa
                )
            }
            IconButton(onClick = onEdit, modifier = Modifier.size(36.dp)) {
                Icon(Icons.Filled.Edit, contentDescription = "Editar", modifier = Modifier.size(18.dp))
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(36.dp)) {
                Icon(Icons.Filled.Delete, contentDescription = "Excluir", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
fun InvestmentDialog(initial: Investment?, onDismiss: () -> Unit, onSave: (String, String, Double, Double?, String) -> Unit) {
    var nome by remember { mutableStateOf(initial?.nome ?: "") }
    var tipo by remember { mutableStateOf(initial?.tipo ?: "") }
    var valorInv by remember { mutableStateOf(initial?.valorInvestido?.toString() ?: "") }
    var valorAt by remember { mutableStateOf(initial?.valorAtual?.toString() ?: "") }
    var dataInicio by remember { mutableStateOf(initial?.dataInicio ?: todayStr()) }
    var error by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "Novo Investimento" else "Editar Investimento") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(nome, { nome = it }, label = { Text("Nome") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                DropdownField("Tipo", tipo, TIPOS_INVESTIMENTO) { tipo = it }
                OutlinedTextField(
                    valorInv,
                    { valorInv = it },
                    label = { Text("Valor investido (R$)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                OutlinedTextField(
                    valorAt,
                    { valorAt = it },
                    label = { Text("Valor atual (R$, opcional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                OutlinedTextField(dataInicio, { dataInicio = it }, label = { Text("Data início (AAAA-MM-DD)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(onClick = {
                val vi = valorInv.replace(",", ".").toDoubleOrNull()
                val va = valorAt.replace(",", ".").toDoubleOrNull()
                if (nome.isBlank()) { error = "Informe o nome"; return@Button }
                if (tipo.isBlank()) { error = "Selecione o tipo"; return@Button }
                if (vi == null || vi < 0) { error = "Valor investido inválido"; return@Button }
                onSave(nome, tipo, vi, va, dataInicio)
            }, colors = ButtonDefaults.buttonColors(containerColor = FinzyGreen)) {
                Text("Salvar", color = MaterialTheme.colorScheme.background)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}
