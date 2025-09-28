**System Component to Code Module and LLM Utility Mapping**

**UI Layer**
- Gradio UI: Handles user input, diagram type selection, preview, and download.
  - Code: `GradioInterface` (to be implemented in the main app, e.g., [`Design_Drafter_streamlit_app.py`](Design_Drafter_streamlit_app.py:1) or a new UI module)
  - Interacts with: `ChatBotService` (service layer)

**Service Layer**
- ChatBotService: Orchestrates the flow from user request to diagram generation.
  - Code: New module/class, e.g., `Design_Drafter/service/chatbot_service.py`
  - Uses: `NLPParser`, `DiagramBuilder`
- NLPParser: Converts free text to UML constructs using LLM.
  - Code: New module/class, e.g., `Design_Drafter/service/nlp_parser.py`
  - Leverages: `llm_utils/aiweb_common/generate/ChatServicer.py`, `PromptAssembler.py` for LLM calls and prompt construction.
- DiagramBuilder: Builds PlantUML code from parsed model, manages validation and repair.
  - Code: New module/class, e.g., `Design_Drafter/service/diagram_builder.py`
  - Uses: `PlantUMLValidator`, `ThemeManager`, `PlantUmlClient`
- PlantUMLValidator & AutoRepairStrategy: Validate and repair PlantUML code.
  - Code: New module/class, e.g., `Design_Drafter/service/plantuml_validator.py`
  - Can leverage: LLM utilities for advanced repair (e.g., `ChatServicer` for LLM-based repair suggestions)
- ThemeManager: Supplies PlantUML themes.
  - Code: New module/class, e.g., `Design_Drafter/service/theme_manager.py`

**Infrastructure Layer**
- PlantUmlClient: Renders PlantUML code (remote or local).
  - Code: New module/class, e.g., `Design_Drafter/infrastructure/plantuml_client.py`
  - Implements: HTTP and local JAR rendering, with failover logic.
- Database, Auth, Monitoring: Standard integrations for user/session/history, authentication, and logging.
  - Code: To be implemented as needed, e.g., `Design_Drafter/infrastructure/db.py`, `auth.py`, `monitoring.py`

**Supporting Services**
- DownloadController: Serves images to the UI.
  - Code: Part of UI or a small API endpoint.

**LLM Utility Integration**
- All LLM calls (NLP parsing, auto-repair, possibly chat-based help) should use the `llm_utils/aiweb_common/generate/` classes:
  - `ChatServicer` for conversational LLM calls.
  - `PromptAssembler` for prompt construction.
  - `QueryInterface` for abstraction.
  - `ObjectFactory` for extensibility (e.g., plugin new diagram types).
  - `WorkflowHandler` for orchestrating multi-step flows and logging.

This mapping ensures that all LLM-related logic is centralized and reusable, following the project's coding standards and leveraging the common codebase.

Next steps: Specify in detail how and where to leverage these LLM interface classes in the design.