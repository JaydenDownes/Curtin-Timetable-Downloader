#!/bin/bash

# Install Python dependencies
pip install -r requirements.txt

# Run the Python script to render templates and move static files
python render_static_site.py
