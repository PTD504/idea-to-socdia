export interface StreamChunk {
    type: string;
    content: string;
    tool?: string;
    url?: string;
}

import { useWorkflowStore } from "@/store/workflowStore";

export async function fetchStreamWorkflow(
    payload: Record<string, unknown>,
    onChunk: (chunk: StreamChunk) => void
) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    // const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Use this for production, ensure it's set in .env

    useWorkflowStore.getState().setIsStreaming(true);

    try {
        const response = await fetch(`${apiUrl}/stream_workflow`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        if (!response.body) {
            throw new Error("ReadableStream not yet supported in this browser.");
        }

        console.log("Stream connected, waiting for chunks...");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            // Decode the current chunk and append to the buffer
            const chunkString = decoder.decode(value, { stream: true });
            console.log("Received raw chunk:", chunkString);
            buffer += chunkString;

            // Split the buffer by newlines to find complete NDJSON objects
            const lines = buffer.split("\n");

            // The last element is either empty (if buffer ended with \n) 
            // or an incomplete string. Keep it in the buffer for the next iteration.
            buffer = lines.pop() || "";

            // Parse complete lines and send to callback
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const parsedChunk = JSON.parse(line);
                        onChunk(parsedChunk);
                    } catch (error) {
                        console.warn("Failed to parse JSON line:", line, error);
                    }
                }
            }
        }

        // Process any remaining content in the buffer when the stream is done
        if (buffer.trim()) {
            try {
                const parsedChunk = JSON.parse(buffer);
                onChunk(parsedChunk);
            } catch (e) {
                console.warn("Failed to parse final NDJSON line:", buffer, e);
            }
        }

    } catch (error) {
        console.error("Stream workflow failed:", error);
        onChunk({ type: "error", content: error instanceof Error ? error.message : "Unknown stream error" });
    } finally {
        useWorkflowStore.getState().setIsStreaming(false);
    }
}
