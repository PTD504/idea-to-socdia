import { create } from 'zustand';

export type Stage = 'input' | 'result' | 'stream' | 'editor' | 'preview';

export interface ParsedMedia {
  id: string;
  type: string;
  url: string;
  prompt: string;
  isThumbnail?: boolean;
  order?: number;
  isUploaded?: boolean;
}
export interface ParsedData {
  title?: string;
  content?: string;
  hashtags?: string;
  youtubeTags?: string;
  media: ParsedMedia[];
}

export interface Scene {
    id: string;
    text: string;
    image_prompt: string;
    estimated_duration: string;
    imageUrl?: string;
}

export interface StreamBlock {
    id: string;
    type: 'text' | 'tool_start' | 'media_result' | 'error';
    content: string;
    toolName?: string;
    tool?: string;
    url?: string;
}

interface WorkflowState {
    currentStage: Stage;
    parsedData: ParsedData | null;
    topic: string;
    deepDescription: string;
    style: string;
    targetFormat: string;
    finalText: string;
    referenceImageBase64: string | null;
    referenceImages: string[];
    imageInstructions: string;
    includeMediaInPost: boolean;
    scenes: Scene[];
    streamBlocks: StreamBlock[];
    isStreaming: boolean;
    setStage: (stage: Stage) => void;
    setTopic: (topic: string) => void;
    setDeepDescription: (desc: string) => void;
    setStyle: (style: string) => void;
    setTargetFormat: (format: string) => void;
    setFinalText: (text: string) => void;
    setReferenceImageBase64: (base64: string | null) => void;
    setReferenceImages: (images: string[]) => void;
    setImageInstructions: (instructions: string) => void;
    setIncludeMediaInPost: (include: boolean) => void;
    setScenes: (scenes: Scene[]) => void;
    updateScene: (id: string, updates: Partial<Scene>) => void;
    appendStreamBlock: (block: StreamBlock) => void;
    updateStreamBlock: (id: string, updates: Partial<StreamBlock>) => void;
    appendContentToLastTextBlock: (content: string) => void;
    setIsStreaming: (status: boolean) => void;
    parseAndSetEditorData: (rawText: string, format: string, referenceImages?: string[], includeMedia?: boolean) => void;
    updateMediaItem: (id: string, newUrl: string, newPrompt: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
    currentStage: 'input',
    parsedData: null,
    topic: '',
    deepDescription: '',
    style: '',
    targetFormat: 'facebook_post',
    finalText: '',
    referenceImageBase64: null,
    referenceImages: [],
    imageInstructions: '',
    includeMediaInPost: false,
    scenes: [],
    streamBlocks: [],
    isStreaming: false,
    setStage: (stage) => set({ currentStage: stage }),
    setTopic: (topic) => set({ topic }),
    setDeepDescription: (deepDescription) => set({ deepDescription }),
    setStyle: (style) => set({ style }),
    setTargetFormat: (format) => set({ targetFormat: format }),
    setFinalText: (text) => set({ finalText: text }),
    setReferenceImageBase64: (base64) => set({ referenceImageBase64: base64 }),
    setReferenceImages: (images) => set({ referenceImages: images }),
    setImageInstructions: (instructions) => set({ imageInstructions: instructions }),
    setIncludeMediaInPost: (include) => set({ includeMediaInPost: include }),
    setScenes: (scenes) => set({ scenes }),
    updateScene: (id, updates) => set((state) => ({
        scenes: state.scenes.map(scene => scene.id === id ? { ...scene, ...updates } : scene)
    })),
    appendStreamBlock: (block) => set((state) => ({
        streamBlocks: [...state.streamBlocks, block]
    })),
    updateStreamBlock: (id, updates) => set((state) => ({
        streamBlocks: state.streamBlocks.map(b => b.id === id ? { ...b, ...updates } : b)
    })),
    appendContentToLastTextBlock: (content) => set((state) => {
        const blocks = [...state.streamBlocks];
        if (blocks.length > 0 && blocks[blocks.length - 1].type === 'text') {
            const lastIndex = blocks.length - 1;
            blocks[lastIndex] = {
                ...blocks[lastIndex],
                content: blocks[lastIndex].content + content
            };
            return { streamBlocks: blocks };
        } else {
            return {
                streamBlocks: [...blocks, { id: crypto.randomUUID(), type: 'text', content, toolName: undefined }]
            };
        }
    }),
    setIsStreaming: (status) => set({ isStreaming: status }),
    updateMediaItem: (id, newUrl, newPrompt) => set((state) => {
        if (!state.parsedData) return state;
        const updatedMedia = state.parsedData.media.map(m => 
            m.id === id ? { ...m, url: newUrl, prompt: newPrompt } : m
        );
        return { parsedData: { ...state.parsedData, media: updatedMedia } };
    }),
    parseAndSetEditorData: (rawText, format, referenceImages, includeMedia) => {
        const deliverableMatch = rawText.match(/<final_deliverable>([\s\S]*?)<\/final_deliverable>/);
        if (!deliverableMatch) return;
        const xmlContent = deliverableMatch[1];

        const titleMatch = xmlContent.match(/<video_title>([\s\S]*?)<\/video_title>/);
        const descMatch = xmlContent.match(/<video_description>([\s\S]*?)<\/video_description>/) || xmlContent.match(/<post_caption>([\s\S]*?)<\/post_caption>/);
        const hashtagsMatch = xmlContent.match(/<hashtags>([\s\S]*?)<\/hashtags>/);
        const youtubeTagsMatch = xmlContent.match(/<youtube_tags>([\s\S]*?)<\/youtube_tags>/);

        const title = titleMatch ? titleMatch[1].trim() : undefined;
        const content = descMatch ? descMatch[1].trim() : undefined;
        const hashtags = hashtagsMatch ? hashtagsMatch[1].trim() : undefined;
        const youtubeTags = youtubeTagsMatch ? youtubeTagsMatch[1].trim() : undefined;

        const mediaTags: RegExpExecArray[] = [];
        const mediaRegex = /<media([^>]*)>/g;
        let match;
        while ((match = mediaRegex.exec(xmlContent)) !== null) {
            mediaTags.push(match);
        }
        const media: ParsedMedia[] = mediaTags.map((match, index) => {
            const attrString = match[1];
            const typeMatch = attrString.match(/type="([^"]*)"/);
            const urlMatch = attrString.match(/url="([^"]*)"/);
            const promptMatch = attrString.match(/prompt="([^"]*)"/);

            return {
                id: `${Date.now()}-${index}`,
                type: typeMatch ? typeMatch[1] : 'unknown',
                url: urlMatch ? urlMatch[1] : '',
                prompt: promptMatch ? promptMatch[1] : ''
            };
        });

        if (includeMedia === true && referenceImages && referenceImages.length > 0) {
            referenceImages.forEach((imgBase64) => {
                const imgDataUrl = imgBase64.startsWith('data:') ? imgBase64 : `data:image/jpeg;base64,${imgBase64}`;
                media.push({
                    id: crypto.randomUUID(),
                    type: 'image',
                    url: imgDataUrl,
                    prompt: 'User Uploaded Reference Asset',
                    isUploaded: true
                });
            });
        }

        if (format === 'youtube_video' || format === 'youtube_short') {
            const firstImage = media.find(m => m.type === 'image');
            if (firstImage) {
                firstImage.isThumbnail = true;
            }
            let videoOrder = 1;
            media.forEach(m => {
                if (m.type === 'video') {
                    m.order = videoOrder++;
                }
            });
        }

        set({ parsedData: { title, content, hashtags, youtubeTags, media } });
    },
}));
