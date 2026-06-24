package com.example.finzy.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.finzy.data.model.Notificacao
import com.example.finzy.ui.theme.FinzyDespesa
import com.example.finzy.ui.theme.FinzyGreen
import com.example.finzy.ui.theme.FinzyReceita
import java.text.NumberFormat
import java.util.Locale

val brFormat: NumberFormat = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))

fun formatBrl(value: Double): String = brFormat.format(value)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FinzyTopBar(
    title: String,
    notificacoes: List<Notificacao> = emptyList(),
    onMarkRead: (String) -> Unit = {},
    onMarkAllRead: () -> Unit = {},
    onDeleteNotificacao: (String) -> Unit = {},
    showBack: Boolean = false,
    onBack: () -> Unit = {}
) {
    var showNotifications by remember { mutableStateOf(false) }
    val naoLidas = notificacoes.count { !it.lida }

    TopAppBar(
        title = { Text(title, fontWeight = FontWeight.SemiBold, fontSize = 18.sp) },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        ),
        navigationIcon = {
            if (showBack) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Voltar")
                }
            }
        },
        actions = {
            Box {
                IconButton(onClick = { showNotifications = true }) {
                    Icon(Icons.Filled.Notifications, contentDescription = "Notificações")
                }
                if (naoLidas > 0) {
                    Box(
                        modifier = Modifier
                            .size(16.dp)
                            .clip(CircleShape)
                            .background(FinzyGreen)
                            .align(Alignment.TopEnd)
                            .offset(x = (-4).dp, y = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            if (naoLidas > 9) "9+" else naoLidas.toString(),
                            fontSize = 9.sp,
                            color = Color.Black,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    )

    if (showNotifications) {
        NotificationsSheet(
            notificacoes = notificacoes,
            onDismiss = { showNotifications = false },
            onMarkRead = onMarkRead,
            onMarkAllRead = onMarkAllRead,
            onDelete = onDeleteNotificacao
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsSheet(
    notificacoes: List<Notificacao>,
    onDismiss: () -> Unit,
    onMarkRead: (String) -> Unit,
    onMarkAllRead: () -> Unit,
    onDelete: (String) -> Unit
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 32.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Notificações", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                if (notificacoes.any { !it.lida }) {
                    TextButton(onClick = { onMarkAllRead(); onDismiss() }) {
                        Text("Marcar todas como lidas", color = FinzyGreen, fontSize = 12.sp)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            if (notificacoes.isEmpty()) {
                Text(
                    "Nenhuma notificação",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(vertical = 24.dp).fillMaxWidth(),
                    fontSize = 14.sp
                )
            } else {
                notificacoes.take(20).forEach { n ->
                    NotificacaoItem(n, onMarkRead = { onMarkRead(n.id) }, onDelete = { onDelete(n.id) })
                }
            }
        }
    }
}

@Composable
fun NotificacaoItem(n: Notificacao, onMarkRead: () -> Unit, onDelete: () -> Unit) {
    val cleanMsg = n.mensagem.replace(Regex("""\[ref:[^\]]+]"""), "").trim()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .offset(y = 6.dp)
                .clip(CircleShape)
                .background(if (!n.lida) FinzyGreen else Color.Transparent)
        )
        Spacer(Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(n.titulo, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text(cleanMsg, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        if (!n.lida) {
            IconButton(onClick = onMarkRead, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Filled.CheckCircle, contentDescription = "Lida", tint = FinzyGreen, modifier = Modifier.size(18.dp))
            }
        }
        IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
            Icon(Icons.Filled.Delete, contentDescription = "Excluir", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
        }
    }
    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
}

@Composable
fun StatCard(label: String, value: Double, color: Color = MaterialTheme.colorScheme.onSurface, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(4.dp))
            Text(formatBrl(value), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

@Composable
fun TipoChip(tipo: String) {
    val isReceita = tipo == "receita"
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(if (isReceita) FinzyReceita.copy(alpha = 0.15f) else FinzyDespesa.copy(alpha = 0.15f))
            .padding(horizontal = 8.dp, vertical = 2.dp)
    ) {
        Text(
            if (isReceita) "Receita" else "Despesa",
            fontSize = 11.sp,
            color = if (isReceita) FinzyReceita else FinzyDespesa,
            fontWeight = FontWeight.Medium
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DropdownField(label: String, selected: String, options: List<String>, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
        OutlinedTextField(
            value = selected,
            onValueChange = {},
            label = { Text(label) },
            readOnly = true,
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { opt ->
                DropdownMenuItem(text = { Text(opt) }, onClick = { onSelect(opt); expanded = false })
            }
        }
    }
}

@Composable
fun FinzyBottomNav(currentRoute: String, onNavigate: (String) -> Unit) {
    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
        listOf(
            Triple("dashboard", "Início", Icons.Filled.Home),
            Triple("transactions", "Gastos", Icons.Filled.List),
            Triple("analytics", "Analytics", Icons.Filled.BarChart),
            Triple("metas", "Metas", Icons.Filled.Flag),
            Triple("chat", "Chat IA", Icons.Filled.Chat)
        ).forEach { (route, label, icon) ->
            NavigationBarItem(
                selected = currentRoute == route,
                onClick = { if (currentRoute != route) onNavigate(route) },
                icon = { Icon(icon, contentDescription = label) },
                label = { Text(label, fontSize = 10.sp) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = FinzyGreen,
                    selectedTextColor = FinzyGreen,
                    indicatorColor = FinzyGreen.copy(alpha = 0.15f)
                )
            )
        }
    }
}
