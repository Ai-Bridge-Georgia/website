// ============================================================
// iOS Project Generator — SwiftUI + HIG
// 실행 가능한 SwiftUI 프로젝트 구조 생성 (Skeleton)
// ============================================================

import type { ProjectGenerator } from '../interface';
import type { GeneratedFile, ProjectManifest, ScreenSpec } from '../interface';
import type { PlatformAdapter } from '../../platform-adapters/interface';

export const iosProjectGenerator: ProjectGenerator = {
  platform: 'ios',

  generateProject(manifest, adapter) {
    return [
      ...this.generateConfiguration(manifest),
      ...this.generateNavigation(manifest, adapter),
      ...this.generateScreens(manifest, adapter),
      ...this.generateAssets(manifest),
    ];
  },

  generateScreens(manifest, adapter) {
    return manifest.screens.map(screen => generateSwiftView(screen, manifest, adapter));
  },

  generateComponents(_manifest, _adapter) { return []; },

  generateNavigation(manifest, _adapter) {
    const appName = capitalize(manifest.projectName.replace(/[^a-zA-Z0-9]/g, ''));
    const tabs = manifest.screens.filter(s => s.type !== 'dashboard').slice(0, 3);
    const tabViews = tabs.map(t => t.name).join('View(), ');

    return [{
      path: appName + 'App.swift',
      content: [
        'import SwiftUI',
        '',
        '@main',
        'struct ' + appName + 'App: App {',
        '    var body: some Scene {',
        '        WindowGroup {',
        '            ContentView()',
        '        }',
        '    }',
        '}',
        '',
        'struct ContentView: View {',
        '    @State private var selectedTab = 0',
        '    var body: some View {',
        '        TabView(selection: $selectedTab) {',
        '            ' + (tabs[0]?.name ?? 'Home') + 'View().tabItem { Label("' + (tabs[0]?.title ?? 'Home') + '", systemImage: "house") }.tag(0)',
        '            ' + (tabs[1]?.name ?? 'Menu') + 'View().tabItem { Label("' + (tabs[1]?.title ?? 'Menu') + '", systemImage: "fork.knife") }.tag(1)',
        '            ' + (tabs[2]?.name ?? 'Reserve') + 'View().tabItem { Label("' + (tabs[2]?.title ?? 'Reserve') + '", systemImage: "calendar") }.tag(2)',
        '        }',
        '    }',
        '}',
      ].join('\n'),
    }];
  },

  generateAssets(manifest) {
    return [{
      path: 'Assets.xcassets/AppIcon.appiconset/Contents.json',
      content: JSON.stringify({
        images: [{ idiom: 'universal', platform: 'ios', size: '1024x1024' }],
        info: { author: 'xcode', version: 1 },
      }, null, 2),
    }];
  },

  generateLocalization(_manifest) { return []; },

  generateConfiguration(manifest) {
    const appName = capitalize(manifest.projectName.replace(/[^a-zA-Z0-9]/g, ''));
    return [{
      path: 'project.yml',
      content: [
        'name: ' + appName,
        'options:',
        '  bundleIdPrefix: com.aibg',
        '  deploymentTarget:',
        '    iOS: "17.0"',
        'targets:',
        '  ' + appName + ':',
        '    type: application',
        '    platform: iOS',
        '    sources:',
        '      - path: ' + appName + 'App.swift',
        '      - path: Views',
        '    settings:',
        '      base:',
        '        PRODUCT_BUNDLE_IDENTIFIER: com.aibg.' + manifest.projectName,
        '        MARKETING_VERSION: "1.0.0"',
        '        GENERATE_INFOPLIST_FILE: YES',
        '        INFOPLIST_KEY_UILaunchScreen_Generation: YES',
        '        INFOPLIST_KEY_UIApplicationSceneManifest_Generation: YES',
        '        SWIFT_VERSION: "5.0"',
      ].join('\n'),
    }];
  },

  generateBuildFiles(_manifest) { return []; },
};

