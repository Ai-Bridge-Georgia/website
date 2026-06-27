// ============================================================
// Android Project Generator — Jetpack Compose + Material 3
// 실행 가능한 Android 프로젝트 구조 생성 (Skeleton)
// ============================================================

import type { ProjectGenerator } from '../interface';
import type { GeneratedFile, ProjectManifest, ScreenSpec } from '../interface';
import type { PlatformAdapter } from '../../platform-adapters/interface';

export const androidProjectGenerator: ProjectGenerator = {
  platform: 'android',

  generateProject(manifest, adapter) {
    return [
      ...this.generateConfiguration(manifest),
      ...this.generateBuildFiles(manifest),
      ...this.generateNavigation(manifest, adapter),
      ...this.generateScreens(manifest, adapter),
    ];
  },

  generateScreens(manifest, adapter) {
    return manifest.screens.map(screen => generateComposeScreen(screen, manifest, adapter));
  },

  generateComponents(_manifest, _adapter) { return []; },

  generateNavigation(manifest, _adapter) {
    const screens = manifest.screens.filter(s => s.type !== 'dashboard');
    const navRoutes = screens.map(s => `    composable("${s.name}") { ${capitalize(s.name)}Screen(navController) }`).join('\n');
    const bottomItemFn = (s: ScreenSpec) => 'NavigationBarItem(selected = false, onClick = { navController.navigate("' + s.name + '") }, icon = { Icon(Icons.Default.' + (s.name === 'menu' ? 'RestaurantMenu' : 'Home') + ', contentDescription = "' + s.title + '") }, label = { Text("' + s.title + '") })';
    const bottomItems = screens.slice(0, 3).map(bottomItemFn).join('\n        ');

    const pkgPath = manifest.projectName.replace(/-/g, '_');

    return [{
      path: 'app/src/main/java/com/aibg/' + pkgPath + '/MainActivity.kt',
      content: `package com.aibg.${manifest.projectName.replace(/-/g, '_')}

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.navigation.compose.*
import androidx.compose.ui.Modifier

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ${manifest.projectName.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, c => c.toUpperCase())}Theme {
                val navController = rememberNavController()
                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            ${bottomItems}
                        }
                    }
                ) { padding ->
                    NavHost(navController, startDestination = "${screens[0]?.name ?? 'home'}", modifier = Modifier.padding(padding)) {
${navRoutes}
                    }
                }
            }
        }
    }
}
`,
    }];
  },

  generateAssets(manifest) {
    return [
      {
        path: 'app/src/main/res/values/strings.xml',
        content: `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${manifest.displayName}</string>\n</resources>\n`,
      },
      {
        path: 'app/src/main/res/values/colors.xml',
        content: `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="accent">${manifest.brand.primaryColor}</color>\n</resources>\n`,
      },
    ];
  },

  generateLocalization(manifest) {
    return [{
      path: 'app/src/main/res/values/strings.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${manifest.displayName}</string>\n    ${manifest.screens.map(s => `<string name="screen_${s.name}">${s.title}</string>`).join('\n    ')}\n</resources>\n`,
    }];
  },

  generateConfiguration(manifest) {
    const pkgName = manifest.projectName.replace(/-/g, '_');
    return [
      {
        path: 'app/build.gradle.kts',
        content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.aibg.${pkgName}"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aibg.${pkgName}"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures { compose = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("io.coil-kt:coil-compose:2.7.0")
}
`,
      },
      {
        path: 'settings.gradle.kts',
        content: `pluginManagement {
    repositories { google(); mavenCentral(); gradlePluginPortal() }
}
dependencyResolutionManagement {
    repositories { google(); mavenCentral() }
}
rootProject.name = "${manifest.displayName}"\ninclude(":app")\n`,
      },
    ];
  },

  generateBuildFiles(_manifest) {
    return [
      {
        path: 'gradle.properties',
        content: `org.gradle.jvmargs=-Xmx2048m\nandroid.useAndroidX=true\nkotlin.code.style=official\nnonTransitiveRClass=true\n`,
      },
      {
        path: '.gitignore',
        content: '*.iml\n.gradle\n/local.properties\n.idea\n.DS_Store\n/build\n/app/build\n/captures\n.externalNativeBuild\n.cxx\n',
      },
    ];
  },
};

// --- Compose Screen Generator ---
function generateComposeScreen(screen: ScreenSpec, manifest: ProjectManifest, adapter: PlatformAdapter): GeneratedFile {
  const pkgName = `com.aibg.${manifest.projectName.replace(/-/g, '_')}`;
  const className = `${capitalize(screen.name)}Screen`;
  const endpoint = manifest.api?.baseUrl
    ? `"${manifest.api.baseUrl}/${screen.name}"`
    : `"https://api.example.com/${screen.name}"`;

  let body = '';

  if (screen.type === 'list') {
    body = `    val items = remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    val loading = remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        // TODO: Fetch from ${endpoint}
        loading.value = false
    }

    if (loading.value) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    } else {
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            contentPadding = PaddingValues(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(items.value) { item ->
                Card(Modifier.fillMaxWidth()) {
                    Column {
                        Box(Modifier.fillMaxWidth().aspectRatio(4f / 3f).background(MaterialTheme.colorScheme.surfaceVariant)) {
                            Text("🍽️", Modifier.align(Alignment.Center), fontSize = 40.sp)
                        }
                        Column(Modifier.padding(16.dp)) {
                            Text(item["name"]?.toString() ?: "Item", style = MaterialTheme.typography.titleMedium)
                            item["price"]?.let { Text("\${it} ₾", style = MaterialTheme.typography.titleMedium) }
                        }
                    }
                }
            }
        }
    }`;
  } else if (screen.type === 'form') {
    body = `    var name by remember { mutableStateOf("") }
    var partySize by remember { mutableStateOf(2) }

    Column(
        Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("${screen.title}", style = MaterialTheme.typography.headlineMedium, modifier = Modifier.padding(bottom = 24.dp))

        OutlinedTextField(
            value = name, onValueChange = { name = it },
            label = { Text("이름") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(16.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { partySize = maxOf(1, partySize - 1) }) { Text("−") }
            Text("$partySize", Modifier.width(40.dp), textAlign = TextAlign.Center, fontSize = 20.sp)
            IconButton(onClick = { partySize = minOf(20, partySize + 1) }) { Text("+") }
        }
        Spacer(Modifier.height(24.dp))
        Button(onClick = { /* TODO: POST */ }, modifier = Modifier.fillMaxWidth()) {
            Text("${screen.title}")
        }
    }`;
  } else if (screen.type === 'dashboard' || screen.type === 'table') {
    body = `    val items = remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("${screen.title}", style = MaterialTheme.typography.headlineMedium, modifier = Modifier.padding(bottom = 16.dp))
        LazyColumn {
            items(items.value) { item ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Row(Modifier.fillMaxWidth().padding(16.dp)) {
                        Text(item["name"]?.toString() ?: "Item", Modifier.weight(1f))
                    }
                }
            }
        }
    }`;
  } else {
    // Landing
    body = `    Column(
        Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("${manifest.displayName}", style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text("${screen.title}", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(32.dp))
        Button(onClick = { navController.navigate("${manifest.screens.find(s => s.type === 'list')?.name ?? 'menu'}") }) {
            Text("메뉴 보기")
        }
    }`;
  }

  const needsNavController = screen.type === 'landing';

  return {
    path: `app/src/main/java/com/aibg/${manifest.projectName.replace(/-/g, '_')}/${className}.kt`,
    content: `package ${pkgName}

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
${needsNavController ? 'import androidx.navigation.NavController\n' : ''}

@Composable
fun ${className}(${needsNavController ? 'navController: NavController' : ''}) {
${body}
}
`,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
