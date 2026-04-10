FROM python:3.10-slim

# System dependencies — dlib compile karne ke liye zaroori
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gcc \
    g++ \
    libopenblas-dev \
    liblapack-dev \
    libx11-6 \
    libx11-dev \
    libboost-python-dev \
    libboost-thread-dev \
    python3-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Step 1: pip + cmake upgrade
RUN pip install --no-cache-dir --upgrade pip cmake

# Step 2: dlib alag install karo (bina version pin ke)
RUN pip install --no-cache-dir dlib

# Step 3: baaki dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE $PORT

CMD gunicorn -w 4 -b 0.0.0.0:$PORT app:app --timeout 120 --preload
