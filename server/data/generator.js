import { categories } from '../config.js';

const titleWords = {
  Gaming: ['Arcade', 'Battle', 'Pixel', 'Quest', 'Arena', 'Nitro', 'Co-op', 'Speedrun', 'Boss', 'Lag'],
  Music: ['Night', 'Echo', 'Synth', 'Groove', 'Drift', 'Vibes', 'Session', 'Pulse', 'Chorus', 'Melody'],
  Tech: ['Build', 'System', 'Cloud', 'Edge', 'Tensor', 'Signal', 'Stack', 'Code', 'Bench', 'Debug'],
  Cricket: ['Cover', 'Powerplay', 'Drive', 'Wicket', 'Figure', 'Finish', 'Strike', 'Test', 'Stadium', 'Yorker'],
  Cooking: ['Fire', 'Sizzle', 'Pan', 'Bowl', 'Spice', 'Meal', 'Recipe', 'Kitchen', 'Crust', 'Sauce'],
  Travel: ['Drift', 'Trail', 'Summit', 'Coast', 'Breeze', 'Route', 'Nomad', 'Horizon', 'Harbor', 'Nightfall'],
  Education: ['Method', 'Lesson', 'Insight', 'Framework', 'Concept', 'Proof', 'Practice', 'Map', 'Build', 'Workshop'],
  Comedy: ['Sketch', 'Chaos', 'Meme', 'Punchline', 'Buffer', 'Prank', 'Laugh', 'Bits', 'Fail', 'Anecdote'],
  News: ['Brief', 'Briefing', 'Signal', 'Frontline', 'Daily', 'Update', 'Focus', 'Report', 'Instant', 'Pulse'],
  Fitness: ['Lift', 'Sprint', 'Core', 'Flow', 'Power', 'Hustle', 'Mobility', 'Recovery', 'Sets', 'Tempo'],
  Movies: ['Frame', 'Scene', 'Cut', 'Run', 'Reel', 'Drama', 'Skyline', 'Night', 'Vibe', 'Premiere'],
  Science: ['Orbit', 'Particle', 'Signal', 'Field', 'Quantum', 'Study', 'Prototype', 'Theory', 'Vector', 'Phase'],
};

const creatorNames = [
  'Nova Lane', 'Pixel Forge', 'Aster Bloom', 'Drift Studio', 'Bridge Nine', 'Mira Vale', 'Deep Echo',
  'Orbit Lab', 'Kite Theory', 'Blue Ritual', 'Sunset Crew', 'Field Notes', 'North Loop', 'Copper Byte',
  'Signal House', 'Harbor Theory', 'Cinder Peak', 'Luma Work', 'Brisk Circuit', 'Ash & Thread', 'Wave Form'
];

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function titleFor(category, random) {
  const options = titleWords[category] || titleWords.Gaming;
  const picks = Array.from({ length: 5 + Math.floor(random() * 3) }, () => {
    const idx = Math.floor(random() * options.length);
    return options[idx];
  });
  return [...new Set(picks)].slice(0, 6).join(' ');
}

function makeCreatedAt(random) {
  const daysAgo = Math.floor(random() * 365);
  return Date.now() - daysAgo * 24 * 60 * 60 * 1000;
}

export function createVideoCatalog(totalVideos = 100000) {
  const random = mulberry32(123456789);
  const byId = new Map();
  const byCategory = new Map();
  const popularity = [];
  const trending = [];
  const creators = new Map();
  const videos = [];

  for (let i = 1; i <= totalVideos; i += 1) {
    const category = categories[Math.floor(random() * categories.length)];
    const creatorName = creatorNames[(i * 7) % creatorNames.length];
    const creatorId = `creator-${(i * 13) % 2400}`;
    const quality = Number((0.45 + random() * 0.55).toFixed(4));
    const views = Math.max(1200, Math.round((Math.pow((totalVideos - i + 1) / totalVideos, 0.9) * 25000000) * (0.25 + random() * 2.4)));
    const likes = Math.max(100, Math.round(views * (0.12 + random() * 0.16)));
    const durationSec = 30 + Math.floor(random() * 1850);
    const uploadedAt = makeCreatedAt(random);
    const thumbSeed = Math.floor(random() * 1000000);
    const topicVector = new Float32Array(16);
    const categoryIndex = categories.indexOf(category);
    for (let j = 0; j < 16; j += 1) {
      const base = j === categoryIndex ? 0.8 : 0.12;
      topicVector[j] = Number((base + random() * 0.45).toFixed(4));
    }

    const video = {
      id: i,
      title: titleFor(category, random),
      creatorId,
      creatorName,
      category,
      tags: [category.toLowerCase(), 'live', 'featured', 'demo'],
      views,
      likes,
      durationSec,
      uploadedAt,
      quality,
      topicVector,
      thumbSeed,
    };

    videos.push(video);
    byId.set(i, video);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(video);
    popularity.push(video);
    trending.push(video);
    if (!creators.has(creatorId)) creators.set(creatorId, { name: creatorName, count: 0 });
    creators.get(creatorId).count += 1;
  }

  popularity.sort((a, b) => b.views - a.views);
  trending.sort((a, b) => (b.views * (1 + Math.min(30, (Date.now() - a.uploadedAt) / 86400000 / 20))) - (a.views * (1 + Math.min(30, (Date.now() - b.uploadedAt) / 86400000 / 20))));

  return { videos, byId, byCategory, popularity, trending, creators };
}
