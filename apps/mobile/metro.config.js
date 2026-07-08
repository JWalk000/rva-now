const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Only watch the mobile app. Watching the full repo (extracted/, supabase/, etc.)
// makes Metro crawl thousands of extra files and slows Expo Go loads on Windows.
config.watchFolders = [projectRoot];

const repoNoise = [
  /[/\\]extracted[/\\].*/,
  /[/\\]supabase[/\\].*/,
  /[/\\]apps[/\\]admin[/\\].*/,
  /[/\\]packages[/\\].*/,
];

config.resolver.blockList = [...(config.resolver.blockList ?? []), ...repoNoise];

module.exports = config;
