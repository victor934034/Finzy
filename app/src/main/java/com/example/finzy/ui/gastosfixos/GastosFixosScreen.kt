package com.example.finzy.ui.gastosfixos

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
import com.example.finzy.data.model.GastoFixo
import com.example.finzy.ui.components.DropdownField
import com.example.finzy.ui.components.FinzyTopBar
import com.example.finzy.ui.components.formatBrl
import com.example.finzy.ui.theme.FinzyDespesa
import com.example.finzy.ui.theme.FinzyGreen
import com.example.finzy.ui.theme.FinzyOnSurfaceMuted

val CATEGORIAS_FIXO = listOf("Moradia","Alimentação","Transporte","Saúde","Educação","Lazer","Assinaturas","Negócio","Outros")
val FREQUENCIAS = listOf("semanal","quinzenal","mensal","trimestral","semestral","anual")
val FREQ_LABELS = mapOf("semanal" to "Semanal","quinzenal" to "Quinzenal","mensal" to "Mensal","trimestral" to "Trimestral","semestral" to "Semestral","anual" to "Anual")

@Composable
fun GastosFixosScreen(vm: GastosFixosViewModel = viewModel(factory = GastosFixosViewModel.Factory)) {
    val state by vm.state.collectAsState()
    var showDialog by remember { mutableStateOf(false) }
    var editTarget by remember { mutableStateOf<GastoFixo?>(null) }

    val totalMensal = state.items.filter { it.ativo }.sumOf { gasto ->
        when (gasto.frequencia) {
            "semanal" -> gasto.valor * 4.33
            "quinzenal" -> gasto.valor * 2
            "mensal" -> gasto.valor
            "trimestral" -> gasto.valor / 3
            "semestral" -> gasto.valor / 6
            "anual" -> gasto.valor / 12
            else -> gasto.valor
        }
    }

    Scaffold(
        topBar = { FinzyTopBar(title = "Gastos Fixos") },
        floatingActionButton = {
            FloatingActionButton(onClick = { editTarget = null; showDialog = true }, containerColor = FinzyGreen) {
                Icon(Icons.Filled.Add, contentDescription = "Adicionar", tint = MaterialTheme.colorScheme.background)
            }
        }
    ) { padding ->
        if (state.isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = FinzyGreen)
            }
            return@Scaffold
        }
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
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
                        Text("Custo mensal estimado", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(formatBrl(totalMensal), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = FinzyDespesa)
                        Text("${state.items.count { it.ativo }} gastos ativos de ${state.items.size}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            items(state.items) { g ->
                GastoFixoItem(
                    g = g,
                    onEdit = { editTarget = g; showDialog = true },
                    onDelete = { vm.delete(g.id) },
                    onToggle = { vm.update(g.id, g.descricao, g.valor, g.categoria, g.diaVencimento, g.frequencia, !g.ativo) {} }
                )
            }
        }
    }

    if (showDialog) {
        GastoFixoDialog(
            initial = editTarget,
            onDismiss = { showDialog = false },
            onSave = { descricao, valor, cat, dia, freq ->
                if (editTarget != null) {
                    vm.update(editTarget!!.id, descricao, valor, cat, dia, freq, editTarget!!.ativo) { showDialog = false }
                } else {
                    vm.create(descricao, valor, cat, dia, freq) { showDialog = false }
                }
            }
        )
    }
}

@Composable
fun GastoFixoItem(g: GastoFixo, onEdit: () -> Unit, onDelete: () -> Unit, onToggle: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(12.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(g.descricao, fontWeight = FontWeight.Medium, fontSize = 14.sp, maxLines = 1)
                    if (!g.ativo) Text("Inativo", fontSize = 10.sp, color = FinzyOnSurfaceMuted)
                }
                Text("${g.categoria} • Dia ${g.diaVencimento} • ${FREQ_LABELS[g.frequencia]}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(formatBrl(g.valor), fontWeight = FontWeight.Bold, fontSize = 14.sp, color = if (g.ativo) FinzyDespesa else MaterialTheme.colorScheme.onSurfaceVariant)
            Switch(checked = g.ativo, onCheckedChange = { onToggle() }, modifier = Modifier.padding(start = 4.dp),
                colors = SwitchDefaults.colors(checkedThumbColor = FinzyGreen, checkedTrackColor = FinzyGreen.copy(alpha = 0.4f)))
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
fun GastoFixoDialog(initial: GastoFixo?, onDismiss: () -> Unit, onSave: (String, Double, String, Int, String) -> Unit) {
    var descricao by remember { mutableStateOf(initial?.descricao ?: "") }
    var valor by remember { mutableStateOf(initial?.valor?.toString() ?: "") }
    var categoria by remember { mutableStateOf(initial?.categoria ?: "") }
    var dia by remember { mutableStateOf(initial?.diaVencimento?.toString() ?: "1") }
    var frequencia by remember { mutableStateOf(initial?.frequencia ?: "mensal") }
    var error by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "Novo Gasto Fixo" else "Editar Gasto Fixo") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(descricao, { descricao = it }, label = { Text("Descrição") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(valor, { valor = it }, label = { Text("Valor (R$)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                DropdownField("Categoria", categoria, CATEGORIAS_FIXO) { categoria = it }
                OutlinedTextField(dia, { dia = it }, label = { Text("Dia de vencimento (1-31)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                DropdownField("Frequência", FREQ_LABELS[frequencia] ?: frequencia, FREQ_LABELS.values.toList()) { label ->
                    frequencia = FREQ_LABELS.entries.first { it.value == label }.key
                }
                if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(onClick = {
                val v = valor.replace(",", ".").toDoubleOrNull()
                val d = dia.toIntOrNull()
                if (v == null || v <= 0) { error = "Valor inválido"; return@Button }
                if (d == null || d < 1 || d > 31) { error = "Dia inválido (1-31)"; return@Button }
                if (descricao.isBlank()) { error = "Informe a descrição"; return@Button }
                if (categoria.isBlank()) { error = "Selecione uma categoria"; return@Button }
                onSave(descricao, v, categoria, d, frequencia)
            }, colors = ButtonDefaults.buttonColors(containerColor = FinzyGreen)) {
                Text("Salvar", color = MaterialTheme.colorScheme.background)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}
