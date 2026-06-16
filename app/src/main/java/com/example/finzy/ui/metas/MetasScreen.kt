package com.example.finzy.ui.metas

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.finzy.data.model.Meta
import com.example.finzy.ui.components.DropdownField
import com.example.finzy.ui.components.FinzyTopBar
import com.example.finzy.ui.components.formatBrl
import com.example.finzy.ui.theme.FinzyGreen

val TIPOS_META = listOf("poupança","quitar_dívida","compra","investimento","viagem","emergência","outros")
val TIPOS_META_LABELS = mapOf(
    "poupança" to "Poupança", "quitar_dívida" to "Quitar Dívida",
    "compra" to "Compra", "investimento" to "Investimento",
    "viagem" to "Viagem", "emergência" to "Emergência", "outros" to "Outros"
)

fun metaColor(tipo: String): Color = when (tipo) {
    "poupança" -> Color(0xFF00C853)
    "quitar_dívida" -> Color(0xFFEF5350)
    "viagem" -> Color(0xFF7C4DFF)
    "emergência" -> Color(0xFFFF6D00)
    "investimento" -> Color(0xFF00BCD4)
    else -> Color(0xFF90A4AE)
}

@Composable
fun MetasScreen(vm: MetasViewModel = viewModel(factory = MetasViewModel.Factory)) {
    val state by vm.state.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    var progressTarget by remember { mutableStateOf<Meta?>(null) }

    val ativas = state.items.filter { !it.concluida }
    val concluidas = state.items.filter { it.concluida }

    Scaffold(
        topBar = { FinzyTopBar(title = "Metas Financeiras") },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreateDialog = true }, containerColor = FinzyGreen) {
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
            if (ativas.isNotEmpty()) {
                item { Text("Em andamento", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurface) }
                items(ativas) { m ->
                    MetaCard(m, onAddProgress = { progressTarget = m }, onDelete = { vm.delete(m.id) })
                }
            }
            if (concluidas.isNotEmpty()) {
                item { Text("Concluídas", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.padding(top = 8.dp)) }
                items(concluidas) { m ->
                    MetaCard(m, onAddProgress = null, onDelete = { vm.delete(m.id) })
                }
            }
            if (state.items.isEmpty()) {
                item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Text("Nenhuma meta cadastrada.\nCrie sua primeira meta!", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        CreateMetaDialog(
            onDismiss = { showCreateDialog = false },
            onSave = { titulo, tipo, valorAlvo, prazo, desc ->
                vm.create(titulo, tipo, valorAlvo, prazo, desc) { showCreateDialog = false }
            }
        )
    }

    progressTarget?.let { meta ->
        AddProgressDialog(
            meta = meta,
            onDismiss = { progressTarget = null },
            onSave = { valor -> vm.addProgress(meta.id, valor) { progressTarget = null } }
        )
    }
}

@Composable
fun MetaCard(m: Meta, onAddProgress: (() -> Unit)?, onDelete: () -> Unit) {
    val progress = if (m.valorAlvo > 0) (m.valorAtual / m.valorAlvo).coerceIn(0.0, 1.0).toFloat() else 0f
    val color = metaColor(m.tipo)

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(m.titulo, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, maxLines = 1)
                    Text(TIPOS_META_LABELS[m.tipo] ?: m.tipo, fontSize = 11.sp, color = color)
                }
                Row {
                    onAddProgress?.let {
                        TextButton(onClick = it, contentPadding = PaddingValues(horizontal = 8.dp)) {
                            Text("+Progresso", color = FinzyGreen, fontSize = 12.sp)
                        }
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(36.dp)) {
                        Icon(Icons.Filled.Delete, contentDescription = "Excluir", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
                    }
                }
            }
            Spacer(Modifier.height(10.dp))
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier.fillMaxWidth().height(8.dp),
                color = color,
                trackColor = color.copy(alpha = 0.2f)
            )
            Spacer(Modifier.height(6.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(formatBrl(m.valorAtual), fontSize = 13.sp, fontWeight = FontWeight.Medium, color = color)
                Text("${(progress * 100).toInt()}%", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(formatBrl(m.valorAlvo), fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (!m.prazo.isNullOrBlank()) {
                Text("Prazo: ${m.prazo}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}

@Composable
fun CreateMetaDialog(onDismiss: () -> Unit, onSave: (String, String, Double, String?, String?) -> Unit) {
    var titulo by remember { mutableStateOf("") }
    var tipo by remember { mutableStateOf("outros") }
    var valorAlvo by remember { mutableStateOf("") }
    var prazo by remember { mutableStateOf("") }
    var descricao by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nova Meta") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(titulo, { titulo = it }, label = { Text("Título") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                DropdownField("Tipo", TIPOS_META_LABELS[tipo] ?: tipo, TIPOS_META_LABELS.values.toList()) { label ->
                    tipo = TIPOS_META_LABELS.entries.first { it.value == label }.key
                }
                OutlinedTextField(valorAlvo, { valorAlvo = it }, label = { Text("Valor alvo (R$)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(prazo, { prazo = it }, label = { Text("Prazo (AAAA-MM-DD, opcional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(descricao, { descricao = it }, label = { Text("Descrição (opcional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(onClick = {
                val v = valorAlvo.replace(",", ".").toDoubleOrNull()
                if (titulo.isBlank()) { error = "Informe o título"; return@Button }
                if (v == null || v <= 0) { error = "Valor alvo inválido"; return@Button }
                onSave(titulo, tipo, v, prazo.ifBlank { null }, descricao.ifBlank { null })
            }, colors = ButtonDefaults.buttonColors(containerColor = FinzyGreen)) {
                Text("Criar", color = MaterialTheme.colorScheme.background)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@Composable
fun AddProgressDialog(meta: Meta, onDismiss: () -> Unit, onSave: (Double) -> Unit) {
    var valor by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Adicionar Progresso") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Meta: ${meta.titulo}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Atual: ${formatBrl(meta.valorAtual)} / ${formatBrl(meta.valorAlvo)}", fontSize = 13.sp)
                OutlinedTextField(valor, { valor = it }, label = { Text("Valor a adicionar (R$)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(onClick = {
                val v = valor.replace(",", ".").toDoubleOrNull()
                if (v == null || v <= 0) { error = "Valor inválido"; return@Button }
                onSave(v)
            }, colors = ButtonDefaults.buttonColors(containerColor = FinzyGreen)) {
                Text("Adicionar", color = MaterialTheme.colorScheme.background)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}
