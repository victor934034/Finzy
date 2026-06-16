package com.example.finzy.ui.transactions

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

val CATEGORIAS_DESPESA = listOf("Alimentação","Transporte","Moradia","Saúde","Educação","Lazer","Vestuário","Assinaturas","Outros")
val CATEGORIAS_RECEITA = listOf("Salário","Freelance","Investimentos","Vendas","Presente","Outros")

private fun todayStr() = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

@Composable
fun TransactionsScreen(vm: TransactionsViewModel = viewModel(factory = TransactionsViewModel.Factory)) {
    val state by vm.state.collectAsState()
    var showDialog by remember { mutableStateOf(false) }
    var editTarget by remember { mutableStateOf<Transaction?>(null) }

    val filtered = if (state.filterTipo == "todos") state.items
    else state.items.filter { it.tipo == state.filterTipo }

    Scaffold(
        topBar = { FinzyTopBar(title = "Transações") },
        floatingActionButton = {
            FloatingActionButton(onClick = { editTarget = null; showDialog = true }, containerColor = FinzyGreen) {
                Icon(Icons.Filled.Add, contentDescription = "Adicionar", tint = MaterialTheme.colorScheme.background)
            }
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("todos" to "Todos", "receita" to "Receitas", "despesa" to "Despesas").forEach { (key, label) ->
                    FilterChip(
                        selected = state.filterTipo == key,
                        onClick = { vm.setFilter(key) },
                        label = { Text(label, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = FinzyGreen.copy(alpha = 0.2f),
                            selectedLabelColor = FinzyGreen
                        )
                    )
                }
            }
            if (state.isLoading) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = FinzyGreen)
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filtered) { t ->
                        TransactionItem(
                            t = t,
                            onEdit = { editTarget = t; showDialog = true },
                            onDelete = { vm.delete(t.id) }
                        )
                    }
                }
            }
        }
    }

    if (showDialog) {
        TransactionDialog(
            initial = editTarget,
            onDismiss = { showDialog = false },
            onSave = { tipo, valor, cat, desc, data ->
                if (editTarget != null) {
                    vm.update(editTarget!!.id, tipo, valor, cat, desc, data) { showDialog = false }
                } else {
                    vm.create(tipo, valor, cat, desc, data) { showDialog = false }
                }
            }
        )
    }
}

@Composable
fun TransactionItem(t: Transaction, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(t.descricao, fontWeight = FontWeight.Medium, fontSize = 14.sp, maxLines = 1)
                Spacer(Modifier.height(2.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    TipoChip(t.tipo)
                    Text(t.categoria, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("•", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(t.data, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Text(
                formatBrl(t.valor),
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = if (t.tipo == "receita") FinzyReceita else FinzyDespesa
            )
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
fun TransactionDialog(initial: Transaction?, onDismiss: () -> Unit, onSave: (String, Double, String, String, String) -> Unit) {
    var tipo by remember { mutableStateOf(initial?.tipo ?: "despesa") }
    var valor by remember { mutableStateOf(initial?.valor?.toString() ?: "") }
    var categoria by remember { mutableStateOf(initial?.categoria ?: "") }
    var descricao by remember { mutableStateOf(initial?.descricao ?: "") }
    var data by remember { mutableStateOf(initial?.data ?: todayStr()) }
    var error by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "Nova Transação" else "Editar Transação") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("receita", "despesa").forEach { t ->
                        FilterChip(
                            selected = tipo == t,
                            onClick = { tipo = t; categoria = "" },
                            label = { Text(if (t == "receita") "Receita" else "Despesa", fontSize = 13.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = if (t == "receita") FinzyReceita.copy(alpha = 0.2f) else FinzyDespesa.copy(alpha = 0.2f),
                                selectedLabelColor = if (t == "receita") FinzyReceita else FinzyDespesa
                            )
                        )
                    }
                }
                OutlinedTextField(valor, { valor = it }, label = { Text("Valor (R$)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                DropdownField("Categoria", categoria, if (tipo == "receita") CATEGORIAS_RECEITA else CATEGORIAS_DESPESA) { categoria = it }
                OutlinedTextField(descricao, { descricao = it }, label = { Text("Descrição") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(data, { data = it }, label = { Text("Data (AAAA-MM-DD)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val v = valor.replace(",", ".").toDoubleOrNull()
                    if (v == null || v <= 0) { error = "Valor inválido"; return@Button }
                    if (categoria.isBlank()) { error = "Selecione uma categoria"; return@Button }
                    if (descricao.isBlank()) { error = "Informe a descrição"; return@Button }
                    onSave(tipo, v, categoria, descricao, data)
                },
                colors = ButtonDefaults.buttonColors(containerColor = FinzyGreen)
            ) { Text("Salvar", color = MaterialTheme.colorScheme.background) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}
