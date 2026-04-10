<<<<<<< HEAD
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
=======
FROM python:3.11-slim

# System dependencies — dlib aur face_recognition ke liye zaroori
RUN apt-get update && apt-get install -y \
    cmake \
    gcc \
    g++ \
    libx11-6 \
    libx11-dev \
    libopenblas-dev \
    liblapack-dev \
    libboost-python-dev \
    libboost-thread-dev \
>>>>>>> 0f54abf3c6c7cf540a1118e7f542449c96e7d9f6
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

<<<<<<< HEAD
# Step 1: pip + cmake upgrade
RUN pip install --no-cache-dir --upgrade pip cmake

# Step 2: dlib alag install karo (bina version pin ke)
RUN pip install --no-cache-dir dlib

# Step 3: baaki dependencies
=======
# dlib pehle alag install karo (time lagta hai)
RUN pip install --no-cache-dir cmake
RUN pip install --no-cache-dir dlib==19.24.2
>>>>>>> 0f54abf3c6c7cf540a1118e7f542449c96e7d9f6
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE $PORT

CMD gunicorn -w 4 -b 0.0.0.0:$PORT app:app --timeout 120 --preload