// --- SwiftUI View Generator ---
function generateSwiftView(screen: ScreenSpec, manifest: ProjectManifest, _adapter: PlatformAdapter): GeneratedFile {
  const className = capitalize(screen.name) + 'View';
  const appName = capitalize(manifest.projectName.replace(/[^a-zA-Z0-9]/g, ''));

  let body = '';

  if (screen.type === 'list') {
    body = [
      '    @State private var items: [MenuItem] = []',
      '    @State private var loading = true',
      '    @State private var searchText = ""',
      '',
      '    var body: some View {',
      '        NavigationStack {',
      '            Group {',
      '                if loading {',
      '                    ProgressView()',
      '                } else if filteredItems.isEmpty {',
      '                    ContentUnavailableView("결과 없음", systemImage: "magnifyingglass")',
      '                } else {',
      '                    ScrollView {',
      '                        LazyVGrid(columns: [GridItem(.flexible(), spacing: 16), GridItem(.flexible(), spacing: 16)], spacing: 16) {',
      '                            ForEach(filteredItems) { item in',
      '                                Card(item: item)',
      '                            }',
      '                        }',
      '                        .padding()',
      '                    }',
      '                }',
      '            }',
      '            .navigationTitle("' + screen.title + '")',
      '            .searchable(text: $searchText)',
      '        }',
      '    }',
      '',
      '    var filteredItems: [MenuItem] {',
      '        items.filter { searchText.isEmpty || $0.name.localizedCaseInsensitiveContains(searchText) }',
      '    }',
    ].join('\n');
  } else if (screen.type === 'form') {
    body = [
      '    @State private var name = ""',
      '    @State private var phone = ""',
      '    @State private var date = Date()',
      '    @State private var partySize = 2',
      '    @State private var notes = ""',
      '    @State private var submitted = false',
      '',
      '    var body: some View {',
      '        NavigationStack {',
      '            if submitted {',
      '                VStack(spacing: 16) {',
      '                    Image(systemName: "checkmark.circle.fill").font(.system(size: 56)).foregroundStyle(.green)',
      '                    Text("' + screen.title + ' 완료").font(.title)',
      '                    Button("다시") { submitted = false }.buttonStyle(.borderedProminent)',
      '                }',
      '            } else {',
      '                Form {',
      '                    Section { TextField("이름", text: $name) }',
      '                    Section { TextField("전화번호", text: $phone).keyboardType(.phonePad) }',
      '                    Section {',
      '                        DatePicker("날짜/시간", selection: $date)',
      '                        Stepper("인원: \\(partySize)명", value: $partySize, in: 1...20)',
      '                    }',
      '                    Section { TextField("요청사항", text: $notes, axis: .vertical).lineLimit(3...) }',
      '                    Section {',
      '                        Button("' + screen.title + '") { submitted = true }',
      '                            .frame(maxWidth: .infinity)',
      '                            .buttonStyle(.borderedProminent)',
      '                    }',
      '                }',
      '                .navigationTitle("' + screen.title + '")',
      '            }',
      '        }',
      '    }',
    ].join('\n');
  } else if (screen.type === 'dashboard' || screen.type === 'table') {
    body = [
      '    @State private var items: [MenuItem] = []',
      '',
      '    var body: some View {',
      '        NavigationStack {',
      '            Group {',
      '                if items.isEmpty {',
      '                    ContentUnavailableView("데이터 없음", systemImage: "tray")',
      '                } else {',
      '                    List(items) { item in',
      '                        HStack {',
      '                            Text(item.name)',
      '                            Spacer()',
      '                            Text("\\(item.price) ₾").bold()',
      '                        }',
      '                    }',
      '                }',
      '            }',
      '            .navigationTitle("' + screen.title + '")',
      '        }',
      '    }',
    ].join('\n');
  } else {
    // Landing
    body = [
      '    var body: some View {',
      '        NavigationStack {',
      '            VStack(spacing: 24) {',
      '                Spacer()',
      '                Text("' + manifest.displayName + '").font(.system(size: 48, weight: .bold))',
      '                Text("' + screen.title + '").foregroundStyle(.secondary)',
      '                Spacer()',
      '                VStack(spacing: 12) {',
      '                    NavigationLink("메뉴 보기", destination: ' + (manifest.screens.find(s => s.type === 'list')?.name ?? 'Menu') + 'View())',
      '                        .buttonStyle(.borderedProminent).controlSize(.large)',
      '                    NavigationLink("예약하기", destination: ' + (manifest.screens.find(s => s.type === 'form')?.name ?? 'Reserve') + 'View())',
      '                        .buttonStyle(.bordered).controlSize(.large)',
      '                }',
      '                Spacer()',
      '            }',
      '            .padding()',
      '            .frame(maxWidth: .infinity, maxHeight: .infinity)',
      '        }',
      '    }',
    ].join('\n');
  }

  // Add MenuItem struct for list/table screens
  const needsModel = screen.type === 'list' || screen.type === 'dashboard' || screen.type === 'table';
  const modelStruct = needsModel ? [
    '',
    'struct MenuItem: Identifiable {',
    '    let id = UUID()',
    '    var name: String',
    '    var price: Int',
    '    var description: String',
    '}',
    '',
    'struct Card: View {',
    '    let item: MenuItem',
    '    var body: some View {',
    '        VStack(alignment: .leading, spacing: 8) {',
    '            RoundedRectangle(cornerRadius: 12)',
    '                .fill(Color.gray.opacity(0.1))',
    '                .aspectRatio(4/3, contentMode: .fit)',
    '                .overlay(Image(systemName: "fork.knife").font(.largeTitle).foregroundStyle(.secondary))',
    '            Text(item.name).font(.headline)',
    '            HStack { Text(item.description).font(.caption).foregroundStyle(.secondary); Spacer(); Text("\\(item.price) ₾").bold() }',
    '        }',
    '        .padding()',
    '        .background(Color(.secondarySystemBackground))',
    '        .cornerRadius(12)',
    '    }',
    '}',
  ].join('\n') : '';

  return {
    path: 'Views/' + className + '.swift',
    content: 'import SwiftUI\n\nstruct ' + className + ': View {\n' + body + '\n}\n' + modelStruct + '\n',
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
