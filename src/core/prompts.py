"""
Centralized prompt templates and builders for the AI content generation system.
"""

# OPTIMIZED: Concise guidelines with strict tool bounding and hashtag limits.
FORMAT_GUIDELINES = {
    "facebook_post": (
        "FORMAT: Facebook Post.\n"
        "STYLE: Engaging, community-focused, and conversational. Use line breaks and spacing for readability in the feed. "
        "MEDIA: Interleave 1 to 3 high-quality images (more than 3 if user requests). Call 'generate_image' at key visual moments. — do not cluster all images at the start or end. "
        "HASHTAGS: Include hashtags suitable for content topic (at most 5 hashtags)."
    ),
    "instagram_post": (
        "FORMAT: Instagram Post.\n"
        "STYLE: Visual-first. Caption complements the image, not the other way around. "
        "MEDIA: Always call 'generate_image' BEFORE writing the caption. "
        "1 image for single posts. 3 to 5 images for carousel posts, keeping them thematically consistent. Prioritize carousel posts over single posts if user doesn't specify otherwise."
    ),
    "youtube_video": (
        "FORMAT: Long-form YouTube Video.\n"
        "STYLE: Structured as a professional video script. Include intro, body segments, and outro. "
        "HASHTAGS: Do NOT include hashtags anywhere. "
        "MEDIA: Heavily interleave 'generate_video' calls throughout for scenes, b-roll, and transitions. "
        "Then call 'generate_image' EXACTLY ONCE for the YouTube Thumbnail. Make sure the thumbnail is engaging and represents the content well."
    ),
    "youtube_short": (
        "FORMAT: YouTube Short (Vertical Video).\n"
        "STYLE: Fast-paced, maximum 60 seconds of narration (based on the content, though 20-30 seconds is ideal). Open with a powerful hook in the first 3 seconds. "
        "HASHTAGS: Include 1 to 2 hashtags (maximum 3). Place them EITHER in the title OR in the description — never both. "
        "MEDIA: Interleave 'generate_video' calls throughout for dynamic, fast-moving vertical visuals. "
        "Then call 'generate_image' EXACTLY ONCE for the Cover Thumbnail. Make sure the thumbnail is engaging and represents the content well."
    ),
    "youtube_post": (
        "FORMAT: YouTube Community Post.\n"
        "STYLE: Conversational, addressing subscribers directly — to tease upcoming content or share updates, or anything else the user requests. "
        "MEDIA: Primarily text. Call 'generate_image' as a teaser visual or poll background, 1-2 images is ideal but 4 is maximum."
    ),
}

def _get_xml_template(target_format: str) -> str:
    """Returns strictly targeted XML structures with specific field constraints."""
    if target_format in ["youtube_video", "youtube_short"]:
        return (
            "<final_deliverable>\n"
            "    <video_title>SEO-optimized title</video_title>\n"
            "    <video_description>Detailed description. STRICT RULE: DO NOT INCLUDE ANY HASHTAGS HERE.</video_description>\n"
            "    <youtube_tags>comma, separated, list, max 500 characters</youtube_tags>\n"
            "    <media_list>\n"
            "        <media type=\"video_or_image\" url=\"EXACT_TOOL_URL\" prompt=\"Exact prompt used\" />\n"
            "    </media_list>\n"
            "</final_deliverable>"
        )
    else:
        return (
            "<final_deliverable>\n"
            "    <post_caption>The complete text. STRICT RULE: PLAIN TEXT ONLY. NO MARKDOWN.</post_caption>\n"
            "    <hashtags>#Space #Separated #Hashtags</hashtags>\n"
            "    <media_list>\n"
            "        <media type=\"image\" url=\"EXACT_TOOL_URL\" prompt=\"Exact prompt used\" />\n"
            "    </media_list>\n"
            "</final_deliverable>"
        )

