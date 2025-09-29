"""
Gradio-based UML Diagram Generator App

- Accepts free-text description and diagram type
- Uses LLM-based NLPParser (llm_utils/aiweb_common/generate)
- Orchestrates DiagramBuilder, Validator, PlantUML rendering, and preview/download
"""

import gradio as gr
from typing import Tuple, Optional

# Workaround for local llm_utils and Design_Drafter import
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / "llm_utils"))
sys.path.append(str(Path(__file__).parent.parent))

# Import config and LangChain LLM
from Design_Drafter.config.config import Design_DrafterConfig
from langchain_openai import ChatOpenAI

# Import UMLDraftHandler for diagram generation
from Design_Drafter.uml_draft_handler import UMLDraftHandler

# Use config for diagram types

def generate_diagram(description: str, diagram_type: str, theme: Optional[str] = None) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Main handler for diagram generation.
    Returns: (PlantUML code, image URL, status message)
    """
    # Securely retrieve the API key using manage_sensitive
    
    try:
        api_key = Design_DrafterConfig.LLM_API_KEY
    except KeyError:
        return (
            "",
            None,
            Design_DrafterConfig.API_KEY_MISSING_MSG
        )

    # Instantiate the LLM interface (must provide .invoke())
    llm = ChatOpenAI(
        openai_api_key=api_key,
        model=Design_DrafterConfig.LLM_MODEL,
        openai_api_base=Design_DrafterConfig.LLM_API_BASE,
        temperature=0.2,
        max_tokens=5000,
    )

    # Instantiate UMLDraftHandler
    handler = UMLDraftHandler()

    # Generate diagram using handler
    try:
        plantuml_code = handler.process(
            diagram_type=diagram_type,
            description=description,
            theme=theme,
            llm_interface=llm
        )
        print("PLANTUML - ", plantuml_code)
        status_msg = Design_DrafterConfig.DIAGRAM_SUCCESS_MSG
    except Exception as e:
        plantuml_code = Design_DrafterConfig.FALLBACK_PLANTUML_TEMPLATE.format(
            diagram_type=diagram_type, description=description
        )
        status_msg = f"LLM error: {e}. Showing fallback stub."

    # Render PlantUML (use public PlantUML server for demo)
    import urllib.parse
    encoded = urllib.parse.quote(plantuml_code)
    image_url = Design_DrafterConfig.PLANTUML_SERVER_URL_TEMPLATE.format(encoded=encoded)

    # Return results
    return plantuml_code, image_url, status_msg


with gr.Blocks(title="UML Diagram Generator") as demo:
    gr.Markdown("# UML Diagram Generator")

    with gr.Row():
        description = gr.Textbox(label="Diagram Description", lines=6, placeholder="Describe your UML diagram...")
        diagram_type = gr.Dropdown(
            label="Diagram Type",
            choices=Design_DrafterConfig.DIAGRAM_TYPES,
            value=Design_DrafterConfig.DIAGRAM_TYPES[0]
        )
    with gr.Row():
        gr.Markdown("**Click to send your description to the LLM and generate a UML diagram.**")
        generate_btn = gr.Button("Send to LLM")
    with gr.Row():
        plantuml_code = gr.Code(label="Generated PlantUML Code")
        image = gr.Image(label="Diagram Preview")
    status = gr.Markdown("")

    def on_generate(desc, dtype):
        code, img_url, msg = generate_diagram(desc, dtype)
        return code, img_url, msg

    generate_btn.click(
        fn=on_generate,
        inputs=[description, diagram_type],
        outputs=[plantuml_code, image, status]
    )

if __name__ == "__main__":
    demo.launch()