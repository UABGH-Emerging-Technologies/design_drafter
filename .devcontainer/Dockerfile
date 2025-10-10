# Base from Microsoft DevContainers Miniconda Python image
ARG VARIANT="3.11-bullseye"
FROM mcr.microsoft.com/devcontainers/python:0-${VARIANT}

# [Choice] Node.js version is set via build ARG; keep as in your original
ARG NODE_VERSION="none"
RUN if [ "${NODE_VERSION}" != "none" ]; then su vscode -c "umask 0002 && . /usr/local/share/nvm/nvm.sh && nvm install ${NODE_VERSION} 2>&1"; fi

# System dependencies for image/PIL support & other scientific deps
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        sqlite3 \
        cmake \
        graphviz \
        pandoc \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Optionally copy any local fonts if you want to use custom ones:
# COPY fonts /usr/share/fonts/truetype/custom-fonts

# Install Python requirements as vscode
USER vscode

