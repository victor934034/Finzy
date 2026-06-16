package com.example.finzy.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val FinzyColorScheme = darkColorScheme(
    primary = FinzyGreen,
    onPrimary = FinzyBackground,
    primaryContainer = FinzyGreenDark,
    onPrimaryContainer = FinzyOnBackground,
    secondary = FinzySurfaceVariant,
    onSecondary = FinzyOnBackground,
    background = FinzyBackground,
    onBackground = FinzyOnBackground,
    surface = FinzySurface,
    onSurface = FinzyOnSurface,
    surfaceVariant = FinzySurfaceVariant,
    onSurfaceVariant = FinzyOnSurfaceMuted,
    error = FinzyError,
    onError = FinzyBackground,
)

@Composable
fun FinzyTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = FinzyColorScheme,
        typography = Typography,
        content = content
    )
}