def build_stream_system_prompt(
    topic: str,
    target_format: str,
    deep_description: str | None = None,
    style: str | None = None,
    image_instructions: str | None = None,
    has_reference_images: bool = False,
) -> str:
    """Builds the highly optimized master system prompt."""
    
    xml_template = _get_xml_template(target_format)
    
    # OPTIMIZED: Bullet points, strong negative constraints, removed narrative fluff.
    base_prompt = (
        "You are an elite Multimodal Content Director. "
        "Execute your response in TWO SEAMLESS PHASES within a single output. But do not contain the \"PHASE 1\" or \"PHASE 2\" markers in your output.\n\n"

        "--- GROUNDING & ANTI-HALLUCINATION RULES ---\n"
        "- STRICT LOYALTY: Base all content, facts, and claims STRICTLY on the provided TOPIC and USER INSTRUCTIONS. NEVER invent unprovided statistics, names, historical events, or quotes.\n"
        "- NO FAKE LINKS: NEVER generate fake URLs, domains, or external links.\n"
        "- VAGUENESS FALLBACK: If the user's prompt is brief or lacks specific details, expand creatively using safe, general concepts. Do NOT fabricate highly specific, verifiable facts to fill the gaps.\n\n"

        "--- PHASE 1: NATIVE DRAFTING & TOOL CALLING ---\n"
        "- STRATEGY FIRST: Start by explaining your overall strategy for the text/script, tone, and pacing based on the user's input. Why we should create the content in this way.\n"
        "- EXECUTE MEDIA: After explaining the text strategy, begin interleaving your commentary with actual media generation. When a visual is needed, STOP writing and call the appropriate media tool (see format rules).\n"
        "- IGNORE URLS: When a tool returns a URL, continue your commentary, referencing the visual you just created but NEVER output the URL string in your text.\n"
        "- RICH FORMATTING: You MUST use rich Markdown formatting in this phase, like **bold**, *italic*, list items, etc. Make your commentary visually engaging to read.\n"
        "- NO TECHNICAL JARGON: You are speaking to a Content Creator, NOT a software developer. NEVER expose internal tool names like 'generate_video', 'generate_image', etc.\n\n"
        
        "--- PHASE 2: XML FINALIZATION ---\n"
        "- SILENT TRANSITION: NEVER announce the transition. DO NOT write 'Now let's compile...', 'Here is the final deliverable', or anything similar. End your draft and immediately open the `<final_deliverable>` tag.\n"
        "- STRICT PLAIN TEXT: INSIDE the XML, absolutely NO MARKDOWN (*, **, # for headers, etc) is allowed. Use standard line breaks only. EXCEPTION: You are ALLOWED to use the '#' symbol strictly for social media hashtags.\n"
        "- URL SYNC: Inside the `<media>` tags, use the EXACT URLs returned by the tools in Phase 1.\n\n"
        f"- OUTPUT XML TEMPLATE:\n{xml_template}\n\n"
    )

    base_prompt += f"--- CONTEXT ---\nTOPIC: {topic}\n"
    
    format_guide = FORMAT_GUIDELINES.get(target_format, f"FORMAT (For final deliverable): {target_format}.")
    base_prompt += f"{format_guide}\n"
    
    if style:
        base_prompt += f"STYLE/VIBE: {style}\n"
    if deep_description:
        base_prompt += f"USER INSTRUCTIONS: {deep_description}\n"
    if has_reference_images and image_instructions:
        base_prompt += f"REFERENCE MEDIA GUIDANCE: {image_instructions}\n"

    return base_prompt

def build_enhance_text_prompt(
    target_format: str,
    main_field_label: str,
    target_field_label: str,
    target_field_text: str | None = None,
    extra_context: str | None = None,
) -> str:
    """Builds the optimized system prompt for the enhance_text API."""
    existing_text_block = ""
    if target_field_text:
        existing_text_block = (
            f"CURRENT FIELD TEXT: \"{target_field_text}\"\n"
            "RULE: Incorporate meaningful ideas from this text. Ignore it if it is gibberish.\n"
        )

    extra_block = f"EXTRA CONTEXT: {extra_context}\n" if extra_context else ""

    return (
        f"TASK: Write a professional briefing paragraph for an AI content generator.\n"
        f"TARGET FORMAT: {target_format}\n"
        f"FIELD TO ENHANCE: {target_field_label}\n\n"
        f"CORE IDEA: {main_field_label}\n"
        f"{existing_text_block}"
        f"{extra_block}\n"
        "CONSTRAINTS:\n"
        "- Write a rich, descriptive paragraph detailing the core message.\n"
        "- Provide ONLY the final brief text. No introductory or concluding remarks.\n"
        "- DO NOT write the actual social media post. Write INSTRUCTIONS for the AI.\n"
        "- NO EMOJIS. NO HASHTAGS.\n"
    )