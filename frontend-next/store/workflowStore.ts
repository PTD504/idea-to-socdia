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

export type ParsedTextField = 'title' | 'content' | 'hashtags' | 'youtubeTags';

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
    isMergingVideos: boolean;
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
    setIsMergingVideos: (status: boolean) => void;
    parseAndSetEditorData: (rawText: string, format: string, referenceImages?: string[], includeMedia?: boolean) => void;
    updateMediaItem: (id: string, newUrl: string, newPrompt: string) => void;
    updateParsedData: (updates: Partial<ParsedData>) => void;
    updateParsedTextField: (field: ParsedTextField, value: string) => void;
    finalVideoUrl: string | null;
    setFinalVideoUrl: (url: string | null) => void;
    mergeVideoScenes: () => Promise<void>;
    resetWorkflow: () => void;
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
    isMergingVideos: false,
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
    setIsMergingVideos: (status) => set({ isMergingVideos: status }),
    updateParsedData: (updates) => set((state) => ({
        parsedData: state.parsedData ? { ...state.parsedData, ...updates } : null
    })),
    updateParsedTextField: (field, value) => set((state) => {
        if (!state.parsedData) return state;
        return {
            parsedData: {
                ...state.parsedData,
                [field]: value,
            },
        };
    }),
    updateMediaItem: (id, newUrl, newPrompt) => set((state) => {
        if (!state.parsedData) return state;
        const updatedMedia = state.parsedData.media.map(m => 
            m.id === id ? { ...m, url: newUrl, prompt: newPrompt } : m
        );
        return { parsedData: { ...state.parsedData, media: updatedMedia } };
    }),
    finalVideoUrl: null,
    setFinalVideoUrl: (url) => set({ finalVideoUrl: url }),
    resetWorkflow: () => set({
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
        isMergingVideos: false,
        finalVideoUrl: null
    }),
    mergeVideoScenes: async () => {
        const state = useWorkflowStore.getState();
        if (state.isMergingVideos) return;
        if (!state.parsedData || !state.parsedData.media) return;

        state.setIsMergingVideos(true);

        const videoUrls = state.parsedData.media
            .filter(m => m.type === 'video')
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(m => m.url)
            .filter(url => url && url.trim() !== '');

        if (videoUrls.length === 0) {
            console.warn("No valid video URLs to merge.");
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/merge_videos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_urls: videoUrls }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Failed to merge videos:", errorData);
                alert(`Failed to merge videos: ${errorData.detail || response.statusText}`);
                return;
            }

            const data = await response.json();
            if (data.url) {
                state.setFinalVideoUrl(data.url);
            }
        } catch (error) {
            console.error("Network error while merging videos:", error);
            alert("Network error while merging videos. Please check your connection and try again.");
        } finally {
            useWorkflowStore.getState().setIsMergingVideos(false);
        }
    },
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

