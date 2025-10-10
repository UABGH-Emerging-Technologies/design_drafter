#!/bin/bash
# Install uv globally first
curl -LsSf https://astral.sh/uv/install.sh | sh

make venv

# Auto-activate the venv for new shells
echo 'source /workspaces/Design_Drafter/.venv/bin/activate' >> /home/vscode/.bashrc
echo 'source /workspaces/Design_Drafter/.venv/bin/activate' >> /home/vscode/.zshrc

# Set PYTHONPATH for local modules
echo 'export PYTHONPATH="/workspaces/Design_Drafter/llm_utils:${PYTHONPATH}"' >> ~/.profile

# MLFlow setup
export MLFLOW_TRACKING_URI="http://138.26.48.232:5000/"

# Now, start the Gradio app
# us relative path from project root
source .venv/bin/activate && \
    python gradio_app.py