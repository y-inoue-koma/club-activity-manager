import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// Helper to determine event type
function getEventType(description, location) {
  const desc = (description || '').toLowerCase();
  const loc = (location || '').toLowerCase();
  if (desc.includes('off') || desc.includes('部活禁止')) return 'other';
  if (desc.includes('試合') || desc.includes('公式') || desc.includes('大会')) return 'game';
  if (desc.includes('mtg') || desc.includes('ミーティング') || desc.includes('抽選会')) return 'meeting';
  // Check if it's a game by opponent name pattern
  if (loc && !loc.includes('学校') && !loc.includes('三郷') && !loc.includes('戸田橋') && !loc.includes('ー') && !loc.includes('-') && !loc.includes('校外') && !loc.includes('海') && !loc.includes('浜') && desc && !desc.includes('練習')) return 'game';
  return 'practice';
}

// Parse time range like "15:00-18:00" or "9:00" or "13:00出発"
function parseTime(timeStr) {
  if (!timeStr || timeStr === 'ー' || timeStr === '-' || timeStr === '') return { start: null, end: null };
  const cleaned = timeStr.replace(/〜/g, '-').replace(/s$/g, '').trim();
  // Range: "15:00-18:00"
  const rangeMatch = cleaned.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (rangeMatch) return { start: rangeMatch[1], end: rangeMatch[2] };
  // Single time: "9:00" or "13:00出発"
  const singleMatch = cleaned.match(/(\d{1,2}:\d{2})/);
  if (singleMatch) return { start: singleMatch[1], end: null };
  return { start: null, end: null };
}

