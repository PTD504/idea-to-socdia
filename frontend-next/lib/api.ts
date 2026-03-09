export interface EnhanceTextPayload {
    target_format: string;
    main_field_label: string;
    main_field_text: string;
    target_field_label: string;
    target_field_text?: string;
    extra_context?: string;
}

export async function enhanceText(payload: EnhanceTextPayload): Promise<string> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const response = await fetch(`${apiUrl}/enhance_text`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.enhanced_text || "";
}

export async function regenerateMediaAPI(mediaType: string, prompt: string, aspectRatio?: string): Promise<string> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const response = await fetch(`${apiUrl}/regenerate_media`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            media_type: mediaType,
            prompt: prompt,
            aspect_ratio: aspectRatio || null
        }),
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.url || "";
}
