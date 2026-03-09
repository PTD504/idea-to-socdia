"""
Centralized prompt templates and builders for the AI content generation system.
"""

FORMAT_GUIDELINES = {
    "facebook_post": (
        "FORMAT: Facebook Post.\n"
        "STYLE: Engaging, community-focused, and highly visual. Use spacing and structure suitable for a feed. "
        "Typically includes an engaging hook, main body, and a strong call to action. "
        "MEDIA: Interleave 1 to 3 high-quality images. Call 'generate_image' at key visual moments."
    ),
    "instagram_post": (
        "FORMAT: Instagram Post.\n"
        "STYLE: Highly aesthetic, visual-first, and concise. The text (caption) should complement the visual. "
        "MEDIA: Focus heavily on stunning, scroll-stopping visuals. Call 'generate_image' FIRST or early in the generation, followed by a catchy, stylish text caption."
    ),
    "youtube_video": (
        "FORMAT: Long-form YouTube Video.\n"
        "STYLE: Structured like a professional video script/storyboard. Include an intro, deep-dive body segments, and an outro. "
        "MEDIA: You MUST call 'generate_image' EXACTLY ONCE at the very beginning to create a highly clickable, eye-catching YouTube Thumbnail. "
        "For the rest of the content, you MUST heavily interleave 'generate_video' calls to create the actual scenes, b-roll, and transitions."
    ),
    "youtube_short": (
        "FORMAT: YouTube Short (Vertical Video).\n"
        "STYLE: Fast-paced, high-energy, maximum 60 seconds of narration (based on the content, though 20-30 seconds is ideal). Must start with an immediate, powerful hook in the first 3 seconds. "
        "MEDIA: You MUST call 'generate_image' EXACTLY ONCE to create a captivating Cover Image/Thumbnail. "
        "For the core content, prioritize calling 'generate_video' to create dynamic, fast-moving vertical visual hooks."
    ),
    "youtube_post": (
        "FORMAT: YouTube Community Post.\n"
        "STYLE: Conversational, community-building, directly addressing subscribers (e.g., teasing a video, sharing an update). "
        "MEDIA: Mostly text, but interleave exactly 1 'generate_image' call to serve as an illustrative teaser or poll background."
    )
}

