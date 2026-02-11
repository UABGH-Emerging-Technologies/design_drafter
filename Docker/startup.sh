#!/bin/bash
# Install uv globally first (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# Ensure .venv is writable and created (idempotent)
if [ -d "/workspaces/UMLBot/.venv" ] && [ ! -w "/workspaces/UMLBot/.venv" ]; then
    if command -v sudo >/dev/null 2>&1; then
        sudo chown -R vscode:vscode /workspaces/UMLBot/.venv
    else
        echo ".venv exists but is not writable and sudo is unavailable."
        exit 1
    fi
fi
if [ ! -d "/workspaces/UMLBot/.venv" ] || [ ! -f "/workspaces/UMLBot/.venv/bin/activate" ]; then
    rm -rf /workspaces/UMLBot/.venv
    if command -v make >/dev/null 2>&1; then
        make -B venv
    elif command -v uv >/dev/null 2>&1; then
        uv venv /workspaces/UMLBot/.venv
    else
        python3 -m venv /workspaces/UMLBot/.venv
    fi
fi

# Check for npm and install Node dependencies (fail fast if missing)
if ! command -v npm &> /dev/null; then
    echo "npm not found. Node.js should be installed via devcontainer config (NODE_VERSION=18)."
    exit 1
fi

# Ensure node_modules is writable (named volume may be root-owned)
REPO_DIR="/workspaces/UMLBot"
FRONTEND_DIR="${REPO_DIR}/app/frontend"
cd "$FRONTEND_DIR"
if [ -d "node_modules" ] && [ ! -w "node_modules" ]; then
    if command -v sudo >/dev/null 2>&1; then
        sudo chown -R vscode:vscode "$FRONTEND_DIR/node_modules"
    else
        echo "node_modules is not writable and sudo is unavailable."
        exit 1
    fi
fi
if [ -d "/home/vscode/.npm" ] && [ ! -w "/home/vscode/.npm" ]; then
    if command -v sudo >/dev/null 2>&1; then
        sudo chown -R vscode:vscode /home/vscode/.npm
    else
        echo "/home/vscode/.npm is not writable and sudo is unavailable."
        exit 1
    fi
fi

# Install/update Node/TypeScript dependencies for frontend
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# Build the production Next.js bundle required by `npm start`
if ! npm run build; then
    echo "Next.js build failed; see errors above."
    exit 1
fi

# Auto-activate the venv for new shells (append to shell rc files)
echo 'source /workspaces/UMLBot/.venv/bin/activate' >> /home/vscode/.bashrc
echo 'source /workspaces/UMLBot/.venv/bin/activate' >> /home/vscode/.zshrc

# Set PYTHONPATH for local modules (for Python import resolution)
echo 'export PYTHONPATH="/workspaces/UMLBot/llm_utils:${PYTHONPATH}"' >> ~/.profile

# MLFlow setup (tracking URI for MLFlow experiments)
#export MLFLOW_TRACKING_URI="http://localhost:5000/"

# Start the Gradio API (background) and TypeScript app
if [ -f "/workspaces/UMLBot/.venv/bin/activate" ]; then
    source /workspaces/UMLBot/.venv/bin/activate
else
    echo "Python virtualenv not found at /workspaces/UMLBot/.venv/bin/activate"
    exit 1
fi

# Load local environment variables if present
if [ -f "/workspaces/UMLBot/.env" ]; then
    set -a
    source /workspaces/UMLBot/.env
    set +a
fi

# Launch the Gradio API backend
export NEXT_PUBLIC_GRADIO_API_BASE="http://127.0.0.1:7860"
cd "$REPO_DIR"
uvicorn gradio_app:app --host 0.0.0.0 --port 7860 &
GRADIO_PID=$!
echo "Started Gradio backend (PID $GRADIO_PID)"

cd "$FRONTEND_DIR" && exec npm start
