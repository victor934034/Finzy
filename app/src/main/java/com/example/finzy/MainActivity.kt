package com.example.finzy

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.finzy.data.network.ApiClient
import com.example.finzy.ui.analytics.AnalyticsScreen
import com.example.finzy.ui.auth.AuthScreen
import com.example.finzy.ui.chat.ChatScreen
import com.example.finzy.ui.components.FinzyBottomNav
import com.example.finzy.ui.dashboard.DashboardScreen
import com.example.finzy.ui.gastosfixos.GastosFixosScreen
import com.example.finzy.ui.investments.InvestmentsScreen
import com.example.finzy.ui.metas.MetasScreen
import com.example.finzy.ui.theme.FinzyGreen
import com.example.finzy.ui.theme.FinzyTheme
import com.example.finzy.ui.transactions.TransactionsScreen
import kotlinx.coroutines.launch

val BOTTOM_NAV_ROUTES = setOf("dashboard", "transactions", "gastos-fixos", "analytics", "metas", "chat")

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FinzyTheme {
                FinzyApp(application = application as FinzyApplication)
            }
        }
    }
}

@Composable
fun FinzyApp(application: FinzyApplication) {
    var isLoading by remember { mutableStateOf(true) }
    var startDestination by remember { mutableStateOf("auth") }

    LaunchedEffect(Unit) {
        val token = application.container.userPreferences.getAccessToken()
        if (!token.isNullOrBlank()) {
            ApiClient.setToken(token)
            startDestination = "dashboard"
        }
        isLoading = false
    }

    if (isLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = FinzyGreen)
        }
        return
    }

    val navController = rememberNavController()
    val currentBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStack?.destination?.route

    val showBottomBar = currentRoute in BOTTOM_NAV_ROUTES

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                FinzyBottomNav(
                    currentRoute = currentRoute ?: "dashboard",
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("auth") {
                AuthScreen(
                    onAuthenticated = {
                        navController.navigate("dashboard") {
                            popUpTo("auth") { inclusive = true }
                        }
                    }
                )
            }
            composable("dashboard") {
                DashboardScreen(
                    onNavigateToInvestments = { navController.navigate("investments") }
                )
            }
            composable("transactions") { TransactionsScreen() }
            composable("gastos-fixos") { GastosFixosScreen() }
            composable("analytics") { AnalyticsScreen() }
            composable("metas") { MetasScreen() }
            composable("investments") { InvestmentsScreen() }
            composable("chat") { ChatScreen() }
        }
    }
}
