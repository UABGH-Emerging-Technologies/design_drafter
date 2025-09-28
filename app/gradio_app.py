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

# Import LLM utilities (reuse before you write)
from aiweb_common.generate.ChatServicer import ChatServicer
from aiweb_common.generate.PromptAssembler import PromptAssembler
from aiweb_common.WorkflowHandler import manage_sensitive

# Import config and LangChain LLM
from Design_Drafter.config.config import Design_DrafterConfig
from langchain_openai import ChatOpenAI

# Placeholder for service layer classes (to be implemented)
# from Design_Drafter.service.nlp_parser import NLPParser
# from Design_Drafter.service.diagram_builder import DiagramBuilder
# from Design_Drafter.service.plantuml_validator import PlantUMLValidator

DIAGRAM_TYPES = [
    "Use Case",
    "Class",
    "Activity",
    "Component",
    "Deployment",
    "State Machine",
    "Timing",
    "Sequence"
]

def generate_diagram(description: str, diagram_type: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Main handler for diagram generation.
    Returns: (PlantUML code, image URL, status message)
    """
    # Step 1: NLP Parsing (LLM)
    prompt = PromptAssembler.assemble_prompt(
        system_prompt=f"Convert the following description into a PlantUML {diagram_type} diagram.",
        user_prompt=description
    )

    # Securely retrieve the API key using manage_sensitive
    try:
        api_key = manage_sensitive("OPENAI_API_KEY")
    except KeyError:
        return (
            "",
            None,
            "OpenAI API key not found. Please ensure it is available via /run/secrets, /workspaces/*/secrets, or as an environment variable."
        )

    # Instantiate the LLM interface
    llm = ChatOpenAI(
        openai_api_key=api_key,
        model=Design_DrafterConfig.LLM_MODEL,
        openai_api_base=Design_DrafterConfig.LLM_API_BASE,
        temperature=0.2,
        max_tokens=512,
    )

    # Use ChatServicer to get PlantUML code from LLM
    chat_servicer = ChatServicer(language_model_interface=llm, prompt=prompt)
    try:
        # The expected input for generate_langchain_response is a list of messages
        response, _ = chat_servicer.generate_langchain_response(
            [{"role": "user", "content": description}]
        )
        plantuml_code = response.strip()
        status_msg = "Diagram generated successfully using LLM."
    except Exception as e:
        plantuml_code = f"@startuml\n' {diagram_type} diagram\n' {description}\n@enduml"
        status_msg = f"LLM error: {e}. Showing fallback stub."

    # Step 3: Render PlantUML (use public PlantUML server for demo)
    import urllib.parse
    encoded = urllib.parse.quote(plantuml_code)
    image_url = f"http://138.26.48.104:8080//plantuml/png/{encoded}"

    # Step 4: Return results
    return plantuml_code, image_url, status_msg

import os

with gr.Blocks(title="UML Diagram Generator") as demo:
    gr.Markdown("# UML Diagram Generator")

    with gr.Row():
        description = gr.Textbox(label="Diagram Description", lines=6, placeholder="Describe your UML diagram...")
        diagram_type = gr.Dropdown(label="Diagram Type", choices=DIAGRAM_TYPES, value=DIAGRAM_TYPES[0])
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