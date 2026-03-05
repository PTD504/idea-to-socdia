import { create } from 'zustand';

export type Stage = 'input' | 'processing' | 'result' | 'script' | 'stream';

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
}

interface WorkflowState {
    currentStage: Stage;
    topic: string;
    deepDescription: string;
    style: string;
    scenes: Scene[];
    streamBlocks: StreamBlock[];
    isStreaming: boolean;
    setStage: (stage: Stage) => void;
    setTopic: (topic: string) => void;
    setDeepDescription: (desc: string) => void;
    setStyle: (style: string) => void;
    setScenes: (scenes: Scene[]) => void;
    updateScene: (id: string, updates: Partial<Scene>) => void;
    appendStreamBlock: (block: StreamBlock) => void;
    updateStreamBlock: (id: string, updates: Partial<StreamBlock>) => void;
    appendContentToLastTextBlock: (content: string) => void;
    setIsStreaming: (status: boolean) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
    currentStage: 'input',
    topic: '',
    deepDescription: '',
    style: '',
    scenes: [],
    streamBlocks: [],
    isStreaming: false,
    setStage: (stage) => set({ currentStage: stage }),
    setTopic: (topic) => set({ topic }),
    setDeepDescription: (deepDescription) => set({ deepDescription }),
    setStyle: (style) => set({ style }),
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
}));