// ============================
// 2025年度予定表データ
// ============================
const schedules2025 = [
  // === 4月 ===
  { date: '2025-04-14', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-04-15', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-04-16', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-04-17', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-04-18', location: '三郷', time: '', description: '練習', uniform: '' },
  { date: '2025-04-19', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-04-20', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-04-21', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-04-22', location: '三郷', time: '', description: '練習', uniform: '' },
  { date: '2025-04-23', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-04-24', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-04-25', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-04-26', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-04-27', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-04-28', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-04-29', location: '取手G', time: '', description: '試合 vs 取手松陽/江戸川学園取手', uniform: '白' },
  { date: '2025-04-30', location: '学校', time: '', description: 'MTG・練習', uniform: '' },

  // === 5月 ===
  { date: '2025-05-01', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-05-02', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-03', location: '合宿', time: '', description: 'GW合宿 1日目 試合', uniform: '' },
  { date: '2025-05-04', location: '合宿', time: '', description: 'GW合宿 2日目 試合', uniform: '' },
  { date: '2025-05-05', location: '合宿', time: '', description: 'GW合宿 3日目 試合', uniform: '' },
  { date: '2025-05-06', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-05-07', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-08', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-09', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-10', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-11', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-05-12', location: '', time: '', description: 'OFF・本入部・ユニ採寸', uniform: '' },
  { date: '2025-05-13', location: '', time: '', description: 'OFF（テスト期間）', uniform: '' },
  { date: '2025-05-14', location: '', time: '', description: 'OFF（テスト期間）', uniform: '' },
  { date: '2025-05-15', location: '', time: '', description: 'OFF（テスト期間）', uniform: '' },
  { date: '2025-05-16', location: '', time: '', description: 'OFF（テスト期間）', uniform: '' },
  { date: '2025-05-17', location: '', time: '', description: 'OFF（テスト期間）', uniform: '' },
  { date: '2025-05-18', location: '', time: '', description: 'OFF（テスト期間）', uniform: '' },
  { date: '2025-05-19', location: '', time: '', description: 'OFF（テスト期間）', uniform: '' },
  { date: '2025-05-20', location: '', time: '', description: 'OFF（テスト期間）', uniform: '' },
  { date: '2025-05-21', location: '学校', time: '', description: '部室整理', uniform: '' },
  { date: '2025-05-22', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-23', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-24', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-25', location: '我孫子G', time: '', description: '試合 vs 我孫子', uniform: '白' },
  { date: '2025-05-26', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-27', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-05-28', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-29', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-30', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-05-31', location: '学校', time: '', description: '練習', uniform: '' },

  // === 6月 ===
  { date: '2025-06-01', location: '牛久栄進', time: '', description: '試合 vs 牛久栄進・越谷南', uniform: '白' },
  { date: '2025-06-02', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-06-03', location: '戸田橋', time: '', description: '練習', uniform: '' },
  { date: '2025-06-04', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-06-05', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-06-06', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-06-07', location: '都立総合工科', time: '', description: '試合 vs 都立総合工科', uniform: 'グレー' },
  { date: '2025-06-08', location: '我孫子二階堂', time: '', description: '試合 vs 我孫子二階堂', uniform: '白' },
  { date: '2025-06-09', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-06-10', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-06-11', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-06-12', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-06-13', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-06-14', location: '学校', time: '', description: '練習・MTG・抽選会', uniform: '' },
  { date: '2025-06-15', location: '', time: '', description: 'OFF（出身チーム訪問）', uniform: '' },
  { date: '2025-06-16', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-06-17', location: '戸田橋', time: '', description: '練習', uniform: '' },
  { date: '2025-06-18', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-06-19', location: '学校', time: '', description: 'MTG・勉強', uniform: '' },
  { date: '2025-06-20', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-06-21', location: '学習院', time: '', description: '試合 vs 学習院', uniform: 'グレー' },
  { date: '2025-06-22', location: '守谷', time: '', description: '試合 vs 松戸馬橋・守谷', uniform: '白' },
  { date: '2025-06-23', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-06-24', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2025-06-25', location: '戸田橋B', time: '', description: '練習', uniform: '' },
  { date: '2025-06-26', location: '学校', time: '', description: 'MTG・勉強', uniform: '' },
  { date: '2025-06-27', location: '戸田橋B', time: '', description: '練習', uniform: '' },
  { date: '2025-06-28', location: '学校', time: '', description: 'MTG(萬徳さん)・練習', uniform: '' },
  { date: '2025-06-29', location: '草加西', time: '', description: '試合 vs 草加西', uniform: '白' },
  { date: '2025-06-30', location: '学校', time: '', description: '練習', uniform: '' },

  // === 7月 ===
  { date: '2025-07-01', location: '戸田橋A', time: '15:00-18:00', description: '練習', uniform: '' },
  { date: '2025-07-02', location: '戸田橋A', time: '15:00-18:00', description: '練習', uniform: '' },
  { date: '2025-07-03', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-07-04', location: '戸田橋A', time: '15:00-18:00', description: '練習', uniform: '' },
  { date: '2025-07-05', location: '神宮球場', time: '10:00', description: '全国高校野球選手権大会 東・西東京大会開会式', uniform: '公式戦' },
  { date: '2025-07-06', location: '学校', time: '9:00-16:00', description: '(午前)練習(午後)勉強', uniform: '' },
  { date: '2025-07-07', location: '', time: '', description: 'OFF（1時間程度）', uniform: '' },
  { date: '2025-07-08', location: '', time: '', description: 'OFF（1時間程度）', uniform: '' },
  { date: '2025-07-09', location: '', time: '', description: 'OFF（1時間程度）', uniform: '' },
  { date: '2025-07-10', location: '三郷', time: '15:00-18:00', description: '練習', uniform: '' },
  { date: '2025-07-11', location: '戸田橋A', time: '9:00-18:00', description: '練習', uniform: '' },
  { date: '2025-07-12', location: '駒沢球場', time: '9:00', description: '【東東京大会】2回戦 vs 都立八丈', uniform: '公式戦' },
  { date: '2025-07-13', location: '学校', time: '9:00-12:00', description: 'MTG・練習', uniform: '' },
  { date: '2025-07-14', location: '三郷', time: '15:00-18:00', description: '練習（マシン移送）', uniform: '' },
  { date: '2025-07-15', location: '三郷', time: '15:00-18:00', description: '練習', uniform: '' },
  { date: '2025-07-16', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-07-17', location: '学校', time: '14:30-17:30', description: '練習', uniform: '' },
  { date: '2025-07-18', location: '三郷', time: '10:00-16:00', description: '練習', uniform: '' },
  { date: '2025-07-19', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-07-20', location: '学校', time: '12:00-15:00', description: '練習', uniform: '' },
  { date: '2025-07-21', location: '学校', time: '9:00-12:30', description: '練習', uniform: '' },
  { date: '2025-07-22', location: '三郷', time: '15:00-18:00', description: '練習', uniform: '' },
  { date: '2025-07-23', location: '岩槻商業', time: '15:00', description: '試合 vs 岩槻商業', uniform: '白' },
  { date: '2025-07-24', location: '学校', time: '13:00-14:30', description: '練習', uniform: '' },
  { date: '2025-07-25', location: '三郷', time: '15:00-18:00', description: '練習', uniform: '' },
  { date: '2025-07-26', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-07-27', location: '学校', time: '9:00-12:00', description: '練習', uniform: '' },
  { date: '2025-07-28', location: '三郷', time: '15:00-18:00', description: '練習', uniform: '' },
  { date: '2025-07-29', location: '三郷', time: '15:00-17:00', description: '練習', uniform: '' },
  { date: '2025-07-30', location: '学校', time: '14:30-17:30', description: '(午前)勉強(午後)練習', uniform: '' },
  { date: '2025-07-31', location: '', time: '', description: 'OFF', uniform: '' },

  // === 8月 ===
  { date: '2025-08-01', location: '三郷', time: '15:00-18:00', description: '練習', uniform: '' },
  { date: '2025-08-02', location: '牛久栄進', time: '', description: '試合 vs 牛久栄進', uniform: 'グレー' },
  { date: '2025-08-03', location: '学校', time: '10:00-12:00', description: 'トレーニング・測定', uniform: '' },
  { date: '2025-08-04', location: '京華', time: '', description: '試合 vs 京華', uniform: '白' },
  { date: '2025-08-05', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-08-06', location: '三郷', time: '10:00-16:00', description: '練習', uniform: '' },
  { date: '2025-08-07', location: '三郷', time: '10:00-16:00', description: '練習', uniform: '' },
  { date: '2025-08-08', location: '三郷', time: '10:00-16:00', description: '練習', uniform: '' },
  { date: '2025-08-09', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-08-10', location: '学校', time: '9:00-13:00', description: '中学生体験会（10時-12時）', uniform: '' },
  { date: '2025-08-11', location: '学校', time: '', description: '模試後調整・準備', uniform: '' },
  { date: '2025-08-12', location: '天竜高校', time: '', description: '夏季強化合宿 1日目', uniform: '白' },
  { date: '2025-08-13', location: '湖西高校', time: '', description: '夏季強化合宿 2日目', uniform: 'グレー' },
  { date: '2025-08-14', location: '天竜高校', time: '', description: '夏季強化合宿 3日目', uniform: '公式' },
  { date: '2025-08-15', location: '青梅総合・羽村', time: '', description: '夏季強化合宿 4日目', uniform: '白' },
  { date: '2025-08-16', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-08-17', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-08-18', location: '三郷', time: '10:00-16:00', description: '練習', uniform: '' },
  { date: '2025-08-19', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-08-20', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-08-21', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-08-22', location: '三郷', time: '12:00-18:00', description: '中学生体験会（14時-17時）', uniform: '' },
  { date: '2025-08-23', location: '学校', time: '16:00-18:00', description: '(午前)勉強(午後)練習', uniform: '' },
  { date: '2025-08-24', location: '成蹊', time: '14:00', description: '試合 vs 成蹊', uniform: 'グレー' },
  { date: '2025-08-25', location: '三郷', time: '14:00-18:00', description: '練習', uniform: '' },
  { date: '2025-08-26', location: '都立千歳丘', time: '', description: '試合 vs 都立千歳丘', uniform: '白' },
  { date: '2025-08-27', location: '戸田橋', time: '9:00-18:00', description: '本郷・秋季大会抽選会', uniform: 'グレー' },
  { date: '2025-08-28', location: '上野学園牛久G', time: '10:00-16:00', description: '試合 vs 上野学園', uniform: '白' },
  { date: '2025-08-29', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-08-30', location: '学校', time: '11:30', description: '部室整理', uniform: '' },
  { date: '2025-08-31', location: '', time: '', description: '三送会', uniform: '' },

  // === 9月 ===
  { date: '2025-09-01', location: '戸田橋B', time: '15:00-18:00', description: '練習', uniform: '' },
  { date: '2025-09-02', location: '学校', time: '16:00-18:00', description: '練習', uniform: '' },
  { date: '2025-09-03', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-09-04', location: '学校', time: '16:00-18:00', description: '練習', uniform: '' },
  { date: '2025-09-05', location: '戸田橋B', time: '16:00-18:00', description: '練習', uniform: '' },
  { date: '2025-09-06', location: '学校', time: '16:00-18:00', description: '練習', uniform: '' },
  { date: '2025-09-07', location: '錦城', time: '', description: '試合 vs 錦城学園', uniform: '白' },
  { date: '2025-09-08', location: '学校', time: '16:00-18:00', description: '練習', uniform: '' },
  { date: '2025-09-09', location: '戸田橋B', time: '16:00-18:00', description: '練習', uniform: '' },
  { date: '2025-09-10', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-09-11', location: '学校', time: '16:00-18:00', description: '実力テスト', uniform: '' },
  { date: '2025-09-12', location: '戸田橋B', time: '16:00-18:00', description: '練習', uniform: '' },
  { date: '2025-09-13', location: 'BP足立②', time: '14:30-16:30', description: '練習', uniform: 'フィールドフォース' },
  { date: '2025-09-14', location: '明大中野G', time: '12:30', description: '【ブロック予選】vs 六郷工科', uniform: '公式' },
  { date: '2025-09-15', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-09-16', location: '戸田橋B', time: '16:00-18:00', description: '練習', uniform: '' },
  { date: '2025-09-17', location: '学校', time: '15:45-18:00', description: 'ウェイト', uniform: '' },
  { date: '2025-09-18', location: '戸田橋B', time: '15:00-18:00', description: '練習（午前中授業）', uniform: '' },
  { date: '2025-09-19', location: '戸田橋B', time: '15:00-18:00', description: '練習（玉蘭祭準備日）', uniform: '' },
  { date: '2025-09-20', location: 'BP足立②', time: '17:30-19:30', description: '練習（玉蘭祭1日目）', uniform: 'フィールドフォース' },
  { date: '2025-09-21', location: 'BP足立②', time: '17:30-19:30', description: '練習（玉蘭祭2日目）', uniform: 'フィールドフォース' },
  { date: '2025-09-22', location: '三郷', time: '8:00-13:00', description: '練習', uniform: '' },
  { date: '2025-09-23', location: '明大中野G', time: '10:00', description: '【ブロック予選】vs 明大中野', uniform: '公式' },
  { date: '2025-09-24', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-09-25', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-09-26', location: '戸田橋B', time: '16:00-18:00', description: '練習', uniform: '' },
  { date: '2025-09-27', location: '学校', time: '13:30-15:00', description: '練習・萬徳さん', uniform: '' },
  { date: '2025-09-28', location: '安田学園', time: '9:00', description: '試合 vs 安田学園・豊多摩', uniform: 'グレー' },
  { date: '2025-09-29', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-09-30', location: '戸田橋B', time: '16:00-18:00', description: '練習', uniform: '' },

  // === 10月 ===
  { date: '2025-10-01', location: '学校', time: '15:30-17:00', description: 'MTG', uniform: '' },
  { date: '2025-10-02', location: '', time: '', description: 'OFF 高校体育祭', uniform: '' },
  { date: '2025-10-03', location: '学校', time: '15:30-18:00', description: '【高1】練習【高2】試験1週間前', uniform: '' },
  { date: '2025-10-04', location: '学校', time: '15:30-18:00', description: '【高1】練習【高2】試験1週間前', uniform: '' },
  { date: '2025-10-05', location: '', time: '', description: '【高1】OFF【高2】試験1週間前', uniform: '' },
  { date: '2025-10-06', location: '学校', time: '15:30-18:00', description: '【高1】練習【高2】試験1週間前', uniform: '' },
  { date: '2025-10-07', location: '学校', time: '15:30-18:00', description: '【高1】練習【高2】試験1週間前', uniform: '' },
  { date: '2025-10-08', location: '', time: '', description: '【高1】OFF【高2】午前中授業', uniform: '' },
  { date: '2025-10-09', location: '学校', time: '15:30-18:00', description: '【高1】練習【高2】中間試験1日目', uniform: '' },
  { date: '2025-10-10', location: '学校', time: '15:30-18:00', description: '【高1】練習【高2】中間試験2日目', uniform: '' },
  { date: '2025-10-11', location: '都市大学附属', time: '15:00', description: '試合 vs 都市大学附属【高2】中間試験3日目', uniform: '白' },
  { date: '2025-10-12', location: '', time: '', description: 'OFF・球場運営', uniform: '' },
  { date: '2025-10-13', location: '', time: '', description: 'OFF・球場運営', uniform: '' },
  { date: '2025-10-14', location: '学校', time: '15:30-18:00', description: 'トレーニング（萬徳さん）・マネ休み', uniform: '' },
  { date: '2025-10-15', location: '学校', time: '15:30-18:00', description: '【高2】練習【高1】採寸のみ参加', uniform: '' },
  { date: '2025-10-16', location: '', time: '', description: 'OFF【高2】前日注意【高1】試験1週間前', uniform: '' },
  { date: '2025-10-17', location: '', time: '', description: 'OFF【高2】修学旅行', uniform: '' },
  { date: '2025-10-18', location: '', time: '', description: 'OFF【高2】修学旅行', uniform: '' },
  { date: '2025-10-19', location: '', time: '', description: 'OFF【高2】修学旅行', uniform: '' },
  { date: '2025-10-20', location: '', time: '', description: 'OFF【高2】修学旅行', uniform: '' },
  { date: '2025-10-21', location: '', time: '', description: 'OFF【高2】修学旅行【高1】午前中授業', uniform: '' },
  { date: '2025-10-22', location: '', time: '', description: 'OFF【高2】修学旅行【高1】中間考査1日目', uniform: '' },
  { date: '2025-10-23', location: '', time: '', description: 'OFF【高2】修学旅行【高1】中間考査2日目', uniform: '' },
  { date: '2025-10-24', location: '', time: '', description: 'OFF【高1】中間考査3日目', uniform: '' },
  { date: '2025-10-25', location: '学校', time: '15:30-18:00', description: 'TR（中西さん）【高1】職業を聴く会', uniform: '' },
  { date: '2025-10-26', location: '', time: '', description: 'OFF【高1】河合模試', uniform: '' },
  { date: '2025-10-27', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-10-28', location: '学校', time: '16:30-18:00', description: '練習', uniform: '' },
  { date: '2025-10-29', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-10-30', location: '学校', time: '15:30-18:00', description: '練習【高1・2】実力テスト', uniform: '' },
  { date: '2025-10-31', location: '学校', time: '16:30-18:00', description: '練習', uniform: '' },

  // === 11月 ===
  { date: '2025-11-01', location: '学校', time: '13:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-02', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-11-03', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-11-04', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-05', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-11-06', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-07', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-08', location: '学校', time: '17:00', description: '練習', uniform: '' },
  { date: '2025-11-09', location: '慶應志木・早大学院', time: '', description: '試合 vs 慶應志木・早大学院', uniform: '白' },
  { date: '2025-11-10', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-11', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-11-12', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-13', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-11-14', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-15', location: '学校', time: '13:30-18:00', description: '中西さん・柳様', uniform: '' },
  { date: '2025-11-16', location: '鷲宮', time: '', description: '試合 vs 鷲宮', uniform: 'グレー' },
  { date: '2025-11-17', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-18', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-11-19', location: '学校', time: '15:30-18:00', description: '【高1】霜月会', uniform: '' },
  { date: '2025-11-20', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-11-21', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-22', location: '学校', time: '13:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-23', location: '都立第四商業', time: '', description: '試合 vs 都立第四商業', uniform: '白' },
  { date: '2025-11-24', location: '麗澤', time: '', description: '試合 vs 麗澤', uniform: 'グレー' },
  { date: '2025-11-25', location: '学校', time: '15:30-18:00', description: '萬徳さん', uniform: '' },
  { date: '2025-11-26', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-11-27', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-28', location: '学校', time: '15:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-29', location: '学校', time: '13:30-18:00', description: '練習', uniform: '' },
  { date: '2025-11-30', location: '二子玉川緑地', time: '', description: '試合 vs 東京都市大学附属', uniform: '白' },

  // === 12月 ===
  { date: '2025-12-01', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2025-12-02', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2025-12-03', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2025-12-04', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2025-12-05', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2025-12-06', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2025-12-07', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2025-12-08', location: '', time: '', description: 'OFF 期末考査1日目', uniform: '' },
  { date: '2025-12-09', location: '', time: '', description: 'OFF 期末考査2日目', uniform: '' },
  { date: '2025-12-10', location: '', time: '', description: 'OFF 期末考査3日目', uniform: '' },
  { date: '2025-12-11', location: '学校', time: '13:00', description: '期末考査4日目', uniform: '' },
  { date: '2025-12-12', location: '学校', time: '8:00', description: 'ティーボール教室', uniform: '' },
  { date: '2025-12-13', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-12-14', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-12-15', location: '学校', time: '13:00', description: '答案返却', uniform: '' },
  { date: '2025-12-16', location: '校外', time: '13:00', description: 'フィールドワーク 答案返却', uniform: '' },
  { date: '2025-12-17', location: '', time: '', description: 'OFF 成績処理日', uniform: '' },
  { date: '2025-12-18', location: '三郷', time: '8:00-15:00', description: '練習', uniform: '' },
  { date: '2025-12-19', location: '', time: '', description: 'OFF 視聴覚行事', uniform: '' },
  { date: '2025-12-20', location: '', time: '', description: 'OFF 成績会議日', uniform: '' },
  { date: '2025-12-21', location: '麗澤', time: '', description: '麗澤 合同練習', uniform: '' },
  { date: '2025-12-22', location: '三郷', time: '8:00-13:00', description: '練習', uniform: '' },
  { date: '2025-12-23', location: '浜（葛西）', time: '13:45', description: 'ダンス部公演 萬T 終業式', uniform: '' },
  { date: '2025-12-24', location: '三郷', time: '8:00-12:00', description: '練習（校庭活動禁止）', uniform: '' },
  { date: '2025-12-25', location: '戸田橋A面', time: '9:00-16:00', description: '練習（校庭活動禁止）', uniform: '' },
  { date: '2025-12-26', location: '戸田橋B面', time: '9:00-16:00', description: '練習 部活納', uniform: '' },
  { date: '2025-12-27', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-12-28', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-12-29', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-12-30', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2025-12-31', location: '', time: '', description: 'OFF', uniform: '' },

  // === 1月(2026) ===
  { date: '2026-01-01', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-01-02', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-01-03', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-01-04', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-01-05', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-01-06', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-01-07', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-01-08', location: '海・浜・走', time: '13:00', description: '始業式', uniform: '' },
  { date: '2026-01-09', location: '', time: '', description: 'OFF 百周年記念式典', uniform: '' },
  { date: '2026-01-10', location: '学校', time: '13:00-18:00', description: '追試', uniform: '' },
  { date: '2026-01-11', location: '東村山西', time: '9:00', description: '合同練習', uniform: '' },
  { date: '2026-01-12', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-01-13', location: '学校', time: '15:45-18:00', description: '追試', uniform: '' },
  { date: '2026-01-14', location: '学校', time: '15:30', description: 'MTG 追試', uniform: '' },
  { date: '2026-01-15', location: '学校', time: '15:45-18:00', description: '追試', uniform: '' },
  { date: '2026-01-16', location: '学校', time: '15:45-18:00', description: '実力テスト', uniform: '' },
  { date: '2026-01-17', location: '学校', time: '13:00-18:00', description: '中西さん', uniform: '' },
  { date: '2026-01-18', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-01-19', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-01-20', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-01-21', location: '', time: '', description: 'OFF 部活禁止', uniform: '' },
  { date: '2026-01-22', location: '', time: '', description: 'OFF 部活禁止', uniform: '' },
  { date: '2026-01-23', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-01-24', location: '学校', time: '13:00-18:00', description: '練習', uniform: '' },
  { date: '2026-01-25', location: '', time: '', description: '河合模試', uniform: '' },
  { date: '2026-01-26', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-01-27', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-01-28', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-01-29', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-01-30', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-01-31', location: '', time: '', description: 'OFF 部活禁止', uniform: '' },

  // === 2月(2026) ===
  { date: '2026-02-01', location: '', time: '', description: 'OFF 中学入試①②', uniform: '' },
  { date: '2026-02-02', location: '三郷', time: '10:00-16:00', description: '練習 中学入試③④', uniform: '' },
  { date: '2026-02-03', location: '', time: '', description: 'OFF 部活禁止', uniform: '' },
  { date: '2026-02-04', location: '', time: '', description: 'OFF 中学入試⑤', uniform: '' },
  { date: '2026-02-05', location: '学校', time: '15:45-18:00', description: '実力テスト', uniform: '' },
  { date: '2026-02-06', location: '学校', time: '15:45-18:00', description: '【高2】実力テスト', uniform: '' },
  { date: '2026-02-07', location: '学校', time: '13:00-18:00', description: '練習', uniform: '' },
  { date: '2026-02-08', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-02-09', location: '', time: '', description: 'OFF 部活禁止', uniform: '' },
  { date: '2026-02-10', location: '三郷', time: '', description: '高校入試①', uniform: '' },
  { date: '2026-02-11', location: '', time: '', description: 'OFF 高校入試②', uniform: '' },
  { date: '2026-02-12', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-02-13', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-02-14', location: '学校', time: '13:00-18:00', description: '練習', uniform: '' },
  { date: '2026-02-15', location: '上野学園', time: '', description: '合同練習', uniform: 'グレー' },
  { date: '2026-02-16', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-02-17', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-02-18', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-02-19', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-02-20', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-02-21', location: '学校', time: '13:00-18:00', description: '練習', uniform: '' },
  { date: '2026-02-22', location: '学校', time: '9:00-13:00', description: '練習', uniform: '' },
  { date: '2026-02-23', location: '都市大付属', time: '13:00', description: '合同練習 天皇誕生日', uniform: '白' },
  { date: '2026-02-24', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-02-25', location: '学校', time: '15:45-18:00', description: '練習', uniform: '' },
  { date: '2026-02-26', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2026-02-27', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2026-02-28', location: '', time: '', description: 'OFF（試験1週間前）新入生採寸', uniform: '' },

  // === 3月(2026) ===
  { date: '2026-03-01', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2026-03-02', location: '', time: '', description: 'OFF（試験1週間前）', uniform: '' },
  { date: '2026-03-03', location: '', time: '', description: 'OFF 卒業式', uniform: '' },
  { date: '2026-03-04', location: '', time: '', description: 'OFF 期末考査1日目', uniform: '' },
  { date: '2026-03-05', location: '', time: '', description: 'OFF 期末考査2日目', uniform: '' },
  { date: '2026-03-06', location: '', time: '', description: 'OFF 期末考査3日目', uniform: '' },
  { date: '2026-03-07', location: '戸田橋', time: '', description: '期末考査4日目 練習試合解禁日', uniform: '' },
  { date: '2026-03-08', location: '鷲宮', time: '', description: '抽選会（9:30〜）', uniform: 'グレー' },
  { date: '2026-03-09', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2026-03-10', location: '三郷', time: '', description: '練習', uniform: '' },
  { date: '2026-03-11', location: '三郷', time: '', description: '答案返却', uniform: '' },
  { date: '2026-03-12', location: '', time: '', description: 'OFF 答案返却', uniform: '' },
  { date: '2026-03-13', location: '三郷', time: '', description: '練習', uniform: '' },
  { date: '2026-03-14', location: '', time: '', description: '一次予選開始（試合？）', uniform: '' },
  { date: '2026-03-15', location: '', time: '', description: '試合？', uniform: '' },
  { date: '2026-03-16', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2026-03-17', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-03-19', location: '学校', time: '', description: '練習', uniform: '' },
  { date: '2026-03-20', location: '', time: '', description: 'ブロック決勝？ 春分の日', uniform: '' },
  { date: '2026-03-21', location: '', time: '', description: 'ブロック決勝？ 修了式', uniform: '' },
  { date: '2026-03-22', location: '', time: '', description: 'ブロック決勝？', uniform: '' },
  { date: '2026-03-23', location: '学校', time: '', description: '終業式', uniform: '' },
  { date: '2026-03-24', location: '', time: '', description: 'OFF', uniform: '' },
  { date: '2026-03-25', location: '三郷', time: '', description: '中学生練習参加開始', uniform: '' },
  { date: '2026-03-26', location: '三郷', time: '', description: '練習', uniform: '' },
  { date: '2026-03-27', location: '三郷', time: '', description: '練習', uniform: '' },
];

// ============================
// 2026年度予定表データ（試合日程のみ）
// ============================
const schedules2026 = [
  { date: '2026-04-19', location: '東村山西', time: '', description: '試合 vs 東村山西', uniform: '' },
  { date: '2026-04-26', location: '岩槻商', time: '', description: '試合 vs 岩槻商', uniform: '' },
  { date: '2026-05-03', location: '合宿', time: '', description: 'GW合宿 1日目 試合', uniform: '' },
  { date: '2026-05-04', location: '合宿', time: '', description: 'GW合宿 2日目 試合', uniform: '' },
  { date: '2026-05-05', location: '葵陵・つくば国際東風', time: '', description: 'GW合宿 3日目 試合', uniform: '' },
  { date: '2026-05-25', location: '我孫子', time: '', description: '試合 vs 我孫子', uniform: '' },
  { date: '2026-05-30', location: '草加東', time: 'PM', description: '試合 vs 草加東', uniform: '' },
  { date: '2026-05-31', location: '牛久栄進', time: '', description: '試合 vs 牛久栄進', uniform: '' },
  { date: '2026-06-06', location: '総合工科', time: '', description: '試合 vs 総合工科', uniform: '' },
  { date: '2026-06-07', location: '我孫子二階堂', time: '', description: '試合 vs 我孫子二階堂', uniform: '' },
  { date: '2026-06-20', location: '浦和東', time: '15:00', description: '試合 vs 浦和東', uniform: '' },
  { date: '2026-06-21', location: '守谷・松戸馬橋', time: '', description: '試合 vs 守谷・松戸馬橋', uniform: '' },
  { date: '2026-07-04', location: '神宮球場', time: '9:00', description: '開会式', uniform: '' },
  { date: '2026-08-01', location: '都市大付属', time: '', description: '試合 vs 都市大付属', uniform: '' },
  { date: '2026-08-04', location: '京華', time: '', description: '試合 vs 京華', uniform: '' },
  { date: '2026-08-23', location: '成蹊', time: '', description: '試合 vs 成蹊', uniform: '' },
  { date: '2026-08-26', location: '本郷・上野学園', time: '', description: '試合 vs 上野学園', uniform: '' },
  { date: '2026-09-27', location: '安田学園', time: '', description: '試合 vs 安田学園', uniform: '' },
  { date: '2026-11-23', location: '麗沢', time: '', description: '試合 vs 麗沢', uniform: '' },
  { date: '2026-11-29', location: '都市大付属', time: '', description: '試合 vs 都市大付属', uniform: '' },
];

// Insert schedules
async function insertSchedules(schedules, yearLabel) {
  let inserted = 0;
  let skipped = 0;
  for (const s of schedules) {
    const { start, end } = parseTime(s.time);
    const eventType = getEventType(s.description, s.location);
    
    // Build title
    let title = s.description || '予定';
    
    // Check for duplicate
    const [existing] = await conn.execute(
      'SELECT id FROM schedules WHERE eventDate = ? AND title = ? LIMIT 1',
      [s.date, title]
    );
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await conn.execute(
      `INSERT INTO schedules (title, description, eventType, eventDate, startTime, endTime, location, uniform, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title,
        s.description || null,
        eventType,
        s.date,
        start || null,
        end || null,
        s.location || null,
        s.uniform || null,
      ]
    );
    inserted++;
  }
  console.log(`[${yearLabel}] Inserted: ${inserted}, Skipped (duplicate): ${skipped}`);
}

console.log('=== 予定表データ投入開始 ===');
await insertSchedules(schedules2025, '2025年度');
await insertSchedules(schedules2026, '2026年度');

// Verify
const [count] = await conn.execute('SELECT COUNT(*) as cnt FROM schedules');
console.log(`Total schedules in DB: ${count[0].cnt}`);

const [byType] = await conn.execute('SELECT eventType, COUNT(*) as cnt FROM schedules GROUP BY eventType');
console.log('By type:', byType);

await conn.end();
console.log('=== 完了 ===');
