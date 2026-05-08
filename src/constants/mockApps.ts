/**
 * Mock app data for app selection UI
 * Represents social media and entertainment apps for focus blocking during duels
 */

export interface AppItem {
  id: string;
  name: string;
  package_name: string;
  icon_emoji: string;
}

export const MOCK_APP_LIST: AppItem[] = [
  // Social Media Apps
  {
    id: 'instagram',
    name: 'Instagram',
    package_name: 'com.instagram.android',
    icon_emoji: '📸',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    package_name: 'com.zhiliaoapp.musically',
    icon_emoji: '🎵',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    package_name: 'com.twitter.android',
    icon_emoji: '🐦',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    package_name: 'com.google.android.youtube',
    icon_emoji: '▶️',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    package_name: 'com.facebook.katana',
    icon_emoji: '📘',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    package_name: 'com.reddit.frontpage',
    icon_emoji: '🤖',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    package_name: 'com.snapchat.android',
    icon_emoji: '👻',
  },

  // Entertainment & Streaming
  {
    id: 'netflix',
    name: 'Netflix',
    package_name: 'com.netflix.mediaclient',
    icon_emoji: '🎬',
  },
  {
    id: 'youtube_premium',
    name: 'YouTube Premium',
    package_name: 'com.google.android.apps.youtube.music',
    icon_emoji: '🎧',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    package_name: 'com.spotify.music',
    icon_emoji: '💚',
  },

  // Games
  {
    id: 'clash_royale',
    name: 'Clash Royale',
    package_name: 'com.supercell.clashroyale',
    icon_emoji: '🏰',
  },
  {
    id: 'pubg',
    name: 'PUBG Mobile',
    package_name: 'com.tencent.ig',
    icon_emoji: '🎯',
  },
  {
    id: 'candy_crush',
    name: 'Candy Crush',
    package_name: 'com.king.candycrushsaga',
    icon_emoji: '🍬',
  },
  {
    id: 'among_us',
    name: 'Among Us',
    package_name: 'com.innersloth.spacemafia',
    icon_emoji: '🚀',
  },
  {
    id: 'roblox',
    name: 'Roblox',
    package_name: 'com.roblox.client',
    icon_emoji: '🎮',
  },
];
