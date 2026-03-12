const FORMAT_ASPECT_RATIO: Record<string, string> = {
    youtube_short: '9:16',
    instagram_post: '9:16',
    youtube_video: '16:9',
    youtube_post: '16:9',
    facebook_post: '16:9',
};

export function getAspectRatioForFormat(targetFormat: string): string {
    return FORMAT_ASPECT_RATIO[targetFormat] || '16:9';
}
