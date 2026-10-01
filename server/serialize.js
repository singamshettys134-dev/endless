/** Strip server-only fields (topicVector, scratch fields) from a video before sending it. */
export function publicVideo(video, extra = {}) {
  if (!video) return null;
  const { topicVector, _t, ...rest } = video;
  return { ...rest, ...extra };
}

export function publicVideos(list) {
  return list.map((v) => publicVideo(v));
}