def _get_xml_template(target_format: str) -> str:
    """Helper to return strictly targeted XML structures."""
    if target_format in ["youtube_video", "youtube_short"]:
        return (
            "<final_deliverable>\n"
            "    <video_title>Catchy, SEO-optimized title for the video. You can include 1-2 #hashtags here if it's a Short.</video_title>\n"
            "    <video_description>Detailed description box text. Include 3-5 relevant #hashtags at the very end of this description.</video_description>\n"
            "    <youtube_tags>comma, separated, list, of, highly, relevant, keywords, max 500 characters</youtube_tags>\n"
            "    <media_list>\n"
            "        <media type=\"video\" url=\"THE_EXACT_URL_RETURNED_BY_THE_TOOL\" prompt=\"Exact prompt string used\" />\n"
            "    </media_list>\n"
            "</final_deliverable>"
        )
    else:
        return (
            "<final_deliverable>\n"
            "    <post_caption>The complete, highly engaging text of the post. Use appropriate tone.</post_caption>\n"
            "    <hashtags>#Space #Separated #Hashtags</hashtags>\n"
            "    <media_list>\n"
            "        <media type=\"image\" url=\"THE_EXACT_URL_RETURNED_BY_THE_TOOL\" prompt=\"Exact prompt string used\" />\n"
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
    """Builds the master system prompt for the interleaved generation stream."""

    xml_template = _get_xml_template(target_format)
    
    # 1. Base Persona & Two-Phase Rule
    base_prompt = (
        "You are an elite Creative Director and Multimodal Storyteller. "
        "You must generate your response in TWO STRICT PHASES within a single output. But do not contain the \"PHASE 1\" or \"PHASE 2\" markers in your output.\n\n"
        "--- PHASE 1: STRATEGY & DIRECTOR'S COMMENTARY ---\n"
        "1. STRATEGY FIRST: Start by explaining your overall strategy for the text/script, tone, and pacing based on the user's input. Why are you choosing this specific hook or narrative structure?\n"
        "2. MEDIA EXECUTION (SHOW, DON'T TELL): After explaining the text strategy, begin interleaving your commentary with actual media generation. Whenever the narrative requires a visual, you MUST STOP writing text and IMMEDIATELY call the `generate_image` or `generate_video` tool.\n"
        "3. NEVER use text placeholders like '[Insert Image Here]'. You must actually execute the tool call.\n"
        "4. Once the tool execution returns a URL, continue your commentary, referencing the visual you just created but DO NOT output the URL string in your text.\n"
        "5. RICH FORMATTING: You MUST use rich Markdown formatting in this phase (But do not use any Markdown formatting inside the XML tags - Phase 2). Use **bolding** for emphasis, *italics* for creative directions, and bulleted lists for structural breakdowns. Make your commentary visually engaging to read.\n"
        "6. NO TECHNICAL JARGON: You are speaking to a Content Creator, NOT a software developer. NEVER expose internal tool names like 'generate_video', 'generate_image', or XML tags in your commentary. Instead of saying 'I will call generate_video', say 'Let's visualize this with a dynamic shot of...' or 'Here is how it will look:'. Keep the illusion of a human creative director alive.\n\n"
        "--- PHASE 2: THE FINAL DELIVERABLE (XML TAGS) ---\n"
        "Start with the <final_deliverable> tag and end with the </final_deliverable> tag.\n"
        "At the very end of your response, after all commentary and tool calls are finished, you MUST output the final, clean content wrapped strictly in XML tags.\n"
        f"CRITICAL CONSISTENCY: Use EXACTLY this XML structure tailored for the {target_format} format:\n\n"
        f"{xml_template}\n\n"
        "CRITICAL TEXT FORMATTING RULE (Remind): Do NOT use any Markdown formatting (like **, _, or #) inside the XML tags. Social media platforms do not support Markdown. Use strictly plain text with standard line breaks and spacing. EXCEPTION: You are ALLOWED to use the '#' symbol strictly for social media hashtags.\n"
        "CRITICAL MEDIA RULE: Inside the <media> tags, the 'url' attribute MUST be the exact URL returned to you by the tool in Phase 1.\n\n"
    )

    # 2. Format Injection
    format_guide = FORMAT_GUIDELINES.get(target_format, f"FORMAT: {target_format}. Adapt your tone and media usage appropriately.")
    base_prompt += f"--- FORMAT CONTEXT ---\n{format_guide}\n\n"

    # 3. Content Context
    base_prompt += f"--- CONTENT CONTEXT ---\nCORE TOPIC: {topic}\n"
    if style:
        base_prompt += f"VISUAL STYLE: {style}\n"
    if deep_description:
        base_prompt += f"DEEP DESCRIPTION / OUTLINE: {deep_description}\n"
        base_prompt += "Ensure you strictly follow the themes, mood, and instructions in the deep description.\n"

    # 4. Media Instructions
    if has_reference_images:
        if image_instructions:
            base_prompt += (
                "\nREFERENCE MEDIA INSTRUCTIONS: The user has provided reference images along with this instruction: "
                f"'{image_instructions}'. Use these instructions as creative guidance when calling media generation tools.\n"
            )

    return base_prompt

def build_enhance_text_prompt(
    target_format: str,
    main_field_label: str,
    target_field_label: str,
    target_field_text: str | None = None,
    extra_context: str | None = None,
) -> str:
    """Builds the system prompt for the enhance_text API."""
    existing_text_block = ""
    if target_field_text:
        existing_text_block = (
            f"\nThe target field currently contains: \"{target_field_text}\"\n"
            "CRITICAL RULE: Evaluate the text above carefully. "
            "If it contains meaningful ideas, expand, polish, and incorporate them into your brief. "
            "If it is random keystrokes or gibberish, COMPLETELY IGNORE IT.\n"
        )

    extra_block = f"\nAdditional context: {extra_context}\n" if extra_context else ""

    return (
        f"You are an expert creative director helping a user prepare a professional PROMPT/BRIEF for a downstream AI content generation system. "
        f"The target format is {target_format}. "
        f"Your task is to generate the optimal briefing content for the '{target_field_label}' field of their setup form.\n\n"
        f"The user's core idea is provided in the '{main_field_label}' field below.\n"
        f"{existing_text_block}"
        f"{extra_block}\n"
        "RULES:\n"
        "- Write a rich, descriptive paragraph detailing the core message, tone, visual elements, target audience, and mood.\n"
        "- DO NOT write the actual final social media post. You are writing INSTRUCTIONS and CONTEXT for the AI that will generate the final post.\n"
        "- ABSOLUTELY NO EMOJIS, NO STICKERS, and NO HASHTAGS. This is a technical backend brief.\n"
        "- Be concise, professional, and directly useful for the AI generator pipeline.\n"
        "- Do NOT include any meta-commentary, explanations, or formatting markers (like 'Here is the description:').\n"
        "- Return ONLY the final text content, nothing else.\n"
    )
